import ti from 'node-titanium-sdk';
import appc from 'node-appc';
import { dirname, join, sep } from 'node:path';
import { existsSync } from 'node:fs';

export function validateProjectDir(logger, cli, argv, name) {
	const dir = argv[name] || (process.env.SOURCE_ROOT ? join(process.env.SOURCE_ROOT, '..', '..') : '.');
	let projectDir = argv[name] = appc.fs.resolvePath(dir);

	if (!existsSync(projectDir)) {
		logger.banner();
		logger.error('Project directory does not exist\n');
		process.exit(1);
	}

	let tiapp = join(projectDir, 'tiapp.xml');
	while (!existsSync(tiapp) && tiapp.split(sep).length > 2) {
		projectDir = argv[name] = dirname(projectDir);
		tiapp = join(projectDir, 'tiapp.xml');
	}

	if (tiapp.split(sep).length === 2) {
		logger.banner();
		logger.error(`Invalid project directory "${dir}"\n`);
		if (dir === '.') {
			logger.log(`Use the "--project-dir" option to specify the project's directory\n`);
		}
		process.exit(1);
	}

	// load the tiapp.xml
	cli.tiapp = new ti.tiappxml(join(projectDir, 'tiapp.xml'));
}
