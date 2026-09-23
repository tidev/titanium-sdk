import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { sdkManifest } from './sdk-manifest.js';
import { fileURLToPath } from 'node:url';
import { resolvePlatform } from './resolve-platform.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function validatePlatformOptions(logger, config, cli, commandName) {
	const platform = resolvePlatform(cli.argv.platform);
	const platformCommand = join(
		__dirname,
		'../..',
		sdkManifest.platforms[sdkManifest.platforms.indexOf(platform)],
		'cli',
		'commands',
		`_${commandName}.js`
	);

	if (!existsSync(platformCommand)) {
		return;
	}

	const command = await import(platformCommand);
	if (typeof command?.validate === 'function') {
		await command.validate(logger, config, cli);
	}
}
