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
		ti.platformOptions(logger, config, cli, 'build', function (platformConf) {
			finished({
				flags: {
					'build-only': {
						abbr: 'b',
						desc: __('only perform the build; if true, does not install or run the app')
					},
					force: {
						abbr: 'f',
						desc: __('force a full rebuild')
					}
				},
				options: appc.util.mix({
					platform: {
						abbr: 'p',
						callback: function (platform) {
							return ti.resolvePlatform(platform);
						},
						desc: __('the target build platform'),
						hint: __('platform'),
						prompt: {
							label: __('Target platform [%s]', ti.availablePlatforms.join(',')),
							error: __('Invalid platform'),
							validator: function (platform) {
								platform = platform.trim();
								if (!platform) {
									throw new appc.exception(__('Invalid platform'));
								}
								if (ti.availablePlatforms.indexOf(platform) == -1) {
									throw new appc.exception(__('Invalid platform: %s', platform));
								}
								
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
						values: ti.availablePlatforms
					},
					'project-dir': {
						abbr: 'd',
						desc: __('the directory containing the project, otherwise the current working directory')
					}
				}, ti.commonOptions(logger, config)),
				platforms: platformConf
			});
		});
	};
};

exports.validate = function (logger, config, cli) {
	// TODO: set the type to 'app' for now, but we'll need to determine if the project is an app or a module
	cli.argv['type'] = 'app';
	
	ti.validatePlatform(logger, cli.argv, 'platform');
	if (ti.validatePlatformOptions(logger, config, cli, 'build') === false) {
		return false;
	}
	ti.loadPlugins(logger, cli, config, cli.argv['project-dir']);
};

exports.run = function (logger, config, cli) {
	var buildModule = path.join(__dirname, '..', '..', cli.argv.platform, 'cli', 'commands', '_build.js');
	if (!appc.fs.exists(buildModule)) {
		logger.error(__('Unable to find platform specific build command') + '\n');
		logger.log(__("Your SDK installation may be corrupt. You can reinstall it by running '%s'.", (cli.argv.$ + ' sdk update --force --default').cyan) + '\n');
		process.exit(1);
	}
	
	// Run the code processor, if it is enabled
	if (cli.tiapp['code-processor'] && cli.tiapp['code-processor'].enabled) {
		codeProcessor.process([appc.fs.resolvePath(path.join(cli.argv['project-dir'], 'Resources', 'app.js'))], 
			cli.tiapp['code-processor'].plugins,
			appc.util.mix(cli.tiapp['code-processor'].options, {
				sdkPath: path.resolve(path.join(__dirname, '..', '..')),
				platform: cli.argv.platform
			}), logger);
		cli.codeProcessor = codeProcessor.getResults();
		var errors = cli.codeProcessor.errors,
			warnings = cli.codeProcessor.warnings,
			data,
			i, len;
		for(i = 0, len = errors.length; i < len; i++) {
			data = errors[i];
			logger.error(data.description + ' (' + data.file + ':' + data.line + ':' + data.column + ')');
		}
		for(i = 0, len = warnings.length; i < len; i++) {
			data = warnings[i];
			logger.warn(data.description + ' (' + data.file + ':' + data.line + ':' + data.column + ')');
		}
		if (errors.length) {
			process.exit(1);
		}
	}
	
	require(buildModule).run(logger, config, cli, function (err) {
		var delta = appc.time.prettyDiff(cli.startTime, Date.now());
		if (err) {
			logger.error(__('Project failed to build after %s', delta) + '\n');
		} else {
			logger.info(__('Project built successfully in %s', delta) + '\n');
		}
	});

};
