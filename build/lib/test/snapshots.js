/**
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import path from 'node:path';
import fs from 'fs-extra';
import child_process from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { APP_ID, TMP_DIR, PROJECT_DIR } from './runner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const exec = promisify(child_process.exec);

// The special magic strings we expect in the logs!
const GENERATED_IMAGE_PREFIX = '!IMAGE: ';
const DIFF_IMAGE_PREFIX = '!IMG_DIFF: ';

/**
 * Owns the image-grabbing/diffing logic that used to live on
 * DeviceTestDetails. Constructed with the same (name, target,
 * snapshotDir, snapshotPromises) shape so the method bodies moved
 * verbatim from DeviceTestDetails; the only change is the receiver.
 */
export class SnapshotManager {
	/**
	 *
	 * @param {string} name device/emulator name (as reported via log output. Defaults to empty string)
	 * @param {'emulator'|'device'|'simulator'} target --target passed to CLI/build
	 * @param {string} snapshotDir path to dir we should save generated snapshot images
	 * @param {Promise[]} snapshotPromises Array of Promises we gather/create for collecting/pulling snapshot images fromd evces/emulators
	 */
	constructor(name, target, snapshotDir, snapshotPromises) {
		this.name = name;
		this.target = target;
		this.snapshotDir = snapshotDir;
		this.snapshotPromises = snapshotPromises;
		this._deviceId = null;
	}

	/**
	 * Attempts to "grab" the actual image and place it in known location side-by-side with expected image
	 * @param {string} token line of output
	 * @returns {Promise<string>}
	 */
	async handleMismatchedImage(token) {
		const imageIndex = token.indexOf(DIFF_IMAGE_PREFIX);
		const trimmed = token.slice(imageIndex + DIFF_IMAGE_PREFIX.length).trim();
		const details = JSON.parse(trimmed);

		const suffixEx = /(_expected|_diff)\.png/g;
		const baseImagePath = details.path.replace(suffixEx, '');
		const baseImageRelativePath = details.relativePath.replace(suffixEx, '');
		const diffDir = path.join(this.snapshotDir, '..', 'diffs', details.platform);

		const actualOutputPath = path.join(diffDir, `${baseImageRelativePath}.png`);
		const expectedOutputPath = path.join(diffDir, `${baseImageRelativePath}_expected.png`);
		const diffOutputPath = path.join(diffDir, `${baseImageRelativePath}_diff.png`);

		await fs.ensureDir(diffDir);

		// Grab actual output image.
		await this.grabAppImage(details.platform, `${baseImagePath}.png`, actualOutputPath);

		// Grab expected output image.
		if (!details.blob) {
			// We're comparing against a snapshot in the suite, copy the original file from the suite over
			await fs.copy(path.join(PROJECT_DIR, 'Resources', details.platform, `${baseImageRelativePath}.png`), expectedOutputPath);
		} else {
			// ti.blob generates expected output image for comparison.
			await this.grabAppImage(details.platform, `${baseImagePath}_expected.png`, expectedOutputPath);
		}

		// Attempt to grab diff image.
		try {
			await this.grabAppImage(details.platform, `${baseImagePath}_diff.png`, diffOutputPath);
		} catch (err) {
			// Ignore, diff image may not exist.
		}

		return actualOutputPath;
	}

	/**
	 * Attempts to "grab" generated images
	 * @param {string} token line of output
	 * @returns {Promise<string>}
	 */
	async grabGeneratedImage(token) {
		const imageIndex = token.indexOf(GENERATED_IMAGE_PREFIX);
		const trimmed = token.slice(imageIndex + GENERATED_IMAGE_PREFIX.length).trim();
		const details = JSON.parse(trimmed);

		// grab image and place into test suite
		const dest = path.join(this.snapshotDir, details.platform, details.relativePath);
		const grabbed = await this.grabAppImage(details.platform, details.path, dest);

		// Now also place into location that we can archive on CI/Jenkins (and see exactly which images are "new" for this run)
		const generated = path.join(this.snapshotDir, '..', 'generated', details.platform, details.relativePath);
		console.log(`Copying generated image ${grabbed} to ${generated}`); // TODO: Symlink instead?
		const diffDir = path.dirname(generated);
		await fs.ensureDir(diffDir);
		await fs.copy(grabbed, generated);

		return grabbed;
	}

