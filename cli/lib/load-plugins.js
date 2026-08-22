import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import appc from 'node-appc';

export async function loadPlugins(logger, config, cli, silent = false, compact = true) {
	const projectDir = cli.argv['project-dir'];
	const searchPaths = {
		project: [ join(projectDir, 'plugins') ],
		config: [],
		global: []
	};
	let confPaths = config.get('paths.plugins');
	const defaultInstallLocation = cli.env.installPath;
	const sdkLocations = cli.env.os.sdkPaths.map(p => resolve(p));

	// set our paths from the config file
	if (!Array.isArray(confPaths)) {
		confPaths = [ confPaths ];
	}
	for (const p of confPaths) {
		if (p && existsSync(p = resolve(p)) && !searchPaths.project.includes(p) && !searchPaths.config.includes(p)) {
			searchPaths.config.push(p);
		}
	}

	// add any plugins from various sdk locations
	if (!sdkLocations.includes(defaultInstallLocation)) {
		sdkLocations.push(defaultInstallLocation);
	}
	if (cli.sdk) {
		sdkLocations.push(resolve(cli.sdk.path, '..', '..', '..'));
	}
	for (let p of sdkLocations) {
		if (existsSync(p = resolve(p, 'plugins')) && !searchPaths.project.includes(p) && !searchPaths.config.includes(p) && !searchPaths.global.includes(p)) {
			searchPaths.global.push(p);
		}
	}

	// find all hooks for active plugins
	const plugins = await new Promise((resolve) => appc.tiplugin.find(cli.tiapp.plugins, searchPaths, config, logger, resolve));
	if (plugins.missing.length) {
		if (logger) {
			logger.error('Could not find all required Titanium plugins:');
			for (const m of plugins.missing) {
				logger.error(`   id: ${m.id}\t version: ${m.version}`);
			}
			logger.log();
		}
		process.exit(1);
	}

	if (plugins.found.length) {
		for (const plugin of plugins.found) {
			cli.scanHooks(resolve(plugin.pluginPath, 'hooks'));
		}
	} else if (logger) {
		logger.debug('No project level plugins to load');
	}

	if (!silent) {
		cli.emit('cli:check-plugins', { compact });
	}
}
