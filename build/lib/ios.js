'use strict';

const path = require('path');
const fs = require('fs-extra');
const utils = require('./utils');
const promisify = require('util').promisify;
const glob = promisify(require('glob'));
const spawn = require('child_process').spawn;  // eslint-disable-line security/detect-child-process
const copyFiles = utils.copyFiles;
const copyAndModifyFile = utils.copyAndModifyFile;

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

	babelOptions() {
		// eslint-disable-next-line security/detect-non-literal-require
		const { minIosVersion } = require(path.join(ROOT_DIR, 'iphone/package.json'));

		return {
			targets: {
				ios: minIosVersion
			},
			transform: {
				platform: 'ios',
				Ti: {
					version: this.sdkVersion,
					buildHash: this.gitHash,
					buildDate: this.timestamp,
					Platform: {
						runtime: 'javascriptcore',
						manufacturer: 'apple',
					},
					Filesystem: {
						lineEnding: '\n',
						separator: '/',
					},
				},
			},
		};
	}

	async clean() {
		return fs.remove(path.join(IOS_ROOT, 'TitaniumKit/build'));
	}

	async build() {
		console.log('Building TitaniumKit ...');

		return new Promise((resolve, reject) => {
			const buildScript = path.join(ROOT_DIR, 'support/iphone/build_titaniumkit.sh');
			const child = spawn(buildScript, [ '-v', this.sdkVersion, '-t', this.timestamp, '-h', this.gitHash ], { stdio: 'inherit' });
			child.on('error', reject);
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

	/**
	 * This generates "redirecting" headers in built SDK's iphone/include directory that points to the "real" headers
	 * whether they are in TitaniumKit's framework, or the iphone/Classes directory
	 * This should retain backwards compatibility for module builds and allow iphone/include to be a sort of single header path that can be used
	 *
	 * @param {string} DEST_IOS destination directory to copy files to
	 */
	async copyLegacyHeaders(DEST_IOS) {
		// Gather all the *.h files in TitaniumKit, create "redirecting" headers in iphone/include that point to the TitaniumKit ones
		await fs.ensureDir(path.join(DEST_IOS, 'include'));
		const subdirs = await fs.readdir(path.join(IOS_ROOT, 'TitaniumKit/build/TitaniumKit.xcframework/ios-armv7_arm64/TitaniumKit.framework/Headers'));
		// create them all in parallel
		await Promise.all(subdirs.map(file => {
			// TODO: Inject a deprecation warning if used and remove in SDK 9.0.0?
			return fs.writeFile(path.join(DEST_IOS, 'include', file), `#import <TitaniumKit/${file}>\n`);
		}));

		// re-arrange redirecting headers for iphone/TitaniumKit/TitankumKit/Libraries/*/*.h files
		const libDirs = await fs.readdir(path.join(IOS_ROOT, 'TitaniumKit/TitaniumKit/Libraries'));
		for (const libDir of libDirs) {
			const fullLibDir = path.join(IOS_ROOT, 'TitaniumKit/TitaniumKit/Libraries', libDir);
			if (!(await fs.lstat(fullLibDir)).isDirectory()) { // if not a directory (like .DS_Store), move on
				continue;
			}
			await fs.ensureDir(path.join(DEST_IOS, 'include', libDir));
			const libFiles = await fs.readdir(fullLibDir);
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

	async package(packager) {
		// FIXME: This is a hot mess. Why can't we place artifacts in their proper location already like Windows?
		console.log('Packaging iOS platform...');
		const DEST_IOS = path.join(packager.zipSDKDir, 'iphone');

		return Promise.all([
			this.copyLegacyHeaders(DEST_IOS),

			// Copy meta files and directories
			// Copy module templates (Swift & Obj-C)
			copyFiles(IOS_ROOT, DEST_IOS, [ 'AppledocSettings.plist', 'Classes', 'cli', 'iphone', 'templates' ]),

			// Copy TitaniumKit
			fs.copySync(path.join(IOS_ROOT, 'TitaniumKit/build/TitaniumKit.xcframework'), path.join(DEST_IOS, 'Frameworks/TitaniumKit.xcframework')),

			// Copy and inject values for special source files
			this.injectSDKConstants(path.join(DEST_IOS, 'main.m')),

			// Copy tiverify.xcframework
			copyFiles(IOS_LIB, path.join(DEST_IOS, 'Frameworks'), [ 'tiverify.xcframework' ]),

			// Copy iphone/package.json, but replace __VERSION__ with our version!
			copyAndModifyFile(IOS_ROOT, DEST_IOS, 'package.json', { __VERSION__: this.sdkVersion }),

			// Copy iphone/Resources/modules/<name>/* to this.zipSDKDir/iphone/modules/<name>/images
			// TODO: Pretty sure these can be removed nowadays
			fs.copy(path.join(IOS_ROOT, 'Resources/modules'), path.join(DEST_IOS, 'modules'))
		]);
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
			const s = Object.prototype.hasOwnProperty.call(subs, key) ? subs[key] : key;
			return typeof s === 'string' ? s.replace(/"/g, '\\"').replace(/\n/g, '\\n') : s;
		});
		return fs.writeFile(dest, newContents);
	}
}

module.exports = IOS;
