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
		// FIXME: This is a hot mess. Why can't we place artifacts in their proper location already like Windows?
		console.log('Packaging iOS platform...');
		const DEST_IOS = path.join(packager.zipSDKDir, 'iphone');

		// Gather all the *.h files in TitaniumKit, create "redirecting" headers in iphone/include that point to the TitaniumKit ones
		await fs.ensureDir(path.join(DEST_IOS, 'include'));
		const subdirs = await fs.readdir(path.join(IOS_ROOT, 'TitaniumKit/build/Release-iphoneuniversal/TitaniumKit.framework/Headers'));
		for (const file of subdirs) {
			// TODO: Inject a deprecation warning if used and remove in SDK 9.0.0
			await fs.writeFile(path.join(DEST_IOS, 'include', file), `#include <TitaniumKit/${file}>\n`);
		}
		// Copy legacy copies of APSAnalytics.h and APSHTTPClient.h into 'include/' subdirs 'APSAnalytics' and 'APSHTTPClient' to retain backwards compatibility in SDK 8.0.0
		await fs.ensureDir(path.join(DEST_IOS, 'include/APSAnalytics'));
		await fs.move(path.join(DEST_IOS, 'include/APSAnalytics.h'), path.join(DEST_IOS, 'include/APSAnalytics/APSAnalytics.h'));
		await fs.ensureDir(path.join(DEST_IOS, 'include/APSHTTPClient'));
		await fs.move(path.join(DEST_IOS, 'include/APSHTTPClient.h'), path.join(DEST_IOS, 'include/APSHTTPClient/APSHTTPClient.h'));
		// TODO: Wipe the other APSUtility.h and APSHTTP*.h headers?

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
