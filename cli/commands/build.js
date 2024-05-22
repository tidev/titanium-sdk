/*
 * build.js: Titanium Mobile CLI build command
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import appc from 'node-appc';
import fields from 'fields';
import fs from 'fs-extra';
import path from 'node:path';
import sprintf from 'sprintf';
import ti from 'node-titanium-sdk';
import tiappxml from 'node-titanium-sdk/lib/tiappxml.js';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export const cliVersion = '>=3.2.1';
export const title = 'Build';
export const desc = 'builds a project';
export const extendedDesc = 'Builds an existing app or module project.';

export function config(logger, config, cli) {
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
							desc: 'only perform the build; if true, does not install or run the app'
						},
						force: {
							abbr: 'f',
							desc: 'force a full rebuild'
						},
						legacy: {
							desc: 'build using the old Python-based builder.py; deprecated'
						},
						'skip-js-minify': {
							default: false,
							desc: `bypasses JavaScript minification; ${'simulator'.cyan} builds are never minified; only supported for ${'Android'.cyan} and ${'iOS'.cyan}`
						},
						'source-maps': {
							desc: 'generate inline source maps for transpiled JS files'
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
							desc: 'the target build platform',
							hint: 'platform',
							order: 2,
							prompt: {
								label: 'Target platform',
								error: 'Invalid platform',
								validator: function (platform) {
									if (!platform) {
										throw new Error('Invalid platform');
									} else if (ti.availablePlatforms.indexOf(platform) === -1) {
										throw new Error(`Invalid platform: ${platform}`);
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
										tiapp = cli.tiapp = new tiappxml(path.join(projectDir, 'tiapp.xml'), cli.argv.platform);
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
							desc: 'the directory containing the project',
							default: process.env.SOURCE_ROOT ? path.join(process.env.SOURCE_ROOT, '..', '..') : '.',
							order: 1,
							prompt: function (callback) {
								callback(fields.file({
									promptLabel: 'Where is the __project directory__?',
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
									return callback(new Error('Project directory does not exist'));
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
									callback(new Error(`Invalid project directory "${projectDir}" because tiapp.xml or timodule.xml not found`));
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
}

export function validate(logger, config, cli) {

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
}

export async function run(logger, config, cli, finished) {
	const buildFile = cli.argv.type === 'module' ? '_buildModule.js' : '_build.js',
		platform = ti.resolvePlatform(cli.argv.platform),
		buildModule = path.join(__dirname, '..', '..', platform, 'cli', 'commands', buildFile);

	if (!fs.existsSync(buildModule)) {
		logger.error('Unable to find platform specific build command\n');
		logger.log(`Your SDK installation may be corrupt. You can reinstall it by running '${(cli.argv.$ + ' sdk install --force --default').cyan}'.\n`);
		process.exit(1);
	}

	let counter = 0;
	const { run } = await import(buildModule);

	run(logger, config, cli, function (err) { // eslint-disable-line security/detect-non-literal-require
		if (!counter++) {
			const delta = appc.time.prettyDiff(cli.startTime, Date.now());
			if (err) {
				logger.error(`An error occurred during build after ${delta}`);
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
					logger.info(`Project built successfully in ${delta.cyan}\n`);
				}
				logger.log.end();
			}

			finished();
		}
	});
}

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
				styleHeading('Operating System'),
				'  ' + rpad('Name')            + ' = ' + styleValue(osInfo.os),
				'  ' + rpad('Version')         + ' = ' + styleValue(osInfo.osver),
				'  ' + rpad('Architecture')    + ' = ' + styleValue(osInfo.ostype),
				'  ' + rpad('# CPUs')          + ' = ' + styleValue(osInfo.oscpu),
				'  ' + rpad('Memory')          + ' = ' + styleValue(osInfo.memory),
				'',
				styleHeading('Node.js'),
				'  ' + rpad('Node.js Version') + ' = ' + styleValue(osInfo.node),
				'  ' + rpad('npm Version')     + ' = ' + styleValue(osInfo.npm),
				'',
				styleHeading('Titanium CLI'),
				'  ' + rpad('CLI Version')     + ' = ' + styleValue(cli.version),
				'',
				styleHeading('Titanium SDK'),
				'  ' + rpad('SDK Version')     + ' = ' + styleValue(cli.argv.sdk),
				'  ' + rpad('SDK Path')        + ' = ' + styleValue(cli.sdk.path),
				'  ' + rpad('Target Platform') + ' = ' + styleValue(ti.resolvePlatform(cli.argv.platform)),
				'',
				styleHeading('Command'),
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
