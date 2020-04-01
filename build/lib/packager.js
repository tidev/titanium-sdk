'use strict';

const promisify = require('util').promisify;
const path = require('path');
const os = require('os');
const exec = promisify(require('child_process').exec);  // eslint-disable-line security/detect-child-process
const fs = require('fs-extra');
const packageJSON = require('../../package.json');
const utils = require('./utils');
const copyFile = utils.copyFile;
const copyFiles = utils.copyFiles;
const moduleCopier = require('./module-copier');

const ROOT_DIR = path.join(__dirname, '../..');
const TMP_DIR = path.join(ROOT_DIR, 'dist', 'tmp');
const SUPPORT_DIR = path.join(ROOT_DIR, 'support');

const TITANIUM_PREP_LOCATIONS = [
	'android/titanium_prep.linux32',
	'android/titanium_prep.linux64',
	'android/titanium_prep.macos',
	'iphone/titanium_prep'
];

/**
 * Given a folder we'd like to zip up and the destination filename, this will zip up the directory contents.
 * Be aware that the top-level of the zip will not be the directory itself, but it's contents.
 *
 * @param  {String}   cwd   The folder whose contents will become the zip contents
 * @param  {String}   filename The output zipfile
 * @returns {Promise<void>}
 */
async function zip(cwd, filename) {
	const command = os.platform() === 'win32' ? path.join(ROOT_DIR, 'build/win32/zip') : 'zip';
	await exec(`${command} -9 -q -r "${path.join('..', path.basename(filename))}" *`, { cwd });

	const outputFolder = path.resolve(cwd, '..');
	const outputFile = path.join(outputFolder, path.basename(filename));

	if (outputFile === filename) {
		return;
	}

	const destFolder = path.dirname(filename);
	return copyFile(outputFolder, destFolder, path.basename(filename));
}

class Packager {
	/**
	 * @param {String} outputDir path to place the temp files and zipfile
	 * @param {String} targetOS  'win32', 'linux', or 'osx'
	 * @param {string[]} platforms The list of SDK platforms to package ('ios', 'android')
	 * @param {object} options the options object passed around
	 * @param {string} options.sdkVersion version string to use
	 * @param {string} options.versionTag version tag
	 * @param {string} options.gitHash git commit SHA
	 * @param {string} options.timestamp build date/timestamp
	 * @param {boolean} [options.skipZip] Optionally skip zipping up the result
	 * @constructor
	 */
	constructor(outputDir, targetOS, platforms, options) {
		this.srcDir = ROOT_DIR;
		this.outputDir = outputDir; // root folder where output is placed
		this.targetOS = targetOS;
		this.platforms = platforms;
		this.version = options.sdkVersion;
		this.versionTag = options.versionTag;
		this.gitHash = options.gitHash;
		this.timestamp = options.timestamp;
		this.zipFile = path.join(this.outputDir, `mobilesdk-${this.versionTag}-${this.targetOS}.zip`);
		// Location where we build up the zip file contents
		this.zipDir = path.join(this.outputDir, `mobilesdk-${this.versionTag}-${this.targetOS}`);
		this.zipSDKDir = path.join(this.zipDir, 'mobilesdk', this.targetOS, this.versionTag);
		this.commonResourcesDir = path.join(this.zipSDKDir, 'common', 'Resources');
		this.skipZip = options.skipZip;
		this.options = options;
	}

	/**
	 * @returns {Promise<void>}
	 */
	async package() {
		await this.cleanZipDir();
		// do as much in parallel as we can...
		const tasks = [
			// copy, prune, hack, massage node_modules/
			this.packageNodeModules(),
			// write manifest.json
			this.generateManifestJSON(),
			// copy misc dirs/files over
			this.copy([ 'CREDITS', 'README.md', 'package.json', 'cli', 'templates' ]),
			// copy over 'common' bundle optimized for each platform
			this.copyCommonBundles(),
			// grab down and unzip the native modules
			this.includePackagedModules(),
			// copy over support/
			this.copySupportDir()
		];
		if (this.options.docs) {
			// copy api.jsca file
			tasks.push(fs.copy(path.join(this.outputDir, 'api.jsca'), path.join(this.zipSDKDir, 'api.jsca')));
		}
		await Promise.all(tasks);

		// Zip up all the platforms!
		await this.zipPlatforms();

		// zip up the full SDK
		return this.zip();
	}

	/**
	 * Copy 'common' bundles
	 * @returns {Promise<void>}
	 */
	async copyCommonBundles() {
		await fs.ensureDir(this.commonResourcesDir);
		return fs.copy(path.join(TMP_DIR, 'common'), this.commonResourcesDir);
	}

