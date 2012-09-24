/*
 * project.js: Titanium Mobile CLI project command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var path = require('path'),
	ti = require('titanium-sdk'),
	appc = require('node-appc'),
	mix = appc.util.mix;

exports.config = function (logger, config, cli) {
	return {
		desc: __('get and set tiapp.xml settings'),
		extendedDesc: __([
			'Get and set tiapp.xml settings.',
			'Run %s to see all available entries that can be changed.',
			[	'When setting the %s entry, it will non-destructively copy each specified ',
				"platform's default resources into your project's Resources folder. For ",
				'example, if your app currently supports %s and you wish to add Android ',
				'support, you must specify %s, otherwise only specifying %s will remove ',
				'support for iPhone.'
			].join('')
		].join('\n\n'),
			'titanium project --project-dir /path/to/project'.cyan,
			'deployment-targets'.cyan,
			'iphone'.cyan,
			'iphone,android'.cyan,
			'android'.cyan
		),
		skipBanner: true,
		options: mix(ti.commonOptions(logger, config), {
			'project-dir': {
				desc: __('the directory of the project to analyze'),
				default: '.'
			},
			output: {
				abbr: 'o',
				default: 'report',
				desc: __('output format'),
				values: ['report', 'json', 'text']
			},
			template: {
				desc: __('the name of the project template to use'),
				default: 'default'
			}
		}),
		args: [
			{
				name: 'key',
				desc: __('the key to get or set')
			},
			{
				name: 'value',
				desc: __('the value to set the specified key')
			}
		]
	};
};

exports.validate = function (logger, config, cli) {
	ti.validateProjectDir(logger, cli.argv, 'project-dir');

	// Validate the key, if it exists
	if (cli.argv._.length > 0) {
		var key = cli.argv._[0];
		if (!/^([A-Za-z_]{1}[A-Za-z0-9-_]*(\.[A-Za-z-_]{1}[A-Za-z0-9-_]*)*)$/.test(key)) {
			logger.error(__('Invalid key "%s"', key) + '\n');
			process.exit(1);
		}
	}
};

exports.run = function (logger, config, cli) {

	var projectDir = cli.argv['project-dir'],
		tiappPath = path.join(projectDir, 'tiapp.xml'),
		tiapp = new ti.tiappxml(tiappPath),
		output = cli.argv.output,
		key,
		value,
		result,
		args = cli.argv._,
		p,
		maxlen,
		sdkPath = cli.sdk.path,
		templateDir,
		propsList = ['sdk-version', 'id', 'name', 'version', 'publisher', 'url', 'description', 'copyright', 'icon', 'analytics', 'guid'],
		deploymentTargets = tiapp['deployment-targets'];

	cli.argv.output === "report" && logger.banner();
	switch(args.length) {
		case 0:

			if (output === "json") {

				// Store the deployment targets
				result =  new ti.tiappxml();
				result['deployment-targets'] = {};
				for(p in deploymentTargets) {
					result['deployment-targets'][p] = deploymentTargets[p];
				}

				// Copy all of the other properties in and print the results
				propsList.forEach(function(p) {
					result[p] = tiapp[p];
				});
				logger.log(result.toString('pretty-json'));
			} else {

				// Print the deployment targets
				logger.log(__('Deployment Targets:'));
				maxlen = Object.keys(deploymentTargets).reduce(function (a, b) {
					return Math.max(a, b.length);
				}, 0);
				for(p in tiapp['deployment-targets']) {
					logger.log('  %s = %s', appc.string.rpad(p, maxlen), (deploymentTargets[p] + '').cyan);
				}
				logger.log();

				// Print the other properties
				logger.log(__('Project Properties:'));
				maxlen = propsList.reduce(function (a, b) {
					return Math.max(a, b.length);
				}, 0);
				propsList.forEach(function (key) {
					logger.log('  %s = %s', appc.string.rpad(key, maxlen), (tiapp[key] + '' || __('not specified')).cyan);
				});
				logger.log();
			}
			break;
		case 1:
			key = args[0];
			if (key === 'deployment-targets') {
				if (output === "json") {
					result = {
						'deployment-targets': {}
					};
					for(p in deploymentTargets) {
						result['deployment-targets'][p] = deploymentTargets[p];
					}
					logger.log(JSON.stringify(result));
				} else if (output === "text") {
					result = [];
					for(p in deploymentTargets) {
						result.push(p + '=' + deploymentTargets[p]);
					}
					logger.log(result.join(','));
				} else {
					// Print the deployment targets
					logger.log(__('Deployment Targets:'));
					maxlen = Object.keys(deploymentTargets).reduce(function (a, b) {
						return Math.max(a, b.length);
					}, 0);
					for(p in tiapp['deployment-targets']) {
						logger.log('  %s = %s', appc.string.rpad(p, maxlen), (deploymentTargets[p] + '').cyan);
					}
					logger.log();
				}
			} else if (!!~propsList.indexOf(key)) {
				if (output === "json") {
					value = {};
					value[key] = tiapp[key];
					logger.log(JSON.stringify(value));
				} else if (output === "text") {
					logger.log(tiapp[key]);
				} else {
					logger.log(__('The value of %s is %s', (key.cyan + ''), (tiapp[key] + '').cyan) + '\n');
				}
			} else {
				logger.error( __('%s is not a valid entry name', key) + '\n');
			}
			break;
		case 2:
			key = args[0];
			switch(key) {
				case 'deployment-targets':

					// Get list of platforms from ti manifest and set to false (default value)
					result = {},
					value = ti.availablePlatforms.concat(['ios', 'ipad']); // TODO: remove concat once ipad and iphone are removed
					for(p = 0; p < value.length; p++) {
						result[value[p]] = false;
					}

					// Validate the platforms and override the tiapp.xml setting to true
					value = ti.validatePlatforms(logger, args[1].split(','));
					for(p = 0; p < value.length; p++) {
						result[value[p]] = true;
					}

					// Update the tiapp.xml
					tiapp['deployment-targets'] = result;

					// Non-destructively copy over files from <sdk>/templates/app/<template>/
					templateDir = path.join(sdkPath, 'templates', 'app', cli.argv.template);
					if (!appc.fs.exists(templateDir)) {
						logger.error(__('Unknown project template %s', cli.argv.template) + '\n');
						process.exit(1);
					}
					appc.fs.nonDestructiveCopyDirSyncRecursive(templateDir, projectDir, { 
						logger: logger.log,
						ignoreHiddenFiles: true
					});

					// Non-destructively copy over files from <sdk>/<each platform>/templates/app/<template>/
					for(p = 0; p < value.length; p++) {
						if (value[p]) {
							templateDir = path.join(sdkPath, ti.validatePlatform(logger, value[p]), 'templates', 'app', cli.argv.template);
							if (!appc.fs.exists(templateDir)) {
								logger.error(__('Template %s is not supported by platform %s', cli.argv.template, value[p]) + '\n');
								process.exit(1);
							}
							appc.fs.nonDestructiveCopyDirSyncRecursive(templateDir, projectDir, {
								logger: logger.log,
								ignoreHiddenFiles: true
							});
						}
					}
					value = value.join(', ');
					break;
				case 'sdk-version':
					value = args[1];
					if (value === 'latest') {
						value = Object.keys(cli.env.sdks).sort().reverse()[0];
					}
					if (!(value in cli.env.sdks)) {
						logger.error(__('Unknown SDK %s', value) + '\n');
						process.exit(1);
					}
					tiapp['sdk-version'] = value;
					break;
				case 'id':
					value = args[1];
					if (!/^([a-z_]{1}[a-z0-9_]*(\.[a-z_]{1}[a-z0-9_]*)*)$/.test(value)) {
						logger.error(__('Invalid project ID %s', value) + '\n');
						process.exit(1);
					}
					tiapp['id'] = value;
					break;
				case 'name':
					tiapp['name'] = value = args[1];
					break;
				case 'version':
					tiapp['version'] = value = args[1];
					break;
				case 'publisher':
					tiapp['publisher'] = value = args[1];
					break;
				case 'url':
					tiapp['url'] = value = args[1];
					break;
				case 'description':
					tiapp['description'] = value = args[1];
					break;
				case 'copyright':
					tiapp['copyright'] = value = args[1];
					break;
				case 'icon':
					tiapp['icon'] = value = args[1];
					break;
				case 'analytics':
					if (!~['true', 'false'].indexOf(args[1])) {
						logger.error(__('Invalid value for analytics %s', args[1]) + '\n');
						process.exit(1);
					}
					tiapp['analytics'] = value = args[1];
					break;
				case 'guid':
					tiapp['guid'] = value = args[1];
					break;
				default:
					logger.error('Invalid tiapp.xml key "' + key + '"');
					break;
			}
			logger.log(__('%s was successfully set to %s', (key + '').cyan, (value + '').cyan) + '\n');
			tiapp.save(tiappPath);
			break;
	}
};
