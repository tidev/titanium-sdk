/*
 * build.js: Titanium Mobile CLI build command
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	fields = require('fields'),
	fs = require('fs'),
	jsanalyze = require('titanium-sdk/lib/jsanalyze'),
	path = require('path'),
	sprintf = require('sprintf'),
	ti = require('titanium-sdk'),
	tiappxml = require('titanium-sdk/lib/tiappxml'),
	wrench = require('wrench'),
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
	fields.setup({ colors: cli.argv.colors });

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
								if (projectDir === '') {
									// no option value was specified
									// check if current directory is a valid dir
									// if not output meaningful error message
									projectDir = conf.options['project-dir'].default;
									if (!fs.existsSync(path.join(projectDir, 'tiapp.xml'))) {
										return;
									}
								}

								// start file logging here
								console.log(logBanner(cli));
								patchLogger(logger, cli);

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

								// check that the Titanium SDK version is correct
								if (!ti.validateCorrectSDK(logger, config, cli, 'build')) {
									throw new cli.GracefulShutdown();
								}

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

								var tiappFile = path.join(dir, 'tiapp.xml'),
									root = path.resolve('/');

								// try to find the tiapp.xml
								while (!fs.existsSync(tiappFile)) {
									dir = path.dirname(dir);
									if (dir == root) {
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

exports.run = function (logger, config, cli, finished) {
	var platform = ti.resolvePlatform(cli.argv.platform),
		buildModule = path.join(__dirname, '..', '..', platform, 'cli', 'commands', '_build.js'),
		counter = 0;

	if (!fs.existsSync(buildModule)) {
		logger.error(__('Unable to find platform specific build command') + '\n');
		logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}

	if (config.get('cli.sendAPIUsage', true)) {
		cli.on('build.finalize', function (builder) {
			var deployType = builder.deployType || cli.argv['deploy-type'] || null;
			if (deployType == 'production') {
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

	require(buildModule).run(logger, config, cli, function (err) {
		if (!counter++) {
			var delta = appc.time.prettyDiff(cli.startTime, Date.now());
			if (err) {
				logger.error(__('Project failed to build after %s', delta));
				(err.message || err.toString()).trim().split('\n').forEach(function (msg) {
					logger.error(msg);
				});
				logger.log();
				process.exit(1);
			} else {
				logger.info(__('Project built successfully in %s', delta.cyan) + '\n');
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
	var origLoggerLog = logger.log,
		platform = ti.resolvePlatform(cli.argv.platform),
		buildDir = path.join(cli.argv['project-dir'], 'build'),
		logFileStream;

	fs.existsSync(buildDir) || wrench.mkdirSyncRecursive(buildDir);

	// create our write stream
	logFileStream = fs.createWriteStream(path.join(buildDir, 'build_' + platform + '.log'), { 'flags': 'w', 'encoding': 'ascii' });

	// write the banner to start out the log
	logFileStream.write(logBanner(cli));

	// override the existing log function
	logger.log = function() {
		// most of this copied from the CLI's logger.js logger.log() function
		var args = Array.prototype.slice.call(arguments),
			padLevels = logger.padLevels,
			prefix;

		// if there are no args (i.e. a blank line), we need at least one space
		args.length || args.unshift(' ');

		// if we're not being called from info/warn/error/debug, then set this as a general log entry
		args[0] in logger.levels || args.unshift('_');

		// turn off padding
		logger.padLevels = args[0] != '_';

		// get rid of any null args
		while (args.length && args[args.length-1] == null) args.pop();

		// if we're logging an error, we need to cast to a string so that sprintf doesn't complain
		if (args[1] instanceof Error || Object.prototype.toString.call(args[1]) == '[object Error]') {
			args[1] = (args[1].stack || args[1].toString()) + '\n';
		} else if (args[1] == null || args[1] == undefined) {
			args[1] = '';
		}

		typeof type != 'string' && (args[1] = ''+args[1]);

		// strip off starting full colons
		args[1] = args[1].replace(/:\s{1}/, ' ');

		// add [INFO] type prefixes for each line
		prefix = (args[0] != "_") ? "[" + args[0].toUpperCase() + "]" + ((args[0].length===5) ? '  ' : '   ') : "";

		// log it to our log file, stripping out the color codes
		logFileStream.write("\n" + prefix + args[1].replace(/\x1B\[\d+m/g, ''));

		// call the original logger with our cleaned up args
		origLoggerLog.apply(logger, [args[0], args.length > 2 ? sprintf.apply(null, args.slice(1)) : args[1]]);

		// restore padding
		logger.padLevels = padLevels;
	}
}

/**
* Outputs environment details at the top of the log file
* for each run of `titanium build`
* @param {Object} cli - The CLI instance
*
* See http://en.wikipedia.org/wiki/Darwin_%28operating_system%29#Release_history for
* os.release() to version mapping for OS X. (e.g. 14.0.0 is v10.10 Yosemite)
*/
function logBanner(cli) {
	var os = require('os');
	return new Date().toLocaleString() + '\n\n' +
		'Build Environment \n' +
		'   Host OS         = ' + (os.platform()==='darwin' ? "OS X" : os.platform()) + ' ' + os.release() + ', ' + os.arch() + '\n'  +
		'   Target platform = ' + ti.resolvePlatform(cli.argv.platform) + '\n'  +
		'   CLI version     = ' + cli.version + '\n'  +
		'   SDK version     = ' + cli.argv.sdk + '\n' +
		'   SDK path        = ' + cli.sdk.path + '\n' +
		'   Node version    = ' + process.version + '\n' +
		'   Command         = ' + cli.argv.$ + ' ' + cli.argv.$_.join(' ') + '\n' +
		'\n';
}