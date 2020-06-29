/*
 * clean.js: Titanium Mobile CLI clean command
 *
 * Copyright (c) 2012-2018, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

'use strict';

const appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	ti = require('node-titanium-sdk'),
	fs = require('fs-extra'),
	path = require('path'),
	sprintf = require('sprintf'),
	async = require('async'),
	tiappxml = require('node-titanium-sdk/lib/tiappxml');

exports.cliVersion = '>=3.2.1';
exports.desc = __('removes previous build directories');

exports.config = function (logger, config, cli) {
	// start patching the logger here
	patchLogger(logger, cli);

	return function (finished) {
		cli.createHook('clean.config', function (callback) {
			var conf = {
				options: appc.util.mix({
					platform: {
						// this is for backwards compatibility and eventually should be dropped
						hidden: true
					},
					platforms: {
						// note: --platforms is not required for the clean command
						abbr: 'p',
						desc: __('one or more platforms to clean'),
						values: ti.targetPlatforms,
						skipValueCheck: true // we do our own validation
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
								if (!ti.validateCorrectSDK(logger, config, cli, 'clean')) {
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
						desc: __('the directory containing the project, otherwise the current working directory'),
						default: process.env.SOURCE_ROOT ? path.join(process.env.SOURCE_ROOT, '..', '..') : '.',
						order: 1,
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
				}, ti.commonOptions(logger, config))
			};
			callback(null, conf);
		})(function (err, result) {
			finished(result);
		});
	};
};

exports.validate = function (logger, config, cli) {
	// Determine if the project is an app or a module, run appropriate clean command
	if (cli.argv.type === 'module') {

		// make sure the module manifest is sane
		ti.validateModuleManifest(logger, cli, cli.manifest);

		return function (finished) {
			logger.log.init(function () {
				const result = ti.validatePlatformOptions(logger, config, cli, 'cleanModule');
				if (result && typeof result === 'function') {
					result(finished);
				} else {
					finished(result);
				}
			});
		};

	} else {
		let platforms = cli.argv.platforms || cli.argv.platform;
		if (platforms) {
			platforms = ti.scrubPlatforms(platforms);

			if (platforms.bad.length) {
				logger.error(__n('Invalid platform: %%s', 'Invalid platforms: %%s', platforms.bad.length, platforms.bad.join(', ')) + '\n');
				logger.log(__('Available platforms for SDK version %s:', ti.manifest.sdkVersion) + '\n');
				ti.targetPlatforms.forEach(function (p) {
					logger.log('    ' + p.cyan);
				});
				logger.log();
				process.exit(1);
			}

			cli.argv.platforms = platforms.scrubbed;
		} else {
			cli.argv.platforms = null;
		}

		ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');

		return function (finished) {
			ti.loadPlugins(logger, config, cli, cli.argv['project-dir'], function () {
				finished();
			});
		};
	}
};

exports.run = function (logger, config, cli) {
	function done(err) {
		if (err) {
			logger.error(__('Failed to clean project in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
		} else {
			logger.info(__('Project cleaned successfully in %s', appc.time.prettyDiff(cli.startTime, Date.now())) + '\n');
		}
	}

	if (cli.argv.type === 'module') {
		// TODO Iterate over platforms? For multi-platform modules we should handle this...
		const platform = ti.resolvePlatform(cli.argv.platform);
		const cleanModule = path.join(__dirname, '..', '..', platform, 'cli', 'commands', '_cleanModule.js');
		if (!fs.existsSync(cleanModule)) {
			logger.error(__('Unable to find platform specific module clean command') + '\n');
			logger.log(__('Your SDK installation may be corrupt. You can reinstall it by running \'%s\'.', (cli.argv.$ + ' sdk install --force --default').cyan) + '\n');
			process.exit(1);
		}

		// Now wrap the actual cleaning of the module (specific to a given platform),
		// in hooks so a module itself could potentially do additional cleanup itself
		cli.fireHook('clean.module.pre', function () {
			cli.fireHook('clean.module.' + platform + '.pre', function () {

				// Do the actual cleaning per-sdk _cleanModule command
				require(cleanModule).run(logger, config, cli, function (err) { // eslint-disable-line security/detect-non-literal-require
					const delta = appc.time.prettyDiff(cli.startTime, Date.now());
					if (err) {
						logger.error(__('An error occurred during clean after %s', delta));
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
						logger.log.end();
					}

					cli.fireHook('clean.module.' + platform + '.post', function () {
						cli.fireHook('clean.module.post', function () {
							done();
						});
					});
				});
			});
		});
	} else {
		const buildDir = path.join(cli.argv['project-dir'], 'build');

		if (cli.argv.platforms) {
			async.series(cli.argv.platforms.map(function (platform) {
				return function (next) {
					// scan platform SDK specific clean hooks
					cli.scanHooks(path.join(__dirname, '..', '..', platform, 'cli', 'hooks'));
					cli.fireHook('clean.pre', function () {
						cli.fireHook('clean.' + platform + '.pre', function () {
							var dir = path.join(buildDir, platform);
							if (appc.fs.exists(dir)) {
								logger.debug(__('Deleting %s', dir.cyan));
								fs.removeSync(dir);
							} else {
								logger.debug(__('Directory does not exist %s', dir.cyan));
							}
							dir = path.join(buildDir, 'build_' + platform + '.log');
							if (appc.fs.exists(dir)) {
								logger.debug(__('Deleting %s', dir.cyan));
								fs.unlinkSync(dir);
							} else {
								logger.debug(__('Build log does not exist %s', dir.cyan));
							}
							cli.fireHook('clean.' + platform + '.post', function () {
								cli.fireHook('clean.post', function () {
									next();
								});
							});
						});
					});
				};
			}), done);
		} else if (appc.fs.exists(buildDir)) {
			logger.debug(__('Deleting all platform build directories'));

			// scan platform SDK specific clean hooks
			if (ti.targetPlatforms) {
				ti.targetPlatforms.forEach(function (platform) {
					cli.scanHooks(path.join(__dirname, '..', '..', platform, 'cli', 'hooks'));
				});
			}

			cli.fireHook('clean.pre', function () {
				async.series(fs.readdirSync(buildDir).map(function (dir) {
					return function (next) {
						var file = path.join(buildDir, dir);
						cli.fireHook('clean.' + dir + '.pre', function () {
							logger.debug(__('Deleting %s', file.cyan));
							fs.removeSync(file);
							cli.fireHook('clean.' + dir + '.post', function () {
								next();
							});
						});
					};
				}), function () {
					cli.fireHook('clean.post', function () {
						done();
					});
				});
			});
		} else {
			logger.debug(__('Directory does not exist %s', buildDir.cyan));
			done();
		}
	}
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
		logger.log.filestream = fs.createWriteStream(path.join(buildDir, 'clean_' + platform + '.log'), { flags: 'w', encoding: 'utf8', mode: 0o666 });

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