	/**
	 * Runs the set of modifications to node_modules/ in series
	 * @returns {Promise<void>}
	 */
	async packageNodeModules() {
		console.log('Copying production npm dependencies');
		// Copy node_modules/
		await moduleCopier.execute(this.srcDir, this.zipSDKDir);

		// Remove any remaining binary scripts from node_modules
		await fs.remove(path.join(this.zipSDKDir, 'node_modules/.bin'));

		// Now include all the pre-built node-ios-device bindings/binaries
		if (this.targetOS === 'osx') {
			let dir = path.join(this.zipSDKDir, 'node_modules/node-ios-device');
			if (!await fs.exists(dir)) {
				dir = path.join(this.zipSDKDir, 'node_modules/ioslib/node_modules/node-ios-device');
			}

			if (!await fs.exists(dir)) {
				throw new Error('Unable to find node-ios-device module');
			}

			await exec('node bin/download-all.js', { cwd: dir, stdio: 'inherit' });
		}

		// Include 'ti.cloak'
		await utils.unzip(path.join(ROOT_DIR, 'support', 'ti.cloak.zip'), path.join(this.zipSDKDir, 'node_modules'));

		// hack the fake titanium-sdk npm package in
		return this.hackTitaniumSDKModule();
	}

	/**
	 * Removes existing zip file and tmp dir used to build it
	 * @returns {Promise<void>}
	 */
	async cleanZipDir() {
		console.log('Cleaning previous zipfile and tmp dir');
		return Promise.all([
			// make sure zipSDKDir exists and is empty
			fs.emptyDir(this.zipSDKDir),
			// Remove existing zip
			fs.remove(this.zipFile)
		]);
	}

	/**
	 * generates the manifest.json we ship with the SDK
	 * @returns {Promise<void>}
	 */
	async generateManifestJSON() {
		console.log('Writing manifest.json');
		const modifiedPlatforms = this.platforms.slice(0); // need to work on a copy!
		const json = {
			name: this.versionTag,
			version: this.version,
			moduleAPIVersion: packageJSON.moduleApiVersion,
			timestamp: this.timestamp,
			githash: this.gitHash
		};

		// Replace ios with iphone
		const index = modifiedPlatforms.indexOf('ios');
		if (index !== -1) {
			modifiedPlatforms.splice(index, 1, 'iphone');
		}
		json.platforms = modifiedPlatforms;
		return fs.writeJSON(path.join(this.zipSDKDir, 'manifest.json'), json);
	}

	/**
	 * Copy files from ROOT_DIR to zipDir.
	 * @param {string[]} files List of files/folders to copy
	 * @returns {Promise<void>}
	 */
	async copy(files) {
		return copyFiles(this.srcDir, this.zipSDKDir, files);
	}

	async hackTitaniumSDKModule() {
		// FIXME Remove these hacks for titanium-sdk when titanium-cli has been released and the tisdk3fixes.js hook is gone!
		// Now copy over hacked titanium-sdk fake node_module
		console.log('Copying titanium-sdk node_module stub for backwards compatibility with titanium-cli');
		await fs.copy(path.join(__dirname, '../titanium-sdk'), path.join(this.zipSDKDir, 'node_modules/titanium-sdk'));

		// Hack the package.json to include "titanium-sdk": "*" in dependencies
		console.log('Inserting titanium-sdk as production dependency');
		const packageJSONPath = path.join(this.zipSDKDir, 'package.json');
		const packageJSON = require(packageJSONPath); // eslint-disable-line security/detect-non-literal-require
		packageJSON.dependencies['titanium-sdk'] = '*';
		return fs.writeJSON(packageJSONPath, packageJSON);
	}

