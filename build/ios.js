'use strict';

const path = require('path'),
	async = require('async'),
	fs = require('fs-extra'),
	utils = require('./utils'),
	util = require('util'),
	promisify = util.promisify,
	callbackify = util.callbackify,
	glob = promisify(require('glob')),
	{ spawn } = require('child_process'),  // eslint-disable-line security/detect-child-process
	copyFiles = utils.copyFiles,
	copyAndModifyFile = utils.copyAndModifyFile,
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

/**
 * This generates "redirecting" headers in built SDK's iphone/include directory that points to the "real" headers
 * whether they are in TitaniumKit's framework, or the iphone/Classes directory
 * This should retain backwards compatibility for module builds and allow iphone/include to be a sort of single header path that can be used
 *
 * @param {string} DEST_IOS destination directory to copy files to
 */
async function copyLegacyHeaders(DEST_IOS) {
	// Gather all the *.h files in TitaniumKit, create "redirecting" headers in iphone/include that point to the TitaniumKit ones
	await fs.ensureDir(path.join(DEST_IOS, 'include'));
	const subdirs = await fs.readdir(path.join(IOS_ROOT, 'TitaniumKit/build/Release-iphoneuniversal/TitaniumKit.framework/Headers'));
	// create them all in parallel
	await Promise.all(subdirs.map(file => {
		// TODO: Inject a deprecation warning if used and remove in SDK 9.0.0?
		return fs.writeFile(path.join(DEST_IOS, 'include', file), `#import <TitaniumKit/${file}>\n`);
	}));

	// re-arrange redirecting headers for iphone/TitaniumKit/TitankumKit/Libraries/*/*.h files
	const libDirs = await fs.readdir(path.join(IOS_ROOT, 'TitaniumKit/TitaniumKit/Libraries'));
	for (const libDir of libDirs) {
		await fs.ensureDir(path.join(DEST_IOS, 'include', libDir));
		const libFiles = await fs.readdir(path.join(IOS_ROOT, 'TitaniumKit/TitaniumKit/Libraries', libDir));
		for (const libFile of libFiles) {
			if (libFile.endsWith('.h') && libFile !== 'APSUtility.h') { // for whatever reason APSUtility.h seems not to get copied as part of framework?
				await fs.move(path.join(DEST_IOS, 'include', libFile), path.join(DEST_IOS, 'include', libDir, libFile));
			}
		}
	}

	// Create redirecting headers in iphone/include/ pointing to iphone/Classes/ headers
	// TODO: Use map and Promise.all to run these in parallel
	const classesHeaders = await glob('**/*.h', { cwd: path.join(IOS_ROOT, 'Classes') });
	for (const classHeader of classesHeaders) {
		let depth = 1;
		if (classHeader.includes(path.sep)) { // there's a sub-directory
			await fs.ensureDir(path.join(DEST_IOS, 'include', path.dirname(classHeader))); // make sure we create destination
			depth = classHeader.split(path.sep).length;
		}
		// TODO: Inject a deprecation warning if used and remove in SDK 9.0.0?
		await fs.writeFile(path.join(DEST_IOS, 'include', classHeader), `#import "${'../'.repeat(depth)}Classes/${classHeader}"\n`);
	}
}

IOS.prototype.package = function (packager, next) {
	// FIXME: This is a hot mess. Why can't we place artifacts in their proper location already like Windows?
	console.log('Zipping iOS platform...');
	const DEST_IOS = path.join(packager.zipSDKDir, 'iphone');

	async.parallel([
		function (callback) {
			async.series([
				function copyMetaFiles (cb) {
					callbackify(copyLegacyHeaders)(DEST_IOS, cb);
				},
				// Copy meta files and directories
				// Copy module templates (Swift & Obj-C)
				function copyMetaFiles (cb) {
					copyFiles(IOS_ROOT, DEST_IOS, [ 'AppledocSettings.plist', 'Classes', 'cli', 'iphone', 'templates' ], cb);
				},
				// Copy TitaniumKit
				function copyTitaniumKit (cb) {
					copyFiles(path.join(IOS_ROOT, 'TitaniumKit', 'build', 'Release-iphoneuniversal'), path.join(DEST_IOS, 'Frameworks'), [ 'TitaniumKit.framework' ], cb);
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
