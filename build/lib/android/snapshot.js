'use strict';

const promisify = require('util').promisify;
const exec = require('child_process').execFile; // eslint-disable-line security/detect-child-process
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TMP_DIR = path.join(DIST_DIR, 'tmp');
const ANDROID_DIR = path.join(ROOT_DIR, 'android');
const ANDROID_PROPS = require(path.join(ANDROID_DIR, 'package.json')); // eslint-disable-line security/detect-non-literal-require
const V8_PROPS = ANDROID_PROPS.v8;
const V8_LIB_DIR = path.join(ROOT_DIR, 'dist', 'android', 'libv8', V8_PROPS.version, V8_PROPS.mode, 'libs');

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
	const STARTUP_PATH = path.join(TMP_DIR, 'startup.js');
	const TI_MAIN_PATH = path.join(ROOT_DIR, 'common', 'Resources', 'ti.main.js');
	const TI_MAIN_PLATFORM_PATH = path.join(TMP_DIR, 'common', 'android', 'ti.main.js');
	const args = [
		'--startup_blob=' + BLOB_PATH,
		STARTUP_PATH,
		'--print-all-exceptions'
	];

	// Snapshot already exists, skip...
	if (await fs.exists(BLOB_PATH)) {
		const { blobStat, commonStat } = await Promise.all([ fs.stat(BLOB_PATH), fs.stat(TI_MAIN_PATH) ]);
		if (commonStat && blobStat && commonStat.mtime < blobStat.mtime) {
			return;
		}
	}

	// Load platform optimized 'common' bundle
	const commonBundle = await fs.readFile(TI_MAIN_PLATFORM_PATH);

	// Generate 'startup.js'
	const output = await promisify(ejs.renderFile)(path.join(__dirname, 'startup.ejs'), { script: commonBundle }, {});
	await fs.writeFile(STARTUP_PATH, output);

	// Set correct permissions for 'mksnapshot'
	await fs.chmod(MKSNAPSHOT_PATH, 0o755);

	console.warn(`Generating snapshot blob for ${target}...`);

	// Generate snapshot
	return promisify(exec)(MKSNAPSHOT_PATH, args).catch(e => console.warn(`Could not generate blob for ${target}: ${e.message}`));
}

/**
 * Generates V8Snapshots.h header from architecture blobs
 * @returns {Promise<void>}
 */
async function generateHeader() {
	const blobs = {};

	// Load snapshots for each architecture
	await Promise.all(TARGETS.map(async target => {
		const V8_LIB_TARGET_DIR = path.resolve(V8_LIB_DIR, target);
		const BLOB_PATH = path.join(V8_LIB_TARGET_DIR, 'blob.bin');

		if (await fs.exists(BLOB_PATH)) {
			blobs[target] = Buffer.from(await fs.readFile(BLOB_PATH, 'binary'), 'binary');
		}
	}));

	console.log(`Generating V8Snapshots.h for ${Object.keys(blobs).join(', ')}...`);

	// Generate 'V8Snapshots.h' from template
	const output = await promisify(ejs.renderFile)(path.join(__dirname, 'V8Snapshots.h.ejs'), { blobs }, {});
	return fs.writeFile(path.join(ANDROID_DIR, 'runtime', 'v8', 'src', 'native', 'V8Snapshots.h'), output);
}

/**
 * Generates empty snapshot blobs for each supported architecture
 * and creates a header to include the snapshots at build time.
 * NOTE: SNAPSHOT GENERATION IS ONLY SUPPORTED ON macOS
 * @returns {Promise<void>}
 */
async function build() {
	// Only macOS is supports creating snapshots
	if (os.platform() !== 'darwin') {
		console.warn('Snapshot generation is only supported on macOS, skipping...');
		return;
	}

	// Generate snapshots in parallel
	await Promise.all(TARGETS.map(target => generateBlob(target)));
	return generateHeader();
}

module.exports = { build };
