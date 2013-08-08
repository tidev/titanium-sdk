/*
 * build.js: Titanium Mobile CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	afs = appc.fs,
	ti = require('titanium-sdk'),
	path = require('path'),
	codeProcessor = require('titanium-code-processor');

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
								label: __('Target platform [%s]', ti.targetPlatforms.join(',')),
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
							desc: __('the directory containing the project, otherwise the current working directory')
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

	ti.validatePlatform(logger, cli.argv, 'platform');
	if (ti.validatePlatformOptions(logger, config, cli, 'build') === false) {
		return false;
	}
	ti.loadPlugins(logger, cli, config, cli.argv['project-dir']);
};

exports.run = function (logger, config, cli) {
	var platform = cli.argv.platform,
		buildModule = path.join(__dirname, '..', '..', platform, 'cli', 'commands', '_build.js');
	if (!appc.fs.exists(buildModule)) {
		logger.error(__('Unable to find platform specific build command') + '\n');
		logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}

	function buildModuleRun() {
		require(buildModule).run(logger, config, cli, function (err) {
			var delta = appc.time.prettyDiff(cli.startTime, Date.now());
			if (err) {
				logger.error(__('Project failed to build after %s', delta) + '\n');
				process.exit(1);
			} else {
				logger.info(__('Project built successfully in %s', delta) + '\n');
			}
		});
	}

	// Run the code processor, if it is enabled
	if (cli.tiapp['code-processor'] && cli.tiapp['code-processor'].enabled) {
		var codeProcessorPluginDir = path.resolve(path.join(global.titaniumCodeProcessorLibDir, '..', 'plugins')),
			parsedModules = {},
			moduleSearchPaths,
			plugins = [];

		moduleSearchPaths = [ cli.argv['project-dir'], afs.resolvePath(path.join(__dirname, '..', '..')) ];
		if (config.paths && Array.isArray(config.paths.modules)) {
			moduleSearchPaths = moduleSearchPaths.concat(config.paths.modules);
		}

		// Get the list of modules
		parsedModules.commonjs = {};
		parsedModules[platform] = {};
		appc.timodule.find(cli.tiapp.modules, cli.argv.$originalPlatform !== platform ?
				[ cli.argv.$originalPlatform, platform ] : platform,
				cli.argv['deploy-type'] || 'development', cli.tiapp['sdk-version'], moduleSearchPaths, logger, function (modules) {
			modules.found.forEach(function (module) {
				if (module.platform.indexOf(platform) !== -1) {
					parsedModules[platform][module.id] = null;
				} else if (module.platform.indexOf('commonjs') !== -1) {
					parsedModules.commonjs[module.id] = module.modulePath;
				}
			});

			// Run the code processor
			codeProcessor.run(
				appc.fs.resolvePath(path.join(cli.argv['project-dir'], 'Resources', 'app.js')),
				appc.util.mix({
					invokeMethods: true,
					evaluateLoops: true,
					processUnvisitedCode: true,
					suppressResults: true,
					logConsoleCalls: false,
				}, cli.tiapp['code-processor'].options),
				[
					{
						path: path.join(codeProcessorPluginDir, 'common-globals'),
						options: {}
					},
					{
						path: path.join(codeProcessorPluginDir, 'require-provider'),
						options: {
							platform: cli.argv.platform,
							modules: parsedModules
						}
					},
					{
						path: path.join(codeProcessorPluginDir, 'ti-api-provider'),
						options: {
							platform: cli.argv.platform,
							sdkPath: path.resolve(path.join(__dirname, '..', '..'))
						}
					},
					{
						path: path.join(codeProcessorPluginDir, 'ti-api-usage-finder'),
						options: {}
					},
					{
						path: path.join(codeProcessorPluginDir, 'ti-api-platform-validator'),
						options: {
							platform: cli.argv.platform
						}
					},
					{
						path: path.join(codeProcessorPluginDir, 'ti-api-deprecation-finder'),
						options: {}
					}
				],
				logger, function() {
					// Parse the results
					var codeProcessorResults = codeProcessor.getResults(),
						errors = codeProcessorResults.errors,
						warnings = codeProcessorResults.warnings,
						data,
						i, len;
					for(i = 0, len = errors.length; i < len; i++) {
						data = errors[i];
						logger.error('Titanium Code Processor error: ' + data.description + ' (' + data.file + ':' + data.line + ':' + data.column + ')');
					}
					for(i = 0, len = warnings.length; i < len; i++) {
						data = warnings[i];
						logger.warn('Titanium Code Processor warning: ' + data.description + ' (' + data.file + ':' + data.line + ':' + data.column + ')');
					}
					if (errors.length) {
						logger.warn('The Titanium Code Processor detected errors in the project, results will be discarded');
					} else {
						cli.codeProcessor = codeProcessorResults;
					}

					// Build the project
					buildModuleRun();
				});
		});
	} else {
		buildModuleRun();
	}
};
