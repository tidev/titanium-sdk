'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const rollup = require('rollup').rollup;
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

const git = require('./git');
const utils = require('./utils');
const Packager = require('./packager');

const ROOT_DIR = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TMP_DIR = path.join(DIST_DIR, 'tmp');

// platforms/OS mappings
const ALL_OSES = [ 'win32', 'linux', 'osx' ];
const ALL_PLATFORMS = [ 'ios', 'android', 'windows' ];
const OS_TO_PLATFORMS = {
	win32: [ 'android', 'windows' ],
	osx: [ 'android', 'ios' ],
	linux: [ 'android' ]
};

function thisOS() {
	let osName = os.platform();
	if (osName === 'darwin') {
		osName = 'osx';
	}
	return osName;
}

function determineBabelOptions(babelOptions) {
	const options = {
		...babelOptions,
		useBuiltIns: 'entry',
		corejs: 3
	};

	return {
		presets: [ [ '@babel/env', options ] ],
		exclude: 'node_modules/**'
	};
}

class Builder {
	constructor(program) {
		this.hostOS = thisOS();

		let platforms = program.args;
		if (program.all) { // packaging for all platforms on all OSes
			this.platforms = ALL_PLATFORMS;
			this.oses = ALL_OSES;
		} else if (!platforms.length || (platforms.length === 1 && platforms[0] === 'full')) { // building/testing/cleaning with no specific platform selected, use all
			this.oses = [ this.hostOS ];
			this.platforms = OS_TO_PLATFORMS[this.hostOS];
		} else { // user enumerated the platforms to work with, assume this current host OS
			// TODO Replace 'ipad' or 'iphone' with 'ios'
			this.platforms = platforms;
			this.oses = [ this.hostOS ];
		}

		this.program = program;
		this.program.timestamp = utils.timestamp();
		this.program.versionTag = program.versionTag || program.sdkVersion;
	}

	async clean() {
		// TODO: Clean platforms in parallel
		for (const p of this.platforms) {
			const Platform = require(`./${p}`); // eslint-disable-line security/detect-non-literal-require
			const platform = new Platform(this.program);
			await platform.clean();
		}
		// TODO: Construct a Packager and have it clean zipdir/file too?
	}

	async test() {
		const zipfile = path.join(DIST_DIR, `mobilesdk-${this.program.versionTag}-${this.hostOS}.zip`);
		// Only enforce zipfile exists if we're going to install it
		if (!this.program.skipSdkInstall && !await fs.exists(zipfile)) {
			throw new Error(`Could not find zipped SDK in dist dir: ${zipfile}. Please run node scons.js cleanbuild first.`);
		}

		const test = require('./test');
		const runTests = test.runTests;
		const outputResults = test.outputResults;
		const results = await runTests(zipfile, this.platforms, this.program);
		return outputResults(results);
	}

	async ensureGitHash() {
		if (this.program.gitHash) {
			return;
		}
		const hash = await git.getHash(ROOT_DIR);
		this.program.gitHash = hash || 'n/a';
	}

	async transpile(platform, babelOptions, outFile) {
		// Copy over common dir, into some temp dir
		// Then run rollup/babel on it, then just copy the resulting bundle to our real destination!
		// The temporary location we'll assembled the transpiled bundle
		const TMP_COMMON_DIR = path.join(TMP_DIR, '_common');
		const TMP_COMMON_PLAFORM_DIR = path.join(TMP_DIR, '_common', platform);

		console.log(`Creating temporary 'common' directory...`); // eslint-disable-line quotes
		await fs.copy(path.join(ROOT_DIR, 'common'), TMP_COMMON_PLAFORM_DIR);

		// create a bundle
		console.log('Transpile and run rollup...');
		const bundle = await rollup({
			input: `${TMP_COMMON_PLAFORM_DIR}/Resources/ti.main.js`,
			plugins: [
				resolve(),
				commonjs(),
				babel(determineBabelOptions(babelOptions))
			],
			external: [ './app', 'com.appcelerator.aca' ]
		});

		if (!outFile) {
			outFile = path.join(TMP_DIR, 'common', platform, 'ti.main.js');
		}

		console.log(`Writing 'common' bundle to ${outFile} ...`); // eslint-disable-line quotes
		await bundle.write({ format: 'cjs', file: outFile });

		// We used to have to copy over ti.internal, but it is now bundled into ti.main.js
		// if we ever have files there that cannot be bundled or are not hooked up properly, we'll need to copy them here manually.

		console.log(`Removing temporary 'common' directory...`); // eslint-disable-line quotes
		await fs.remove(TMP_COMMON_DIR);
	}

	async build() {
		await this.ensureGitHash();
		console.log('Building MobileSDK version %s, githash %s', this.program.sdkVersion, this.program.gitHash);

		// TODO: build platforms in parallel
		for (const item of this.platforms) {
			const Platform = require(`./${item}`); // eslint-disable-line security/detect-non-literal-require
			const platform = new Platform(this.program);
			await this.transpile(item, platform.babelOptions());
			await platform.build();
		}
	}

	async package() {
		await this.ensureGitHash();

		console.log('Packaging Mobile SDK (%s)...', this.program.versionTag);
		// FIXME: Work on allowing parallel OS packaging
		// Only hurdle for packaging in parallel seems to be if a commonjs/hyperloop modules needs to
		// be downloaded (each os would try to grab it simultaneously)
		// await Promise.all(this.oses.map(currentOS => this.packageForOS(currentOS)));

		// For now, package for each os in series
		for (const os of this.oses) {
			await this.packageForOS(os);
		}
		console.log(`Packaging version (${this.program.versionTag}) complete`);
	}

	async packageForOS(currentOS) {
		// Match our master platform list against OS_TO_PLATFORMS[item] listing.
		// Only package the platform if its in both arrays
		const platformsForThisOS = OS_TO_PLATFORMS[currentOS];
		const filteredPlatforms = this.platforms.filter(p => platformsForThisOS.includes(p));

		const packager = new Packager(DIST_DIR, currentOS, filteredPlatforms, this.program);
		return packager.package();
	}

	async generateDocs() {
		if (!this.program.docs) { // are we skipping doc generation?
			return;
		}

		const Documentation = require('./docs');
		const docs = new Documentation(DIST_DIR);
		return docs.generate();
	}

	async install () {
		return utils.installSDK(this.program.versionTag, this.program.symlink);
	}
}

module.exports = Builder;
