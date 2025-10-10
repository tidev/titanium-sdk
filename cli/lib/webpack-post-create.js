import ejs from 'ejs';
import fs from 'fs-extra';
import path from 'node:path';
import { spawn } from 'node:child_process';

export function templateHookDir(logger, config, cli) {
	const templatePath = path.resolve(templateHookDir, '..', 'template');
	cli.on('create.post.app', async (creator, next) => {
		const projectName = cli.argv.name;
		const projectPath = path.join(cli.argv['workspace-dir'], projectName);
		try {
			await Promise.all([
				copyGitIgnore(templatePath, projectPath),
				updatePackageJson(projectPath, { name: projectName }),
				renderReadme(projectPath, { name: projectName }),
				installDependencies(projectPath, logger)
			]);
		} catch (e) {
			logger.error(e);
			next(e);
		}
		next();
	});
}

async function copyGitIgnore(templatePath, projectPath) {
	const sourcePath = path.resolve(templatePath, '.gitignore');
	const destPath = path.join(projectPath, '.gitignore');
	return fs.copyFile(sourcePath, destPath);
}

async function updatePackageJson(projectPath, data) {
	const packageJsonPath = path.join(projectPath, 'package.json');
	if (await fs.exists(packageJsonPath)) {
		let pkg = await fs.readJson(packageJsonPath);
		Object.assign(pkg, data);
		return fs.writeJson(packageJsonPath, pkg);
	}
}

async function renderReadme(projectPath, data) {
	const readmePath = path.join(projectPath, 'README.md');
	const readmeTemplate = await fs.readFile(readmePath, 'utf-8');
	const readmeContent = ejs.render(readmeTemplate, {
		buildCmd: 'ti build',
		...data
	});
	return fs.writeFile(readmePath, readmeContent);
}

async function installDependencies(projectPath, logger) {
	logger.info('Installing project dependencies');
	let npmExecutable = 'npm';
	const spawnOptions = {
		cwd: projectPath,
		stdio: 'inherit'
	};
	if (process.platform === 'win32') {
		spawnOptions.shell = true;
		npmExecutable += '.cmd';
	}
	return new Promise((resolve, reject) => {
		const child = spawn(npmExecutable, [ 'i' ], spawnOptions);
		child.on('close', code => {
			if (code !== 0) {
				return reject(new Error('Failed to install project dependencies.'));
			}

			resolve();
		});
	});
}
