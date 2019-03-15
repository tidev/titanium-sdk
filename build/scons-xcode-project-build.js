#!/usr/bin/env node
'use strict';

const program = require('commander');
const util = require('util');
const exec = util.promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process
const fs = require('fs-extra');
const path = require('path');
const copyPackageAndDependencies = require('./utils').copyPackageAndDependencies;
const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const appc = require('node-appc');
const version = appc.version;

program.parse(process.argv);

const projectDir = program.args[0];
const targetBuildDir = program.args[1];
const productName = program.args[2];

const commonSDKJS = path.join(__dirname, '../common/Resources');
const appDir = path.join(targetBuildDir, `${productName}.app`);
const xcodeProjectResources = path.join(projectDir, '../Resources');
const localeCompiler = path.join(__dirname, '../support/dev/localecompiler.py');

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

function determineBabelOptions() {
	const minSupportedIosSdk = version.parseMin(require('../iphone/package.json').vendorDependencies['ios sdk']);
	const options = {
		targets: {
			ios: minSupportedIosSdk
		},
		useBuiltIns: 'entry',
		// DO NOT include web polyfills!
		exclude: [ 'web.dom.iterable', 'web.immediate', 'web.timers' ]
	};
	return {
		presets: [ [ '@babel/env', options ] ],
		exclude: 'node_modules/**'
	};
}

async function copyPolyfills(dir) {
	console.log('Copying JS polyfills over');
	const modulesDir = path.join(dir, 'node_modules');
	// make sure our 'node_modules' destination directory exists
	await fs.emptyDir(modulesDir);
	copyPackageAndDependencies('@babel/polyfill', modulesDir);
}

async function generateBundle(inputDir, outputDir) {
	console.log('Transpiling and bundling common SDK JS');

	// create a bundle
	console.log('running rollup');
	const babelOptions = determineBabelOptions();
	const bundle = await rollup({
		input: `${inputDir}/ti.main.js`,
		plugins: [
			resolve(),
			commonjs(),
			babel(babelOptions)
		],
		external: [ './app', 'com.appcelerator.aca' ]
	});

	// write the bundle to disk
	console.log('Writing common SDK JS bundle to disk');
	return bundle.write({ format: 'cjs', file: `${outputDir}/ti.main.js` });
}

const tmpBundleDir = '/tmp/xcode-titanium';
fs.emptyDir(tmpBundleDir)
	.then(() => fs.copy(commonSDKJS, tmpBundleDir)) // copy our common SDK JS files to tmp location
	.then(() => copyPolyfills(tmpBundleDir)) // copy @babel/polyfill there too
	.then(() => generateBundle(tmpBundleDir, appDir)) // run rollup/babel to generate single bundled ti.main.js in app
	.then(() => fs.remove(tmpBundleDir)) // remove tmp location
	.then(() => fs.copy(xcodeProjectResources, appDir)) // copy our xcode app resources
	.then(() => exec(`${localeCompiler} "${path.join(projectDir, '..')}" ios simulator "${appDir}"`)) // create i18n files
	.then(() => generateIndexJSON(appDir)) // generate _index_.json file for require file existence checks
	.then(() => process.exit(0)) // done!
	.catch(err => {
		console.error(err);
		process.exit(1);
	});