	/**
	 * Lazily try and match the reported name in the logs back to the underlying id/serial
	 * Then we can direct adb commands to this device specifically.
	 */
	async deviceId() {
		if (!this._deviceId) {
			try {
				const devices = await fs.readJSON(path.join(PROJECT_DIR, 'android-devices.json'));
				if (!devices) { // no devices listed, just use generic 'device'
					this._deviceId = 'device';
				} else if (devices.length === 1) {
					// only one "device", use it's id
					this._deviceId = devices[0].id;
				} else if (this.name) { // find device with matching name
					// android's cli uses model || manufacturer || id as log prefix, see android/cli/hooks/run.js
					const device = devices.find(d => (d.model || d.manufacturer || d.id) === this.name);
					if (device) {
						this._deviceId = device.id;
					}
				}
			} catch (err) {
				// squash
			}
			if (!this._deviceId) { // we assigned no value, fall back to default 'device'
				this._deviceId = 'device';
			}
		}
		return this._deviceId;
	}

	/**
	 * Copies an image from sim/device to local disk
	 * @param {string} platform 'android' || 'ios'
	 * @param {string} filepath remote filepath
	 * @param {string} dest where to save locally
	 * @returns {Promise<string>} file path where it was saved
	 */
	async grabAppImage(platform, filepath, dest) {
		if (filepath.startsWith('file://')) {
			filepath = filepath.slice(7);
		}
		console.log(`Copying generated image ${filepath} to ${dest}`);
		await fs.ensureDir(path.dirname(dest));
		if (platform === 'android') {
			// Pull the file via adb shell
			let adbPath = 'adb';
			const androidSdkPath = process.env.ANDROID_SDK;
			if (androidSdkPath) {
				const filePath = path.join(androidSdkPath, 'platform-tools', 'adb');
				if (await fs.pathExists(filePath)) {
					adbPath = filePath;
				}
			}
			if (this.target === 'device') {
				const id = await this.deviceId();
				let adbTargetArgs = `-s ${id}`;
				if (id === 'device') {
					// we don't know the real device id! Hope there's just one
					adbTargetArgs = '-d';
					// FIXME: Grab device listing and pick first one?!
				}
				await exec(`${adbPath} ${adbTargetArgs} shell "run-as ${APP_ID} cat '${filepath}'" > ${dest}`);
			} else {
				// await exec(`${adbPath} -e shell "run-as ${APP_ID} cat '${filepath}'" > ${dest}`);
				// Using cat as above on some emulators (especially older ones) mangles image files
				await exec(`${adbPath} -e pull ${filepath} ${dest}`);
			}
			return dest;
		}
		// Can't grab images from iOS device
		if (this.target === 'device') {
			// Need to strip the filepath to start with /Documents (basically need an absolute path that actually is relative to app folder)
			// i.e. filepath is: /var/mobile/Containers/Data/Application/1B331056-14FC-4948-B3D1-EFD376A894B1/Documents/snapshots/tableViewRowScaling_percent_540x960.png
			// strip to /Documents/snapshots/tableViewRowScaling_percent_540x960.png
			const index = filepath.indexOf('/Documents');
			filepath = filepath.slice(index);
			// copy to ../../../tmp, results in ../../../tmp/Documents/snapshots/tableViewRowScaling_percent_540x960.png
			await exec(`ios-deploy --download=${filepath} --bundle_id ${APP_ID} --to ${TMP_DIR}`);
			// copy ../../../tmp/Documents/snapshots/tableViewRowScaling_percent_540x960.png to dest
			const actualDest = path.join(TMP_DIR, filepath);
			await fs.copyFile(actualDest, dest);
			// delete ../../../tmp/Documents/snapshots/tableViewRowScaling_percent_540x960.png?
			// No need to wait for it to happen
			fs.unlink(actualDest);
			return dest;
		}
		// iOS sim: copy the expected image to destination
		await fs.copy(filepath, dest);
		return dest;
	}
}