	/**
	 * Includes the pre-packaged pre-built native modules. We now gather them from a JSON file listing URLs to download.
	 */
	async includePackagedModules() {
		console.log('Including pre-packaged native modules...');
		// Unzip all the zipfiles in support/module/packaged
		const supportedPlatforms = this.platforms.concat([ 'commonjs' ]); // we want a copy here...
		// Include aliases for ios/iphone/ipad
		if (supportedPlatforms.includes('ios')
			|| supportedPlatforms.includes('iphone')
			|| supportedPlatforms.includes('ipad')) {
			supportedPlatforms.push('ios', 'iphone', 'ipad');
		}

		// Hyperloop has no single platform downloads yet, so we use a fake platform
		// that will download the all-in-one distribution.
		supportedPlatforms.push('hyperloop');

		let modules = []; // module objects holding url/integrity
		// Read modules.json, grab the object for each supportedPlatform
		// eslint-disable-next-line security/detect-non-literal-require
		const modulesJSON = require(path.join(SUPPORT_DIR, 'module', 'packaged', 'modules.json'));
		supportedPlatforms.forEach(platform => {
			const modulesForPlatform = modulesJSON[platform];
			if (modulesForPlatform) {
				modules = modules.concat(Object.values(modulesForPlatform));
			}
		});
		// remove duplicates
		modules = Array.from(new Set(modules));

		// Fetch the listed modules from URLs, unzip to tmp dir, then copy to our ultimate build dir
		const modulesDir = path.join(this.zipDir, 'modules');

		// We have a race condition problem where where the top-level modules folder and the platform-specific
		// sub-folders are trying to be created at the same time if we copy moduels in parallel
		// How can we avoid? Pre-create the common folder structure in advance!
		await fs.ensureDir(modulesDir);
		const subDirs = this.platforms.concat([ 'commonjs' ]);
		// Convert ios to iphone
		const iosIndex = subDirs.indexOf('ios');
		if (iosIndex !== -1) {
			subDirs[iosIndex] = 'iphone';
		}
		await Promise.all(subDirs.map(d => fs.ensureDir(path.join(modulesDir, d))));
		// Now download/extract/copy the modules
		await Promise.all(modules.map(m => this.handleModule(m)));

		// Need to wipe directories of multi-platform modules for platforms we don't need!
		// i.e. modules/iphone on win32 builds (there because of hyperloop)
		const subdirs = await fs.readdir(modulesDir);
		for (const subDir of subdirs) {
			if (!supportedPlatforms.includes(subDir)) {
				await fs.remove(path.join(modulesDir, subDir));
			}
		}
	}

	async handleModule(m) {
		// download (with caching based on integrity hash)
		const zipFile = await utils.downloadURL(m.url, m.integrity, { progress: false });
		// then unzip to temp dir (again with caching based on inut integrity hash)
		const tmpZipPath = utils.cachedDownloadPath(m.url);
		const tmpOutDir = tmpZipPath.substring(0, tmpZipPath.length - 4); // drop.zip
		console.log(`Unzipping ${zipFile} to ${tmpOutDir}`);
		await utils.cacheUnzip(zipFile, m.integrity, tmpOutDir);
		// then copy from tmp dir over to this.zipDir
		// Might have to tweak this a bit! probably want to copy some subdir
		console.log(`Copying ${tmpOutDir} to ${this.zipDir}`);
		return fs.copy(tmpOutDir, this.zipDir);
	}

	async copySupportDir() {
		const ignoreDirs = [ 'packaged', '.pyc', path.join(SUPPORT_DIR, 'dev'), path.join(SUPPORT_DIR, 'ti.cloak.zip') ];
		// Copy support/ into root, but filter out folders based on OS
		if (this.targetOS !== 'osx') {
			ignoreDirs.push(path.join(SUPPORT_DIR, 'iphone'), path.join(SUPPORT_DIR, 'osx'));
		}
		if (this.targetOS !== 'win32') {
			ignoreDirs.push(path.join(SUPPORT_DIR, 'win32'));
		}
		// FIXME: Usee Array.prototype.some to filter more succinctly
		const filter = src => {
			for (const ignore of ignoreDirs) {
				if (src.includes(ignore)) {
					return false;
				}
			}
			return true;
		};
		await fs.copy(SUPPORT_DIR, this.zipSDKDir, { filter });
		for (let location of TITANIUM_PREP_LOCATIONS) {
			location = path.join(this.zipSDKDir, location);
			if (!await fs.exists(location)) {
				continue;
			}
			await fs.chmod(location, 0o755);
		}
	}

	async zipPlatforms() {
		// TODO: do in parallel?
		for (const p of this.platforms) {
			const Platform = require(`./${p}`); // eslint-disable-line security/detect-non-literal-require
			await new Platform({
				sdkVersion: this.version,
				versionTag: this.versionTag,
				gitHash: this.gitHash,
				timestamp: this.timestamp
			}).package(this);
		}
	}

	/**
	 * Zip it all up and wipe the zip dir
	 * @returns {Promise<void>}
	 */
	async zip() {
		if (this.skipZip) {
			return;
		}

		console.log(`Zipping up packaged SDK to ${this.zipFile}`);
		await zip(this.zipDir, this.zipFile);

		// delete the zipdir!
		return fs.remove(this.zipDir);
	}
}

module.exports = Packager;
