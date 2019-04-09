'use strict';

const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');

const ANDROID_DIR = path.resolve('..', 'android');
const ANDROID_PROPS = require(path.join(ANDROID_DIR, 'package.json')); // eslint-disable-line security/detect-non-literal-require
const V8_PROPS = ANDROID_PROPS.v8;
const V8_LIB_DIR = path.join('..', 'dist', 'android', 'libv8', V8_PROPS.version, V8_PROPS.mode, 'libs');

// Obtain target architectures
const TARGETS = [];
for (const target of ANDROID_PROPS.architectures) {
	if (target === 'arm64-v8a') {
		TARGETS.push('arm64');
	} else if (target === 'armeabi-v7a') {
		TARGETS.push('arm');
	} else {
		TARGETS.push(target);
	}
}

/**
 * Runs mksnapshot to generate snapshots for each architecture
 * @param {string} target targets to generate blob
 * @returns {Promise<void>}
 */
async function generateBlob(target) {
	const V8_LIB_TARGET_DIR = path.resolve(V8_LIB_DIR, target);
	const MKSNAPSHOT_PATH = path.join(V8_LIB_TARGET_DIR, 'mksnapshot');
	const BLOB_PATH = path.join(V8_LIB_TARGET_DIR, 'blob.bin');
	const args = [
		'--startup_blob=' + BLOB_PATH
	];

	// Set correct permissions for 'mksnapshot'
	fs.chmodSync(MKSNAPSHOT_PATH, 0o755);

	return new Promise((resolve, reject) => {

		// Snapshot already exists, skip...
		if (fs.existsSync(BLOB_PATH)) {
			resolve();
		}

		// Generate snapshot
		const p = spawn(MKSNAPSHOT_PATH, args);
		p.on('close', code => {
			if (code !== 0) {
				return reject(`"mksnapshot ${args.join(' ')}" failed with exit code: ${code}`);
			}
			resolve();
		});
	});
}

/**
 * Generates V8Snapshots.h header from architecture blobs
 * @returns {Promise<void>}
 */
async function generateHeader() {
	const blobs = {};

	// Load snapshots for each architecture
	for (const target of TARGETS) {
		const V8_LIB_TARGET_DIR = path.resolve(V8_LIB_DIR, target);
		const BLOB_PATH = path.join(V8_LIB_TARGET_DIR, 'blob.bin');

		if (fs.existsSync(BLOB_PATH)) {
			blobs[target] = Buffer.from(fs.readFileSync(BLOB_PATH, 'binary'), 'binary');
		}
	}

	return new Promise(async (resolve, reject) => {

		// Generate 'V8Snapshots.h' from template
		ejs.renderFile(path.join(__dirname, 'V8Snapshots.h.ejs'), blobs, {}, (error, output) => {
			if (error) {
				return reject(error);
			}
			fs.writeFileSync(path.join(ANDROID_DIR, 'runtime', 'v8', 'src', 'native', 'V8Snapshots.h'), output);
			resolve();
		});
	});
}

/**
 * Generates empty snapshot blobs for each supported architecture
 * and creates a header to include the snapshots at build time.
 * NOTE: SNAPSHOT GENERATION IS ONLY SUPPORTED ON macOS
 * @returns {Promise<void>}
 */
async function build() {
	return new Promise(async (resolve, reject) => {

		// Only macOS is supports creating snapshots
		if (os.platform() === 'darwin') {
			for (const target of TARGETS) {
				await generateBlob(target).catch(error => reject(error));
			}
			await generateHeader().catch(error => reject(error));
		}
		resolve();
	});
}

module.exports = { build };
