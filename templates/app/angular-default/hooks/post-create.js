'use strict';

const fs = require('fs-extra');
const path = require('path');
const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process

exports.id = 'com.appcelerator.angular.post-create';

exports.init = (logger, config, cli) => {
	cli.on('create.post.app', async (creator, next) => {
		const projectName = cli.argv.name;
		const projectPath = path.join(cli.argv['workspace-dir'], projectName);
		copyGitIgnore(projectPath);
		await updatePackageJson(projectPath, { name: projectName });
		logger.info('Installing Angular project dependencies');
		await installDependencies(projectPath);
		next();
	});
};

async function updatePackageJson(projectPath, data) {
	const packageJsonPath = path.join(projectPath, 'package.json');
	if (await fs.exists(packageJsonPath)) {
		let pkg = await fs.readJson(packageJsonPath);
		Object.assign(pkg, data);
		fs.writeJson(packageJsonPath, pkg);
	}
}

async function installDependencies(projectPath) {
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

async function copyGitIgnore(projectPath) {
	const sourcePath = path.resolve(__dirname, '..', 'template', '.gitignore');
	const destPath = path.join(projectPath, '.gitignore');
	return fs.copyFile(sourcePath, destPath);
}
