#!/usr/bin/env node
'use strict';

const program = require('commander');
const util = require('util');
const exec = util.promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process
const fs = require('fs-extra');
const path = require('path');
const IOS = require('./lib/ios');
const Builder = require('./lib/builder');

program.parse(process.argv);

const projectDir = program.args[0];
const targetBuildDir = program.args[1];
const productName = program.args[2];

const ROOT_DIR = path.join(__dirname, '..');
var appDir = path.join(targetBuildDir, `${productName}.app`);
if (targetBuildDir.includes('mac') === true) {
	appDir = path.join(targetBuildDir, `${productName}.app`, 'Contents/Resources');
}
const xcodeProjectResources = path.join(projectDir, '../Resources');
const localeCompiler = path.join(ROOT_DIR, 'support/dev/localecompiler.py');

async function generateIndexJSON(dirToTraverse) {
	const index = {};
	const destFile = path.join(dirToTraverse, '_index_.json');

	(function walk(dir) {
		fs.readdirSync(dir).forEach(filename => {
			const file = path.join(dir, filename);
			if (fs.existsSync(file)) {
				if (fs.statSync(file).isDirectory()) {
					walk(file);
				} else if (/\.js(on)?$/.test(filename)) {
					index[file.replace(/\\/g, '/').replace(dirToTraverse + '/', 'Resources/')] = 1;
				}
			}
		});
	}(dirToTraverse));

	const fileExists = await fs.exists(destFile);
	if (fileExists) {
		await fs.unlink(destFile);
	}

	return fs.writeFile(destFile, JSON.stringify(index));
}

async function generateBundle(outputDir) {
	const builder = new Builder({ args: [ 'ios' ] });
	const ios = new IOS({ });

	await builder.transpile('ios', ios.babelOptions, path.join(outputDir, 'ti.main.js'));
}

async function main(tmpBundleDir) {
	await fs.emptyDir(tmpBundleDir);
	await generateBundle(appDir); // run rollup/babel to generate single bundled ti.main.js in app
	console.log(`Removing temp dir used for bundling: ${tmpBundleDir}`);
	await fs.remove(tmpBundleDir); // remove tmp location
	console.log(`Copying xcode resources: ${xcodeProjectResources} -> ${appDir}`);
	await fs.copy(xcodeProjectResources, appDir, { dereference: true }); // copy our xcode app resources
	console.log('Creating i18n files');
	await exec(`${localeCompiler} "${path.join(projectDir, '..')}" ios simulator "${appDir}"`); // create i18n files
	console.log('Generating index.json');
	await generateIndexJSON(appDir); // generate _index_.json file for require file existence checks
}

main('/tmp/xcode-titanium')
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
