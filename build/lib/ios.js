'use strict';

const path = require('path');
const fs = require('fs-extra');
const utils = require('./utils');
const spawn = require('child_process').spawn;  // eslint-disable-line security/detect-child-process
const copyFiles = utils.copyFiles;
const copyAndModifyFile = utils.copyAndModifyFile;
const globCopy = utils.globCopy;
const globCopyFlat = utils.globCopyFlat;

const ROOT_DIR = path.join(__dirname, '../..');
const IOS_ROOT = path.join(ROOT_DIR, 'iphone');
const IOS_LIB = path.join(IOS_ROOT, 'lib');

class IOS {
	/**
	 * @param {Object} options options object
	 * @param {String} options.sdkVersion version of Titanium SDK
	 * @param {String} options.gitHash SHA of Titanium SDK HEAD
	 * @param {String} options.timestamp Value injected for Ti.buildDate
	 * @constructor
	 */
	constructor(options) {
		this.sdkVersion = options.sdkVersion;
		this.gitHash = options.gitHash;
		this.timestamp = options.timestamp;
	}

	async clean() {
		return fs.remove(path.join(IOS_ROOT, 'TitaniumKit/build'));
	}

	async build() {
		console.log('Building TitaniumKit ...');

		return new Promise((resolve, reject) => {
			const buildScript = path.join(ROOT_DIR, 'support/iphone/build_titaniumkit.sh');
			const child = spawn(buildScript, [ '-v', this.sdkVersion, '-t', this.timestamp, '-h', this.gitHash ]);
			child.stdout.on('data', data => console.log(`\n${data}`));
			child.stderr.on('data', data => console.log(`\n${data}`));

			child.on('exit', code => {
				if (code) {
					const err = new Error(`TitaniumKit build exited with code ${code}`);
					console.error(err);
					return reject(err);
				}

				console.log('TitaniumKit built successfully!');
				return resolve();
			});
		});
	}

	async package(packager) {
		// FIXME This is a hot mess. Why can't we place artifacts in their proper location already like Windows?
		console.log('Packaging iOS platform...');
		const DEST_IOS = path.join(packager.zipSDKDir, 'iphone');

		// Copy legacy copies of TiBase.h, TiApp.h etc into 'include/' to retain backwards compatibility in SDK 8.0.0
		// TODO: Inject a deprecation warning if used and remove in SDK 9.0.0
		await globCopyFlat('**/*.h', path.join(IOS_ROOT, 'TitaniumKit/TitaniumKit/Sources'), path.join(DEST_IOS, 'include'));

		// Copy legacy copies of APSAnalytics.h and APSHTTPClient.h into 'include/' to retain backwards compatibility in SDK 8.0.0
		// TODO: Inject a deprecation warning if used and remove in SDK 9.0.0
		await globCopy('**/*.h', path.join(IOS_ROOT, 'TitaniumKit/TitaniumKit/Libraries'), path.join(DEST_IOS, 'include'));

		// Copy meta files and directories
		await copyFiles(IOS_ROOT, DEST_IOS, [ 'AppledocSettings.plist', 'Classes', 'cli', 'iphone', 'templates' ]);

		// Copy TitaniumKit
		await copyFiles(path.join(IOS_ROOT, 'TitaniumKit/build/Release-iphoneuniversal'), path.join(DEST_IOS, 'Frameworks'), [ 'TitaniumKit.framework' ]);

		// Copy module templates (Swift & Obj-C)
		await copyFiles(IOS_ROOT, DEST_IOS, [ 'AppledocSettings.plist', 'Classes', 'cli', 'iphone', 'templates' ]);

		// Copy and inject values for special source files
		await this.injectSDKConstants(path.join(DEST_IOS, 'main.m'));

		// Copy Ti.Verify
		await copyFiles(IOS_LIB, DEST_IOS, [ 'libtiverify.a' ]);

		// Copy iphone/package.json, but replace __VERSION__ with our version!
		await copyAndModifyFile(IOS_ROOT, DEST_IOS, 'package.json', { __VERSION__: this.sdkVersion });

		// Copy iphone/Resources/modules/<name>/* to this.zipSDKDir/iphone/modules/<name>/images
		// TODO: Pretty sure these can be removed nowadays
		return fs.copy(path.join(IOS_ROOT, 'Resources/modules'), path.join(DEST_IOS, 'modules'));
	}

	async injectSDKConstants(dest) {
		const subs = {
			__SDK_VERSION__: this.sdkVersion,
			__BUILD_DATE__: this.timestamp,
			__BUILD_HASH__: this.gitHash
		};
		// TODO: DO we need this? The above constants are not even used so far.
		// TODO: Use copyAndModifyFile?
		const contents = await fs.readFile(path.join(ROOT_DIR, 'support/iphone/main.m'), 'utf8');
		const newContents = contents.replace(/(__.+?__)/g, function (match, key) {
			const s = subs.hasOwnProperty(key) ? subs[key] : key;
			return typeof s === 'string' ? s.replace(/"/g, '\\"').replace(/\n/g, '\\n') : s;
		});
		return fs.writeFile(dest, newContents);
	}
}

module.exports = IOS;
