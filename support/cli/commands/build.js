/*
 * build.js: Titanium Mobile CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	__ = appc.i18n(__dirname).__,
	afs = appc.fs,
	ti = require('titanium-sdk'),
	fs = require('fs'),
	path = require('path');

// TODO: need to support building modules... how do we know if --dir is a module or app? where is the module _build.js located?

exports.cliVersion = '>=3.X';
exports.title = __('Build');
exports.desc = __('builds a project');
exports.extendedDesc = 'Builds an existing app or module project.';

exports.config = function (logger, config, cli) {
	return function (finished) {
		cli.createHook('build.config', function (callback) {
			ti.platformOptions(logger, config, cli, 'build', function (platformConf) {
				callback({
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
							desc: __('build using the old Python-based builder.py')
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
								return ti.resolvePlatform(platform);
							},
							desc: __('the target build platform'),
							hint: __('platform'),
							prompt: {
								label: __('Target platform'),
								error: __('Invalid platform'),
								validator: function (platform) {
									if (!platform) {
										throw new appc.exception(__('Invalid platform'));
									}

									platform = platform.trim();

									// temp: ti.availablePlatforms contains "iphone" and "ipad" which aren't going to be valid supported platforms
									if (ti.availablePlatforms.indexOf(platform) == -1) {
										throw new appc.exception(__('Invalid platform: %s', platform));
									}

									// now that we've passed the validation, transform and continue
									platform = ti.resolvePlatform(platform);

									// it's possible that platform was not specified at the command line in which case the it would
									// be prompted for. that means that validate() was unable to apply default values for platform-
									// specific options and scan for platform-specific hooks, so we must do it here.

									var p = platformConf[platform];
									p && p.options && Object.keys(p.options).forEach(function (name) {
										if (p.options[name].default && cli.argv[name] === undefined) {
											cli.argv[name] = p.options[name].default;
										}
									});

									cli.scanHooks(afs.resolvePath(path.dirname(module.filename), '..', '..', platform, 'cli', 'hooks'));

									return true;
								}
							},
							required: true,
							skipValueCheck: true,
							values: ti.targetPlatforms
						},
						'project-dir': {
							abbr: 'd',
							desc: __('the directory containing the project'),
							default: '.'
						}
					}, ti.commonOptions(logger, config)),
					platforms: platformConf
				});
			});
		})(function (err, results, result) {
			finished(result);
		});
	};
};

exports.validate = function (logger, config, cli) {
	// TODO: set the type to 'app' for now, but we'll need to determine if the project is an app or a module
	cli.argv.type = 'app';

	ti.validatePlatform(logger, cli, 'platform');

	return function (finished) {
		function next(result) {
			if (result) {
				console.log('loading plugins');
				ti.loadPlugins(logger, config, cli, cli.argv['project-dir'], function () {
					console.log('plugins loaded');
					finished(result);
				});
			} else {
				finished(result);
			}
		}

		var result = ti.validatePlatformOptions(logger, config, cli, 'build');
		if (result && typeof result == 'function') {
			result(next);
		} else {
			next(result);
		}
	};
};

exports.run = function (logger, config, cli) {
	var buildModule = path.join(__dirname, '..', '..', ti.resolvePlatform(cli.argv.platform), 'cli', 'commands', '_build.js');

	if (!fs.existsSync(buildModule)) {
		logger.error(__('Unable to find platform specific build command') + '\n');
		logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}

	require(buildModule).run(logger, config, cli, function (err) {
		var delta = appc.time.prettyDiff(cli.startTime, Date.now());
		if (err) {
			logger.error(__('Project failed to build after %s', delta) + '\n');
			process.exit(1);
		} else {
			logger.info(__('Project built successfully in %s', delta) + '\n');
		}
	});
};
