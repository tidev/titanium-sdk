#!/usr/bin/env node
'use strict';

const program = require('commander');
const fs = require('fs-extra');
const path = require('path');
const IOS = require('./lib/ios');
const Builder = require('./lib/builder');
const { i18n } = require('node-titanium-sdk');
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
	const program = { args: [ 'ios' ] };
	const builder = new Builder(program);
	await builder.ensureGitHash();
	const ios = new IOS({
		sdkVersion: require('../package.json').version,
		gitHash: program.gitHash,
		timestamp: program.timestamp
	});
	await builder.transpile('ios', ios.babelOptions(), path.join(outputDir, 'ti.main.js'));
}

async function main(tmpBundleDir) {
	await fs.emptyDir(tmpBundleDir);
	await generateBundle(appDir); // run rollup/babel to generate single bundled ti.main.js in app
	console.log(`Removing temp dir used for bundling: ${tmpBundleDir}`);
	await fs.remove(tmpBundleDir); // remove tmp location
	console.log(`Copying xcode resources: ${xcodeProjectResources} -> ${appDir}`);
	await fs.copy(xcodeProjectResources, appDir, { dereference: true }); // copy our xcode app resources
	console.log('Creating i18n files');
	await generateI18n();
	console.log('Generating index.json');
	await generateIndexJSON(appDir); // generate _index_.json file for require file existence checks
}

async function generateI18n () {
	const project = path.join(projectDir, '..');

	const i18nData = i18n.load(project);
	const fileHeader = '/**\n * Appcelerator Titanium\n * this is a generated file - DO NOT EDIT\n */\n\n';
	for (const [ language, data ] of Object.entries(i18nData)) {
		const dir = path.join(appDir, `${language}.lproj`);
		await fs.ensureDir(dir);
		if (data.strings) {
			const stringsFile = path.join(dir, 'Localizable.strings');
			await fs.writeFile(stringsFile, `${fileHeader}${buildI18nData(data.strings)}`);
		}
		if (data.app) {
			const appFile = path.join(dir, 'InfoPlist.strings');
			await fs.writeFile(appFile, `${fileHeader}${buildI18nData(data.app, { appname: 'CFBundleDisplayName' })}`);
		}
	}
}

function buildI18nData (data, map) {
	return Object.keys(data).map(function (name) {
		return '"' + (map && map[name] || name).replace(/\\"/g, '"').replace(/"/g, '\\"')
			+ '" = "' + ('' + data[name]).replace(/%s/g, '%@').replace(/\\"/g, '"').replace(/"/g, '\\"') + '";';
	}).join('\n');
}

main('/tmp/xcode-titanium')
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
