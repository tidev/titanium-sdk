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
		skipBanner: true,
		options: mix(ti.commonOptions(logger, config), {
			dir: {
				desc: __('the directory of the project to analyze.'),
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
	cli.argv.dir = ti.validateProjectDir(logger, cli.argv.dir);

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
	debugger;
	var tiappPath = path.join(cli.argv.dir, 'tiapp.xml'),
		tiapp = new ti.tiappxml(tiappPath),
		output = cli.argv.output,
		key,
		value,
		result,
		args = cli.argv._,
		p,
		maxlen,
		propsList = ['sdk-version', 'id', 'name', 'version', 'publisher', 'url', 'description', 'copyright', 'icon', 
			'analytics', 'guid'],
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
				logger.log('');

				// Print the other properties
				logger.log(__('Project Properties:'));
				maxlen = propsList.reduce(function (a, b) {
					return Math.max(a, b.length);
				}, 0);
				propsList.forEach(function (key) {
					logger.log('  %s = %s', appc.string.rpad(key, maxlen), (tiapp[key] + '' || __('<not specified>')).cyan);
				});
				logger.log('');
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
					logger.log('');
				}
			} else if (!!~propsList.indexOf(key)) {
				if (output === "json") {
					value = {};
					value[key] = tiapp[key];
					logger.log(JSON.stringify(value));
				} else if (output === "text") {
					logger.log(tiapp[key]);
				} else {
					logger.log(__('The value of ') + (key + '').cyan + __(' is ') + (tiapp[key] + '').cyan + '\n');
				}
			} else {
				logger.error(key + __(' is not a valid entry name') + '\n');
			}
			break;
		case 2:
			key = args[0].split('.');
			switch(key) {
				case 'deployment-targets':
					break;
				case 'sdk-version':
					break;
				case 'id':
					break;
				case 'name':
					break;
				case 'version':
					break;
				case 'publisher':
					break;
				case 'url':
					break;
				case 'description':
					break;
				case 'copyright':
					break;
				case 'icon':
					break;
				case 'analytics':
					break;
				case 'guid':
					break;
				default:
					logger.error('Invalid tiapp.xml key "' + key + '"');
					break;
			}
			tiapp.save(tiappPath);
			break;
	}
};