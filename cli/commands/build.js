/*
 * build.js: Titanium Mobile CLI build command
 *
 * Copyright (c) 2012-2017, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

'use strict';

const appc = require('node-appc'),
	fields = require('fields'),
	fs = require('fs-extra'),
	jsanalyze = require('node-titanium-sdk/lib/jsanalyze'),
	path = require('path'),
	sprintf = require('sprintf'),
	ti = require('node-titanium-sdk'),
	tiappxml = require('node-titanium-sdk/lib/tiappxml'),
	semver = require('semver'),
	__ = appc.i18n(__dirname).__;

fields.setup({
	formatters: {
		error: function (err) {
			if (err instanceof Error) {
				return ('[ERROR] ' + err.message).red + '\n';
			}
			err = '' + err;
			return '\n' + (/^(\[ERROR\])/i.test(err) ? err : '[ERROR] ' + err.replace(/^Error:/i, '').trim()).red;
		}
	},
	style: {
		accelerator: 'cyan'
	}
});

exports.cliVersion = '>=3.2.1';
exports.title = __('Build');
exports.desc = __('builds a project');
exports.extendedDesc = __('Builds an existing app or module project.');

exports.config = function config(logger, config, cli) {
	fields.setup({ colors: cli.argv.colors });

	// start patching the logger here
	patchLogger(logger, cli);

	return function (finished) {
		cli.createHook('build.config', function (callback) {
			// note: it's currently impossible for the module build to declare any
			// config options/flags.
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
						},
						'source-maps': {
							desc: __('generate inline source maps for transpiled JS files')
						},
					},
					options: appc.util.mix({
						platform: {
							abbr: 'p',
							callback: function (platform) {
								if (!cli.argv.$originalPlatform) {
									cli.argv.$originalPlatform = platform;
								}
								platform = cli.argv.platform = ti.resolvePlatform(platform);

								const p = platformConf[platform];
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
									} else if (ti.availablePlatforms.indexOf(platform) === -1) {
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
								if (projectDir === '') {
									// no option value was specified
									// set project dir to current directory
									projectDir = conf.options['project-dir'].default;
								}

								projectDir = appc.fs.resolvePath(projectDir);

								// load the tiapp.xml/timodule.xml
								if (fs.existsSync(path.join(projectDir, 'tiapp.xml'))) {
									let tiapp;
									try {
										tiapp = cli.tiapp = new tiappxml(path.join(projectDir, 'tiapp.xml'));
									} catch (ex) {
										logger.error(ex);
										logger.log();
										process.exit(1);
									}

									tiapp.properties || (tiapp.properties = {});

									// make sure the tiapp.xml is sane
									ti.validateTiappXml(logger, config, tiapp);

									// check that the Titanium SDK version is correct
									if (!ti.validateCorrectSDK(logger, config, cli, 'build')) {
										throw new cli.GracefulShutdown();
									}

									cli.argv.type = 'app';

								} else if (fs.existsSync(path.join(projectDir, 'timodule.xml'))) {
									let timodule;
									try {
										timodule = cli.tiapp = cli.timodule = new tiappxml(path.join(projectDir, 'timodule.xml'));
									} catch (ex) {
										logger.error(ex);
										logger.log();
										process.exit(1);
									}

									const manifest = cli.manifest = ti.loadModuleManifest(logger, path.join(projectDir, 'manifest'));

									// if they didn't explicitly set --platform and we have a platform in the manifest,
									// then just use that and skip the platform prompting
									if (!cli.argv.platform && manifest.platform) {
										cli.argv.platform = ti.resolvePlatform(manifest.platform);
										conf.options.platform.required = false;
									}

									timodule.properties || (timodule.properties = {});

									cli.argv.type = 'module';

								} else {
									// neither app nor module
									return;
								}

								cli.scanHooks(path.join(projectDir, 'hooks'));

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
									ignoreDirs: new RegExp(config.get('cli.ignoreDirs')), // eslint-disable-line security/detect-non-literal-regexp
									ignoreFiles: /.*/,
									validate: conf.options['project-dir'].validate
								}));
							},
							required: true,
							validate: function (projectDir, callback) {
								const isDefault = (projectDir == conf.options['project-dir'].default); // eslint-disable-line eqeqeq
								let dir = appc.fs.resolvePath(projectDir);

								if (!fs.existsSync(dir)) {
									return callback(new Error(__('Project directory does not exist')));
								}

								const root = path.resolve('/');
								let isFound,
									projDir = dir;

								[ 'tiapp.xml', 'timodule.xml' ].some(function (tiXml) { // eslint-disable-line array-callback-return

									let tiFile = path.join(dir, tiXml);

									while (!fs.existsSync(tiFile)) {
										dir = path.dirname(dir);
										if (dir == root) { // eslint-disable-line eqeqeq
											isFound = false;
											break;
										}
										tiFile = path.join(dir, tiXml);
									}

									// Found the xml file, break the loop
									if (fs.existsSync(tiFile)) {
										isFound = true;
										return true;
									}

									dir = projDir;
								});

								if (!isFound && dir == root && isDefault) { // eslint-disable-line eqeqeq
									callback(true);
									return;
								}

								if (!isFound) {
									callback(new Error(__('Invalid project directory "%s" because tiapp.xml or timodule.xml not found', projectDir)));
									return;
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

exports.validate = function validate(logger, config, cli) {

	// Determine if the project is an app or a module, run appropriate build command
	if (cli.argv.type === 'module') {

		// make sure the module manifest is sane
		ti.validateModuleManifest(logger, cli, cli.manifest);

		return function (finished) {
			logger.log.init(function () {
				const result = ti.validatePlatformOptions(logger, config, cli, 'buildModule');
				if (result && typeof result === 'function') {
					result(finished);
				} else {
					finished(result);
				}
			});
		};

	} else {

		ti.validatePlatform(logger, cli, 'platform');

		// since we need validate() to be async, we return a function in which the cli
		// will immediately call
		return function (finished) {
			logger.log.init(function () {
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
				const result = ti.validatePlatformOptions(logger, config, cli, 'build');
				if (result && typeof result === 'function') {
					result(next);
				} else {
					next(result);
				}
			});
		};
	}
};

exports.run = function run(logger, config, cli, finished) {
	const buildFile = cli.argv.type === 'module' ? '_buildModule.js' : '_build.js',
		platform = ti.resolvePlatform(cli.argv.platform),
		buildModule = path.join(__dirname, '..', '..', platform, 'cli', 'commands', buildFile);

	if (!fs.existsSync(buildModule)) {
		logger.error(__('Unable to find platform specific build command') + '\n');
		logger.log(__('Your SDK installation may be corrupt. You can reinstall it by running \'%s\'.', (cli.argv.$ + ' sdk install --force --default').cyan) + '\n');
		process.exit(1);
	}

	if (config.get('cli.sendAPIUsage', true)) {
		cli.on('build.finalize', function (builder) {
			const deployType = builder.deployType || cli.argv['deploy-type'] || null;
			if (deployType === 'production') {
				cli.addAnalyticsEvent('Titanium API Usage', {
					platform: platform,
					tisdkname: (ti.manifest && ti.manifest.name) || (cli.sdk && cli.sdk.name) || null,
					tisdkver: (ti.manifest && ti.manifest.version) || (cli.sdk && cli.sdk.name) || null,
					deployType: deployType,
					target: builder.target || cli.argv.target || null,
					usage: jsanalyze.getAPIUsage()
				}, 'ti.apiusage');
			}
		});
	}

	let counter = 0;
	require(buildModule).run(logger, config, cli, function (err) { // eslint-disable-line security/detect-non-literal-require
		if (!counter++) {
			const delta = appc.time.prettyDiff(cli.startTime, Date.now());
			if (err) {
				logger.error(__('An error occurred during build after %s', delta));
				if (err instanceof appc.exception) {
					err.dump(logger.error);
				} else if (err !== true) {
					(err.message || err.toString()).trim().split('\n').forEach(function (msg) {
						logger.error(msg);
					});
				}
				logger.log();
				logger.log.end();
				process.exit(1);
			} else {
				// eventually all platforms will just show how long the build took since they
				// are responsible for showing the own logging
				if (platform !== 'iphone' || cli.argv['build-only']) {
					logger.info(__('Project built successfully in %s', delta.cyan) + '\n');
				}
				logger.log.end();
			}

			finished();
		}
	});
};

/**
 * Monkey-patch the logger object to enable file logging during build
 * @param {Object} logger - The logger instance
 * @param {Object} cli - The CLI instance
 */
function patchLogger(logger, cli) {
	var origLoggerLog = logger.log;

	// override the existing log function
	logger.log = function patchedLog() {
		// most of this copied from the CLI's logger.js logger.log() function
		var args = Array.prototype.slice.call(arguments),
			padLevels = logger.padLevels,
			prefix;

		// if there are no args (i.e. a blank line), we need at least one space
		args.length || args.unshift(' ');

		// if we're not being called from info/warn/error/debug, then set this as a general log entry
		args[0] in logger.levels || args.unshift('_');

		// turn off padding
		logger.padLevels = args[0] !== '_';

		// get rid of any null args
		while (args.length && args[args.length - 1] == null) { // eslint-disable-line
			args.pop();
		}

		// if we're logging an error, we need to cast to a string so that sprintf doesn't complain
		if (args[1] instanceof Error || Object.prototype.toString.call(args[1]) === '[object Error]') {
			args[1] = (args[1].stack || args[1].toString()) + '\n';
		} else if (args[1] === null || args[1] === undefined) {
			args[1] = '';
		}

		typeof type !== 'string' && (args[1] = '' + args[1]);

		// add [INFO] type prefixes for each line
		prefix = (args[0] !== '_') ? '[' + args[0].toUpperCase() + ']' + ((args[0].length === 5) ? '  ' : '   ') : '';

		if (logger.fileWriteEnabled) {
			if (logger.log.filestream) {
				if (logger.log.buffer) {
					logger.log.filestream.write(logger.log.buffer);
					logger.log.buffer = null;
				}

				// log it to our log file, stripping out the color codes
				logger.log.filestream.write('\n' + prefix + (args.length > 2 ? sprintf.apply(null, args.slice(1)) : args[1]).replace(/\x1B\[\d+m/g, '')); // eslint-disable-line no-control-regex
			} else {
				logger.log.buffer += '\n' + prefix + args[1].replace(/\x1B\[\d+m/g, ''); // eslint-disable-line no-control-regex
			}
		}

		// call the original logger with our cleaned up args
		origLoggerLog.apply(logger, arguments);

		// restore padding
		logger.padLevels = padLevels;
	};

	logger.log.init = function (callback) {
		var platform = ti.resolvePlatform(cli.argv.platform),
			buildDir = path.join(cli.argv['project-dir'], 'build');

		logger.fileWriteEnabled = true;

		fs.ensureDirSync(buildDir, 0o766);

		// create our write stream
		logger.log.filestream = fs.createWriteStream(path.join(buildDir, 'build_' + platform + '.log'), { flags: 'w', encoding: 'utf8', mode: 0o666 });

		function styleHeading(s) {
			return ('' + s).bold;
		}

		function styleValue(s) {
			return ('' + s).magenta;
		}

		function rpad(s) {
			return appc.string.rpad(s, 27);
		}

		cli.env.getOSInfo(function (osInfo) {
			logger.log([
				new Date().toLocaleString(),
				'',
				styleHeading(__('Operating System')),
				'  ' + rpad(__('Name'))            + ' = ' + styleValue(osInfo.os),
				'  ' + rpad(__('Version'))         + ' = ' + styleValue(osInfo.osver),
				'  ' + rpad(__('Architecture'))    + ' = ' + styleValue(osInfo.ostype),
				'  ' + rpad(__('# CPUs'))          + ' = ' + styleValue(osInfo.oscpu),
				'  ' + rpad(__('Memory'))          + ' = ' + styleValue(osInfo.memory),
				'',
				styleHeading(__('Node.js')),
				'  ' + rpad(__('Node.js Version')) + ' = ' + styleValue(osInfo.node),
				'  ' + rpad(__('npm Version'))     + ' = ' + styleValue(osInfo.npm),
				'',
				styleHeading(__('Titanium CLI')),
				'  ' + rpad(__('CLI Version'))     + ' = ' + styleValue(cli.version),
				'',
				styleHeading(__('Titanium SDK')),
				'  ' + rpad(__('SDK Version'))     + ' = ' + styleValue(cli.argv.sdk),
				'  ' + rpad(__('SDK Path'))        + ' = ' + styleValue(cli.sdk.path),
				'  ' + rpad(__('Target Platform')) + ' = ' + styleValue(ti.resolvePlatform(cli.argv.platform)),
				'',
				styleHeading(__('Command')),
				'  ' + styleValue(process.argv.join(' ')),
				''
			].join('\n'));

			logger.log.flush();
			callback();
		});
	};

	logger.log.flush = function () {
		if (logger.log.filestream && logger.log.buffer && logger.fileWriteEnabled) {
			logger.log.filestream.write(logger.log.buffer);
			logger.log.buffer = null;
			logger.log.filestream.end();
		}
	};

	logger.log.end = function () {
		logger.log.filestream && logger.log.filestream.end();
		logger.fileWriteEnabled = false;
	};

	logger.log.buffer = '';
}
