/*
 * project.js: Titanium Mobile CLI project command
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import { join } from 'node:path';
import ti from 'node-titanium-sdk';
import appc from 'node-appc';
import { loadPlugins } from '../lib/load-plugins.js';
import { commonOptions } from '../lib/common-options.js';
import { validateProjectDir } from '../lib/validate-project-dir.js';
import { platformAliases, resolvePlatform } from '../lib/resolve-platform.js';
import { existsSync } from 'node:fs';
import { sdkManifest } from '../lib/sdk-manifest.js';

export const cliVersion = '>=9.1.0';
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

export async function validate(logger, config, cli) {
	validateProjectDir(logger, cli, cli.argv, 'project-dir');

	// Validate the key, if it exists
	if (cli.argv._.length > 0) {
		const key = cli.argv._[0];
		if (!/^([A-Za-z_]{1}[A-Za-z0-9-_]*(\.[A-Za-z-_]{1}[A-Za-z0-9-_]*)*)$/.test(key)) {
			logger.error(`Invalid key "${key}"\n`);
			process.exit(1);
		}
	}

	await loadPlugins(null, config, cli, cli.argv.output !== 'report' || cli.argv._.length, false);
}

const propsList = ['sdk-version', 'id', 'name', 'version', 'publisher', 'url', 'description', 'copyright', 'icon', 'guid'];

function printProjectInfo(logger, cli, tiapp) {
	const { output } = cli.argv;

	if (output === 'json') {
		// Store the deployment targets
		const result = new ti.tiappxml();
		result['deployment-targets'] = { ...tiapp['deployment-targets'] };

		// Copy all of the other properties in and print the results
		for (const key of propsList) {
			result[key] = tiapp[key];
		}
		logger.log(result.toString('pretty-json'));
		return;
	}

	// Print the deployment targets
	const deploymentTargets = tiapp['deployment-targets'] || {};
	logger.log('Deployment Targets:');
	let maxlen = Object.keys(deploymentTargets).reduce((a, b) => Math.max(a, b.length), 0);
	for (const target of Object.keys(deploymentTargets)) {
		logger.log(`  ${target.padEnd(maxlen)} = ${String(deploymentTargets[target]).cyan}`);
	}
	logger.log();

	// Print the other properties
	logger.log('Project Properties:');
	maxlen = propsList.reduce((a, b) => Math.max(a, b.length), 0);
	for (const key of propsList) {
		logger.log(`  ${key.padEnd(maxlen)} = ${String(tiapp[key] || 'not specified').cyan}`);
	}
	logger.log();
}

function getProjectKey(logger, cli, tiapp) {
	const { output } = cli.argv;
	const key = cli.argv._[0];

	if (key === 'deployment-targets') {
		const deploymentTargets = tiapp['deployment-targets'] || {};
		if (output === 'json') {
			logger.log(JSON.stringify({
				'deployment-targets': deploymentTargets
			}));
		} else if (output === 'text') {
			logger.log(Object.keys(deploymentTargets).map(target => `${target}=${deploymentTargets[target]}`).join(','));
		} else {
			logger.log('Deployment Targets:');
			const maxlen = Object.keys(deploymentTargets).reduce((a, b) => Math.max(a, b.length), 0);
			logger.log(Object.keys(deploymentTargets).map(target => `  ${target.padEnd(maxlen)} = ${String(deploymentTargets[target]).cyan}`).join('\n'));
			logger.log();
		}
		return;
	}

	if (propsList.includes(key)) {
		if (output === 'json') {
			logger.log(JSON.stringify(tiapp[key] || ''));
		} else {
			logger.log(tiapp[key]);
		}
		return;
	}

	if (output === 'json') {
		logger.log('null');
	} else {
		logger.error(`${key} is not a valid entry name\n`);
	}
	process.exit(1);
}

function setProjectKey(logger, cli, tiapp) {
	const [key, value] = cli.argv._;
	const projectDir = cli.argv['project-dir'];
	const sdkPath = cli.sdk.path;

	switch (key) {
		case 'deployment-targets':
			const result = {};
			const deploymentTargets = value?.split(',') || [];

			for (const platform of sdkManifest.platforms) {
				result[platform] = false;
			}

			for (const [alias, platform] of Object.entries(platformAliases)) {
				if (alias !== 'ios' && sdkManifest.platforms.includes(platform)) {
					result[alias] = false;
				}
			}

			// Validate the platforms and override the tiapp.xml setting to true
			for (const target of deploymentTargets) {
				if (!Object.hasOwn(result, target)) {
					logger.error(`Unsupported deployment target "${target}"\n`);
					logger.log('Available deployment targets are:');
					for (const target of Object.keys(result).sort()) {
						logger.log(`    ${target.cyan}`);
					}
					logger.log();
					process.exit(1);
				}
			}

			for (const target of deploymentTargets) {
				result[target] = true;
			}

			// Update the tiapp.xml
			tiapp['deployment-targets'] = result;

			// Non-destructively copy over files from <sdk>/templates/app/<template>/template
			const templateDir = join(sdkPath, 'templates', 'app', cli.argv.template, 'template');
			if (!existsSync(templateDir)) {
				logger.error(`Unknown project template ${cli.argv.template}\n`);
				process.exit(1);
			}

			let numCopied = appc.fs.nonDestructiveCopyDirSyncRecursive(templateDir, projectDir, {
				logger: logger.log,
				ignoreHiddenFiles: true
			});

			// Non-destructively copy over files from <sdk>/<each platform>/templates/app/<template>/
			for (const target of deploymentTargets) {
				const templateDir = join(sdkPath, resolvePlatform(target), 'templates', 'app', cli.argv.template, 'template');
				if (existsSync(templateDir)) {
					numCopied += appc.fs.nonDestructiveCopyDirSyncRecursive(templateDir, projectDir, {
						logger: logger.log,
						ignoreHiddenFiles: true
					});
				}
			}
			if (numCopied > 0) {
				logger.log();
			}
			break;

		case 'sdk-version':
			let sdkVersion = value;
			if (sdkVersion === 'latest') {
				sdkVersion = Object.keys(cli.env.sdks).sort().reverse()[0];
			}
			if (!Object.hasOwn(cli.env.sdks, sdkVersion)) {
				logger.error(`Unknown SDK ${sdkVersion}\n`);
				process.exit(1);
			}
			tiapp['sdk-version'] = sdkVersion;
			break;
		case 'id':
			const projectId = value || '';
			if (!/^([a-z_]{1}[a-z0-9_]*(\.[a-z_]{1}[a-z0-9_]*)*)$/.test(projectId)) {
				logger.error(`Invalid project ID ${projectId}\n`);
				process.exit(1);
			}
			tiapp['id'] = projectId;
			break;
		case 'name':
		case 'version':
		case 'publisher':
		case 'url':
		case 'description':
		case 'copyright':
		case 'icon':
		case 'guid':
			tiapp[key] = value || '';
			break;
		default:
			logger.error(`Invalid tiapp.xml key "${key}"`);
			break;
	}
	logger.log('tiapp.xml saving is currently not supported');
	// logger.log(`${(key + '').cyan} was successfully set to ${(value + '').cyan}\n`);
	// tiapp.save(tiappPath);
}

export async function run(logger, _config, cli) {
	const {
		output,
		_: args
	} = cli.argv;
	const tiapp = new ti.tiappxml(join(cli.argv['project-dir'], 'tiapp.xml'));

	if (args.length === 0 && output === 'report') {
		logger.banner();
	}

	if (args.length === 0) {
		printProjectInfo(logger, cli, tiapp);
	} else if (args.length === 1) {
		getProjectKey(logger, cli, tiapp);
	} else if (args.length === 2) {
		setProjectKey(logger, cli, tiapp);
	} else {
		logger.error(`Invalid number of arguments\n`);
		process.exit(1);
	}
}
