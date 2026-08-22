import { resolvePlatform } from './resolve-platform.js';

export function validateModuleManifest(logger, cli, manifest) {
	const requiredModuleKeys = [
		'name',
		'version',
		'moduleid',
		'description',
		'copyright',
		'license',
		'copyright',
		'platform',
		'minsdk',
		'architectures'
	];

	// check if all the required module keys are in the list
	for (const key of requiredModuleKeys) {
		if (!manifest[key]) {
			logger.error(`Missing required manifest key "${key}"`);
			logger.log();
			process.exit(1);
		}
	}

	if (cli.argv.platform !== resolvePlatform(manifest.platform)) {
		logger.error(`Unable to find "${cli.argv.platform}" module`);
		logger.log();
		process.exit(1);
	}
}
