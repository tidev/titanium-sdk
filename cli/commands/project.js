/*
 * project.js: Titanium Mobile CLI project command
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import path from 'node:path';
import ti from 'node-titanium-sdk';
import { commonOptions } from '../lib/common-options.js';
import appc from 'node-appc';

export const cliVersion = '>=3.2.1';
export const desc = 'get and set tiapp.xml settings';
export const extendedDesc = `Get and set tiapp.xml settings.

Run ${'titanium project --project-dir /path/to/project'.cyan} to see all available entries that can be changed.

When setting the ${'deployment-targets'.cyan} entry, it will non-destructively copy each specified
platform's default resources into your project's Resources folder. For
example, if your app currently supports ${'iphone'.cyan} and you wish to add Android
support, you must specify ${'iphone,android'.cyan}, otherwise only specifying ${'android'.cyan} will remove
support for iPhone.`;

export function config(logger, config) {
	return {
		skipBanner: true,
		options: Object.assign({
			output: {
				abbr: 'o',
				default: 'report',
				desc: 'output format',
				values: [ 'report', 'json', 'text' ]
			},
			'project-dir': {
				desc: 'the directory of the project to analyze',
				default: '.'
			},
			template: {
				desc: 'the name of the project template to use',
				default: 'default'
			}
		}, commonOptions(logger, config)),
		args: [
			{
				name: 'key',
				desc: 'the key to get or set'
			},
			{
				name: 'value',
				desc: 'the value to set the specified key'
			}
		]
	};
}

export function validate(logger, config, cli) {
	ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');

	// Validate the key, if it exists
	if (cli.argv._.length > 0) {
		const key = cli.argv._[0];
		if (!/^([A-Za-z_]{1}[A-Za-z0-9-_]*(\.[A-Za-z-_]{1}[A-Za-z0-9-_]*)*)$/.test(key)) {
			logger.error(`Invalid key "${key}"\n`);
			process.exit(1);
		}
	}

	return function (finished) {
		ti.loadPlugins(null, config, cli, cli.argv['project-dir'], finished, cli.argv.output !== 'report' || cli.argv._.length, false);
	};
}

export function run(logger, config, cli, finished) {
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
		propsList = [ 'sdk-version', 'id', 'name', 'version', 'publisher', 'url', 'description', 'copyright', 'icon', 'guid' ],
		deploymentTargets = tiapp['deployment-targets'];

	args.length === 0 && output === 'report' && logger.banner();

	switch (args.length) {
		case 0:
			if (output === 'json') {

				// Store the deployment targets
				result =  new ti.tiappxml();
				result['deployment-targets'] = {};
				for (p in deploymentTargets) {
					result['deployment-targets'][p] = deploymentTargets[p];
				}

				// Copy all of the other properties in and print the results
				propsList.forEach(function (p) {
					result[p] = tiapp[p];
				});
				logger.log(result.toString('pretty-json'));

			} else {

				// Print the deployment targets
				logger.log('Deployment Targets:');
				maxlen = Object.keys(deploymentTargets).reduce(function (a, b) {
					return Math.max(a, b.length);
				}, 0);
				for (p in tiapp['deployment-targets']) {
					logger.log(`  ${appc.string.rpad(p, maxlen)} = ${(deploymentTargets[p] + '').cyan}`);
				}
				logger.log();

				// Print the other properties
				logger.log('Project Properties:');
				maxlen = propsList.reduce(function (a, b) {
					return Math.max(a, b.length);
				}, 0);
				propsList.forEach(function (key) {
					logger.log(`  ${appc.string.rpad(key, maxlen)} = ${String(tiapp[key] || 'not specified').cyan}`);
				});
				logger.log();
			}
			break;

		case 1:
			key = args[0];
			if (key === 'deployment-targets') {
				if (output === 'json') {
					result = {
						'deployment-targets': {}
					};
					for (p in deploymentTargets) {
						result['deployment-targets'][p] = deploymentTargets[p];
					}
					logger.log(JSON.stringify(result));
				} else if (output === 'text') {
					result = [];
					for (p in deploymentTargets) {
						result.push(p + '=' + deploymentTargets[p]);
					}
					logger.log(result.join(','));
				} else {
					// Print the deployment targets
					logger.log('Deployment Targets:');
					maxlen = Object.keys(deploymentTargets).reduce(function (a, b) {
						return Math.max(a, b.length);
					}, 0);
					for (p in tiapp['deployment-targets']) {
						logger.log(`  ${appc.string.rpad(p, maxlen)} = ${(deploymentTargets[p] + '').cyan}`);
					}
					logger.log();
				}
			} else if (~propsList.indexOf(key)) {
				if (output === 'json') {
					logger.log(JSON.stringify(tiapp[key] || ''));
				} else {
					logger.log(tiapp[key]);
				}
			} else {
				if (output === 'json') {
					logger.log('null');
				} else {
					logger.error(`${key} is not a valid entry name\n`);
				}
				process.exit(1);
			}
			break;

		case 2:
			key = args[0];
			switch (key) {
				case 'deployment-targets':

					// Get list of platforms from ti manifest and set to false (default value)
					result = {};

					// add ipad and blackberry to list of platforms
					[ 'ipad', 'blackberry' ].concat(ti.availablePlatforms).forEach(function (p) {
						result[p] = false;
					});

					// Validate the platforms and override the tiapp.xml setting to true
					value = args[1].split(',');
					value.forEach(function (p) {
						if (!Object.prototype.hasOwnProperty.call(result, p)) {
							logger.error(`Unsupported deployment target "${p}"\n`);
							logger.log('Available deployment targets are:');
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

					// Non-destructively copy over files from <sdk>/templates/app/<template>/template
					templateDir = path.join(sdkPath, 'templates', 'app', cli.argv.template, 'template');
					if (!appc.fs.exists(templateDir)) {
						logger.error(`Unknown project template ${cli.argv.template}\n`);
						process.exit(1);
					}

					n = appc.fs.nonDestructiveCopyDirSyncRecursive(templateDir, projectDir, {
						logger: logger.log,
						ignoreHiddenFiles: true
					});

					// Non-destructively copy over files from <sdk>/<each platform>/templates/app/<template>/
					for (p = 0; p < value.length; p++) {
						if (value[p]) {
							templateDir = path.join(sdkPath, ti.resolvePlatform(value[p]), 'templates', 'app', cli.argv.template, 'template');
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
						logger.error(`Unknown SDK ${value}\n`);
						process.exit(1);
					}
					tiapp['sdk-version'] = value;
					break;
				case 'id':
					value = args[1];
					if (!/^([a-z_]{1}[a-z0-9_]*(\.[a-z_]{1}[a-z0-9_]*)*)$/.test(value)) {
						logger.error(`Invalid project ID ${value}\n`);
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
					tiapp[key] = value = args[1] || '';
					break;
				default:
					logger.error('Invalid tiapp.xml key "' + key + '"');
					break;
			}
			logger.log('tiapp.xml saving is currently not supported');
			// logger.log(`${(key + '').cyan} was successfully set to ${(value + '').cyan}\n`);
			// tiapp.save(tiappPath);
			break;
	}

	finished();
}
