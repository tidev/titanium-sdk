'use strict';

const fs = require('fs-extra');
const path = require('path');
const request = require('request-promise-native');

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TMP_DIR = path.join(DIST_DIR, 'tmp');
const ANDROID_DIR = path.join(ROOT_DIR, 'android');
const ANDROID_PROPS = require(path.join(ANDROID_DIR, 'package.json')); // eslint-disable-line security/detect-non-literal-require
const V8_PROPS = ANDROID_PROPS.v8;

/**
 * Generates empty snapshot blobs for each supported architecture
 * and creates a header to include the snapshots at build time.
 * @returns {Promise<void>}
 */
async function build() {
	const v8 = V8_PROPS.version;
	const script = (await fs.readFile(path.join(TMP_DIR, 'common', 'android', 'ti.main.js'))).toString();

	return new Promise(async resolve => { // eslint-disable-line no-async-promise-executor

		console.log('Attempting to request snapshot...');

		// Obtain snapshot `id` and start new snapshot generation.
		const id = await request.post('http://52.10.192.87', { body: { v8, script }, json: true });

		async function getSnapshot() {

			// Request generated snapshot.
			const header = await request.get(`http://52.10.192.87/snapshot/${id}`, {
				simple: false,
				resolveWithFullResponse: true
			});

			if (header.statusCode === 200) {
				console.log('Writing snapshot...');

				// Overwrite stub snapshot header.
				await fs.writeFile(path.join(ANDROID_DIR, 'runtime', 'v8', 'src', 'native', 'V8Snapshots.h'), header.body);

				// Done. Resolve `build` promise.
				resolve();

			} else if (header.statusCode === 418) {
				console.log('Waiting for snapshot generation...');

				// Snapshot server is still building, wait for next interval.
				return false;

			} else {
				console.error('Could not generate snapshot, skipping...');
			}

			// Prevent retry interval.
			return true;
		}

		// Attempt to grab generated snapshot.
		if (!await getSnapshot()) {

			// Retry until snapshot generation finishes.
			const interval = setInterval(async () => {
				if (await getSnapshot()) {
					clearInterval(interval);
				}
			}, 5000);
		}
	});
}

module.exports = { build };
