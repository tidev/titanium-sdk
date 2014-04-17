/*
 * build.js: Titanium Mobile CLI build command
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	fields = require('fields'),
	fs = require('fs'),
	path = require('path'),
	ti = require('titanium-sdk'),
	tiappxml = require('titanium-sdk/lib/tiappxml'),
	__ = appc.i18n(__dirname).__;

fields.setup({
	formatters: {
		error: function (err) {
			if (err instanceof Error) {
				return ('[ERROR] ' + err.message).red + '\n';
			}
			err = '' + err;
			return '\n' + (/^(\[ERROR\])/i.test(err) ? err : '[ERROR] ' + err.replace(/^Error\:/i, '').trim()).red;
		}
	},
	style: {
		accelerator: 'cyan'
	}
});

exports.cliVersion = '>=3.2.1';
exports.title = __('Build');
exports.desc = __('builds a project');
exports.extendedDesc = 'Builds an existing app or module project.';

exports.config = function (logger, config, cli) {
	return function (finished) {
		cli.createHook('build.config', function (callback) {
			ti.platformOptions(logger, config, cli, 'build', function (platformConf) {
				var conf = {
					flags: {
						'build-only': {
							abbr: 'b',
							desc: __('only perform the build; if true, does not install or run the app')
						},
						force: {
							abbr: 'f',
							desc: __('force a full rebuild')
						},
						legacy: {
							desc: __('build using the old Python-based builder.py; deprecated')
						},
						'skip-js-minify': {
							default: false,
							desc: __('bypasses JavaScript minification; %s builds are never minified; only supported for %s and %s', 'simulator'.cyan, 'Android'.cyan, 'iOS'.cyan)
						}
					},
					options: appc.util.mix({
						platform: {
							abbr: 'p',
							callback: function (platform) {
								cli.argv.$originalPlatform = platform;
								platform = ti.resolvePlatform(platform);

								var p = platformConf[platform];
								p && p.options && Object.keys(p.options).forEach(function (name) {
									if (p.options[name].default && cli.argv[name] === undefined) {
										cli.argv[name] = p.options[name].default;
									}
								});

								return platform;
							},
							desc: __('the target build platform'),
							hint: __('platform'),
							order: 2,
							prompt: {
								label: __('Target platform'),
								error: __('Invalid platform'),
								validator: function (platform) {
									if (!platform) {
										throw new Error(__('Invalid platform'));
									} else if (ti.availablePlatforms.indexOf(platform) == -1) {
										throw new Error(__('Invalid platform: %s', platform));
									}
									return true;
								}
							},
							required: true,
							skipValueCheck: true,
							values: ti.targetPlatforms
						},
						'project-dir': {
							abbr: 'd',
							callback: function (projectDir) {
								// load the tiapp.xml
								try {
									var tiapp = cli.tiapp = new tiappxml(path.join(projectDir, 'tiapp.xml'));
								} catch (ex) {
									logger.error(ex);
									logger.log();
									process.exit(1);
								}

								tiapp.properties || (tiapp.properties = {});

								// make sure the tiapp.xml is sane
								ti.validateTiappXml(logger, config, tiapp);

								return projectDir;
							},
							desc: __('the directory containing the project'),
							default: process.env.SOURCE_ROOT ? path.join(process.env.SOURCE_ROOT, '..', '..') : '.',
							order: 1,
							prompt: function (callback) {
								callback(fields.file({
									promptLabel: __('Where is the __project directory__?'),
									complete: true,
									showHidden: true,
									ignoreDirs: new RegExp(config.get('cli.ignoreDirs')),
									ignoreFiles: /.*/,
									validate: conf.options['project-dir'].validate
								}));
							},
							required: true,
							validate: function (projectDir, callback) {
								var isDefault = projectDir == conf.options['project-dir'].default;

								var dir = appc.fs.resolvePath(projectDir);

								if (!fs.existsSync(dir)) {
									return callback(new Error(__('Project directory does not exist')));
								}

								var tiappFile = path.join(dir, 'tiapp.xml');

								// try to find the tiapp.xml
								while (!fs.existsSync(tiappFile)) {
									dir = path.dirname(dir);
									if (dir == '/') {
										if (!isDefault) {
											callback(new Error(__('Invalid project directory "%s" because tiapp.xml not found', projectDir)));
											return;
										} else {
											callback(true);
											return;
										}
									}
									tiappFile = path.join(dir, 'tiapp.xml');
								}

								callback(null, dir);
							}
						}
					}, ti.commonOptions(logger, config)),
					platforms: platformConf
				};
				callback(null, conf);
			});
		})(function (err, result) {
			finished(result);
		});
	};
};

exports.validate = function (logger, config, cli) {
	// TODO: set the type to 'app' for now, but we'll need to determine if the project is an app or a module
	cli.argv.type = 'app';

	// check that the Titanium SDK version is correct
	if (!ti.validateCorrectSDK(logger, config, cli, 'build')) {
		return false;
	}

	ti.validatePlatform(logger, cli, 'platform');

	// since we need validate() to be async, we return a function in which the cli
	// will immediately call
	return function (finished) {
		function next(result) {
			if (result !== false) {
				// no error, load the tiapp.xml plugins
				ti.loadPlugins(logger, config, cli, cli.argv['project-dir'], function () {
					finished(result);
				});
			} else {
				finished(result);
			}
		}

		// loads the platform specific bulid command and runs its validate() function
		var result = ti.validatePlatformOptions(logger, config, cli, 'build');
		if (result && typeof result == 'function') {
			result(next);
		} else {
			next(result);
		}
	};
};

exports.run = function (logger, config, cli) {
	var buildModule = path.join(__dirname, '..', '..', ti.resolvePlatform(cli.argv.platform), 'cli', 'commands', '_build.js'),
		counter = 0;

	if (!fs.existsSync(buildModule)) {
		logger.error(__('Unable to find platform specific build command') + '\n');
		logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}

	require(buildModule).run(logger, config, cli, function (err) {
		if (!counter++) {
			var delta = appc.time.prettyDiff(cli.startTime, Date.now());
			if (err) {
				logger.error(__('Project failed to build after %s', delta) + '\n');
				process.exit(1);
			} else {
				logger.info(__('Project built successfully in %s', delta.cyan) + '\n');
			}
		}
	});
};
