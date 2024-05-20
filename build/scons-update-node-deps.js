#!/usr/bin/env node

import { exec, spawn } from 'node:child_process';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (parseInt(process.versions.modules) < 46) {
	console.error('You must run this using Node.js 4.0 or newer. Sorry.');
	process.exit(1);
}

function rm(dir, ignore) {
	fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (name) {
		var file = path.join(dir, name);

		if (ignore && ignore.indexOf(name) !== -1) {
			console.log('  Skipping ' + name);
			return;
		} else if (ignore) {
			// only output for root level
			console.log('  Removing ' + name);
		}

		if (fs.existsSync(file) && fs.statSync(file).isDirectory() && (!ignore || ignore.indexOf(name) === -1)) {
			rm(file);
			fs.rmdirSync(file);
		} else {
			fs.unlinkSync(file);
		}
	});
}

exec('npm -v', async function (err, stdout) {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	if (parseInt(stdout.trim().split('.')) < 3) {
		console.error('You must use npm 3 or newer');
		process.exit(1);
	}

	// make sure we're in the right directory
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	let titaniumDir = __dirname;
	while (1) {
		const p = path.join(titaniumDir, 'package.json');
		if (fs.existsSync(p) && fs.readJsonSync(p).name === 'titanium-mobile') {
			break;
		}
		titaniumDir = path.dirname(titaniumDir);
		if (titaniumDir === path.dirname('/')) {
			console.error('Unable to find Titanium package.json!');
			process.exit(1);
		}
	}

	console.log('Removing old Node modules');

	rm(path.join(titaniumDir, 'node_modules'), []);

	console.log('\nRunning npm install');

	exec('npm install --production --force', function (err) {
		if (err) {
			console.error(err);
			process.exit(1);
		}

		console.log('\nBuilding node-ios-device binaries');

		const nodeIosDeviceDir = path.join(titaniumDir, 'node_modules', 'node-ios-device'),
			child = spawn('sh', [ path.join(nodeIosDeviceDir, 'bin', 'build-all.sh') ], { cwd: nodeIosDeviceDir, stdio: 'inherit' });

		child.on('close', function (code) {
			if (code) {
				console.error('Error: Failed to build node-ios-device');
				process.exit(1);
			}

			rm(path.join(nodeIosDeviceDir, 'build'));

			console.info('\nCompleted successfully!');
			process.exit(0);
		});
	});
});
