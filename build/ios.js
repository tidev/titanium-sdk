'use strict';

const path = require('path'),
	async = require('async'),
	fs = require('fs-extra'),
	utils = require('./utils'),
	{ spawn } = require('child_process'),  // eslint-disable-line security/detect-child-process
	copyFiles = utils.copyFiles,
	copyAndModifyFile = utils.copyAndModifyFile,
	globCopy = utils.globCopy,
	globCopyFlat = utils.globCopyFlat,
	ROOT_DIR = path.join(__dirname, '..'),
	IOS_ROOT = path.join(ROOT_DIR, 'iphone'),
	IOS_LIB = path.join(IOS_ROOT, 'lib');

/**
 * @param {Object} options options object
 * @param {String} options.sdkVersion version of Titanium SDK
 * @param {String} options.gitHash SHA of Titanium SDK HEAD
 * @param {String} options.timestamp Value injected for Ti.buildDate
 * @constructor
 */
function IOS(options) {
	this.sdkVersion = options.sdkVersion;
	this.gitHash = options.gitHash;
	this.timestamp = options.timestamp;
}

IOS.prototype.clean = function (next) {
	// no-op
	next();
};

IOS.prototype.build = function (next) {
	console.log('Building TitaniumKit ...');

	const child = spawn(path.join(ROOT_DIR, 'support', 'iphone', 'build_titaniumkit.sh'), [ '-v', this.sdkVersion, '-t', this.timestamp, '-h', this.gitHash ]);

	child.stdout.on('data', (data) => {
		console.log(`\n${data}`);
	});

	child.stderr.on('data', (data) => {
		console.log(`\n${data}`);
	});

	child.on('exit', code => {
		if (code) {
			const err = new Error(`TitaniumKit build exited with code ${code}`);
			console.error(err);
			return next(err);
		}

		console.log('TitaniumKit built successfully!');
		return next();
	});
};

IOS.prototype.package = function (packager, next) {
	// FIXME This is a hot mess. Why can't we place artifacts in their proper location already like Windows?
	console.log('Zipping iOS platform...');
	const DEST_IOS = path.join(packager.zipSDKDir, 'iphone');

	async.parallel([
		function (callback) {
			async.series([
				// Copy legacy copies of TiBase.h, TiApp.h etc into 'include/' to retain backwards compatibility in SDK 8.0.0
				// TODO: Inject a deprecation warning if used and remove in SDK 9.0.0
				function copyLegacyCoreHeaders (cb) {
					globCopyFlat('**/*.h', path.join(IOS_ROOT, 'TitaniumKit', 'TitaniumKit', 'Sources'), path.join(DEST_IOS, 'include'), cb);
				},
				// Copy legacy copies of APSAnalytics.h and APSHTTPClient.h into 'include/' to retain backwards compatibility in SDK 8.0.0
				// TODO: Inject a deprecation warning if used and remove in SDK 9.0.0
				function copyLegacyLibraryHeaders (cb) {
					globCopy('**/*.h', path.join(IOS_ROOT, 'TitaniumKit', 'TitaniumKit', 'Libraries'), path.join(DEST_IOS, 'include'), cb);
				},
				// Copy meta files and directories
				function copyMetaFiles (cb) {
					copyFiles(IOS_ROOT, DEST_IOS, [ 'AppledocSettings.plist', 'Classes', 'cli', 'iphone', 'templates' ], cb);
				},
				// Copy TitaniumKit
				function copyTitaniumKit (cb) {
					copyFiles(path.join(IOS_ROOT, 'TitaniumKit', 'build', 'Release-iphoneuniversal'), path.join(DEST_IOS, 'Frameworks'), [ 'TitaniumKit.framework' ], cb);
				},
				// Copy module templates (Swift & Obj-C)
				function copyModuleTemplates (cb) {
					copyFiles(IOS_ROOT, DEST_IOS, [ 'AppledocSettings.plist', 'Classes', 'cli', 'iphone', 'templates' ], cb);
				},
				// Copy and inject values for special source files
				function injectSDKConstants (cb) {
					const subs = {
						__SDK_VERSION__: this.sdkVersion,
						__BUILD_DATE__: this.timestamp,
						__BUILD_HASH__: this.gitHash
					};
					// TODO: DO we need this? The above constants are not even used so far.
					const dest = path.join(DEST_IOS, 'main.m');
					const contents = fs.readFileSync(path.join(ROOT_DIR, 'support', 'iphone', 'main.m')).toString().replace(/(__.+?__)/g, function (match, key) {
						const s = subs.hasOwnProperty(key) ? subs[key] : key;
						return typeof s === 'string' ? s.replace(/"/g, '\\"').replace(/\n/g, '\\n') : s;
					});
					fs.writeFileSync(dest, contents);
					cb();
				}.bind(this),

				// Copy Ti.Verify
				function copyTiVerify (cb) {
					copyFiles(IOS_LIB, DEST_IOS, [ 'libtiverify.a' ], cb);
				},
				// Copy iphone/package.json, but replace __VERSION__ with our version!
				function copyPackageJSON (cb) {
					copyAndModifyFile(IOS_ROOT, DEST_IOS, 'package.json', { __VERSION__: this.sdkVersion }, cb);
				}.bind(this),
				// Copy iphone/Resources/modules/<name>/* to this.zipSDKDir/iphone/modules/<name>/images
				// TODO: Pretty sure these can be removed nowadays
				function copyModuleAssets (cb) {
					fs.copy(path.join(IOS_ROOT, 'Resources', 'modules'), path.join(DEST_IOS, 'modules'), cb);
				}
			], callback);
		}.bind(this)
	], function (err) {
		if (err) {
			return next(err);
		}
		next();
	});
};

module.exports = IOS;
