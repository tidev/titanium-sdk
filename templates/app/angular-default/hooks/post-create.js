'use strict';

const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process

exports.id = 'com.appcelerator.angular.post-create';

exports.init = (logger, config, cli) => {
	cli.on('create.post.app', (creator, next) => {
		const projectName = cli.argv.name;
		const projectPath = path.join(cli.argv['workspace-dir'], projectName);
		const packageJsonPath = path.join(projectPath, 'app', 'package.json');
		if (fs.existsSync(packageJsonPath)) {
			let packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
			packageJson.name = projectName;
			fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));
		}

		logger.info('Installing Angular project dependencies');
		let errorOutput = '';
		let npmExecutable = 'npm';
		const spawnOptions = { cwd: path.dirname(packageJsonPath) };
		if (process.platform === 'win32') {
			spawnOptions.shell = true;
			npmExecutable += '.cmd';
		}
		const child = spawn(npmExecutable, [ 'i' ], spawnOptions);
		child.on('close', code => {
			if (code !== 0) {
				logger.error(errorOutput);
				return next(new Error('Failed to install dependencies.'));
			}

			next();
		});
		child.stderr.on('data', data => {
			errorOutput += data.toString();
		});
	});
};
