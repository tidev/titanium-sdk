/*
 * project.js: Titanium Mobile CLI project command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var path = require('path'),
	ti = require('titanium-sdk'),
	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,
	mix = appc.util.mix;

exports.cliVersion = '>=3.X';
exports.desc = __('get and set tiapp.xml settings'),
exports.extendedDesc = [
	__('Get and set tiapp.xml settings.'),
	__('Run %s to see all available entries that can be changed.', 'titanium project --project-dir /path/to/project'.cyan),
	[	__('When setting the %s entry, it will non-destructively copy each specified ', 'deployment-targets'.cyan),
		__("platform's default resources into your project's Resources folder. For "),
		__('example, if your app currently supports %s and you wish to add Android ', 'iphone'.cyan),
		__('support, you must specify %s, otherwise only specifying %s will remove ', 'iphone,android'.cyan),
		__('support for iPhone.', 'android'.cyan)
	].join('')
].join('\n\n');

exports.config = function (logger, config, cli) {
	return {
		skipBanner: true,
		options: mix({
			output: {
				abbr: 'o',
				default: 'report',
				desc: __('output format'),
				values: ['report', 'json', 'text']
			},
			'project-dir': {
				desc: __('the directory of the project to analyze'),
				default: '.'
			},
			template: {
				desc: __('the name of the project template to use'),
				default: 'default'
			}
		}, ti.commonOptions(logger, config)),
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
	ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');

	// Validate the key, if it exists
	if (cli.argv._.length > 0) {
		var key = cli.argv._[0];
		if (!/^([A-Za-z_]{1}[A-Za-z0-9-_]*(\.[A-Za-z-_]{1}[A-Za-z0-9-_]*)*)$/.test(key)) {
			logger.error(__('Invalid key "%s"', key) + '\n');
			process.exit(1);
		}
	}
	
	ti.loadPlugins(logger, cli, config, cli.argv['project-dir']);
};

exports.run = function (logger, config, cli) {

	var projectDir = cli.argv['project-dir'],
		tiappPath = path.join(projectDir, 'tiapp.xml'),
		tiapp = new ti.tiappxml(tiappPath),
		output = cli.argv.output,
		key,
		value,
		result = {},
		args = cli.argv._,
		n,
		p,
		maxlen,
		sdkPath = cli.sdk.path,
		templateDir,
		propsList = ['sdk-version', 'id', 'name', 'version', 'publisher', 'url', 'description', 'copyright', 'icon', 'analytics', 'guid'],
		deploymentTargets = tiapp['deployment-targets'];

	cli.argv.output === "report" && logger.banner();
	switch (args.length) {
		case 0:
			if (output === "json") {

				// Store the deployment targets
				result =  new ti.tiappxml();
				result['deployment-targets'] = {};
				for (p in deploymentTargets) {
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
				for (p in tiapp['deployment-targets']) {
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
					for (p in deploymentTargets) {
						result['deployment-targets'][p] = deploymentTargets[p];
					}
					logger.log(JSON.stringify(result));
				} else if (output === "text") {
					result = [];
					for (p in deploymentTargets) {
						result.push(p + '=' + deploymentTargets[p]);
					}
					logger.log(result.join(','));
				} else {
					// Print the deployment targets
					logger.log(__('Deployment Targets:'));
					maxlen = Object.keys(deploymentTargets).reduce(function (a, b) {
						return Math.max(a, b.length);
					}, 0);
					for (p in tiapp['deployment-targets']) {
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
			switch (key) {
				case 'deployment-targets':

					// Get list of platforms from ti manifest and set to false (default value)
					result = {};
					
					// add ipad and blackberry to list of platforms
					['ipad', 'blackberry'].concat(ti.availablePlatforms).forEach(function (p) {
						result[p] = false;
					});
					
					// Validate the platforms and override the tiapp.xml setting to true
					value = args[1].split(',');
					value.forEach(function (p) {
						if (!result.hasOwnProperty(p)) {
							logger.error(__('Unsupported deployment target "%s"', p) + '\n');
							logger.log(__('Available deployment targets are:'));
							Object.keys(result).sort().forEach(function (p) {
								logger.log('    ' + p.cyan);
							});
							logger.log();
							process.exit(1);
						}
					});
					
					for (p = 0; p < value.length; p++) {
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
					
					n = appc.fs.nonDestructiveCopyDirSyncRecursive(templateDir, projectDir, {
						logger: logger.log,
						ignoreHiddenFiles: true
					});

					// Non-destructively copy over files from <sdk>/<each platform>/templates/app/<template>/
					for (p = 0; p < value.length; p++) {
						if (value[p]) {
							templateDir = path.join(sdkPath, ti.resolvePlatform(value[p]), 'templates', 'app', cli.argv.template);
							if (appc.fs.exists(templateDir)) {
								n += appc.fs.nonDestructiveCopyDirSyncRecursive(templateDir, projectDir, {
									logger: logger.log,
									ignoreHiddenFiles: true
								});
							}
						}
					}
					value = value.join(', ');
					n && logger.log();
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
				case 'version':
				case 'publisher':
				case 'url':
				case 'description':
				case 'copyright':
				case 'icon':
				case 'guid':
					tiapp[key] = value = args[1];
					break;
				case 'analytics':
					if (!~['true', 'false'].indexOf(args[1])) {
						logger.error(__('Invalid value for analytics %s', args[1]) + '\n');
						process.exit(1);
					}
					tiapp['analytics'] = value = args[1];
					break;
				default:
					logger.error('Invalid tiapp.xml key "' + key + '"');
					break;
			}
			logger.log('tiapp.xml saving is currently not supported');
			//logger.log(__('%s was successfully set to %s', (key + '').cyan, (value + '').cyan) + '\n');
			//tiapp.save(tiappPath);
			break;
	}
};
