/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { handleBuild } from './test.js';
import { expect } from 'chai';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

const DEVICE = 'Test Device';

/**
 * Formats a line the way the CLI logs device output.
 *
 * @param {String} message - The message the device logged
 * @returns {String}
 */
function deviceLine(message) {
	return `[INFO] :  [${DEVICE}] ${message}`;
}

/**
 * Builds a synthetic build log containing the markers `handleBuild()` parses.
 *
 * @param {Object} [opts] - Log options
 * @param {Number} [opts.passed] - Number of passing test results to emit
 * @param {Number} [opts.failed] - Number of failing test results to emit
 * @param {Boolean} [opts.stop] - Emit the suite stop marker
 * @param {String} [opts.trailer] - An extra line to append after the results
 * @returns {String}
 */
function buildLog({ passed = 0, failed = 0, stop = true, trailer } = {}) {
	const lines = [
		'[INFO] :  Ignored build output that precedes the app starting',
		'[INFO] :  -- Start application log ---',
		deviceLine('OS_VERSION: 14.0')
	];

	for (let i = 0; i < passed; i++) {
		lines.push(deviceLine(`!TEST_START: {"suite":"example","title":"passing ${i}"}`));
		lines.push(deviceLine(`!TEST_END: {"state":"passed","duration":1,"suite":"example","title":"passing ${i}"}`));
	}

	for (let i = 0; i < failed; i++) {
		lines.push(deviceLine(`!TEST_START: {"suite":"example","title":"failing ${i}"}`));
		lines.push(deviceLine(`!TEST_END: {"state":"failed","duration":2,"suite":"example","title":"failing ${i}","message":"boom"}`));
	}

	if (trailer) {
		lines.push(trailer);
	}
	if (stop) {
		lines.push(deviceLine('!TEST_RESULTS_STOP!'));
	}

	return `${lines.join('\n')}\n`;
}

/**
 * A child process stub that replays the given log on stdout.
 *
 * @param {String} log - The build log to replay
 * @returns {Object}
 */
function createProcess(log) {
	return {
		stdout: Readable.from([ log ]),
		stderr: { on: () => {} },
		on: () => {},
		kill: () => {}
	};
}

describe('test.handleBuild', function () {
	this.slow(750);

	let snapshotDir;

	beforeEach(() => {
		snapshotDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ti-test-snapshots-'));
	});

	afterEach(() => {
		fs.removeSync(snapshotDir);
	});

	/**
	 * Runs a log through `handleBuild()` with the replayed output silenced, since
	 * it pipes everything it reads straight to stdout.
	 *
	 * @param {String} log - The build log to replay
	 * @returns {Promise<Object>}
	 */
	async function runBuild(log) {
		const write = process.stdout.write;
		process.stdout.write = () => true;
		try {
			return await handleBuild(createProcess(log), 'emulator', snapshotDir, []);
		} finally {
			process.stdout.write = write;
		}
	}

	it('collects the test results reported by the device', async () => {
		const results = await runBuild(buildLog({ passed: 5, failed: 2 }));

		expect(results).to.be.an('object');
		expect(results.date).to.be.a('string'); // ISO date string
		expect(results.results).to.have.lengthOf(7);
		expect(results.results.filter(r => r.state === 'failed')).to.have.lengthOf(2);
		expect(results.results[0]).to.include({ state: 'passed', suite: 'example', title: 'passing 0' });
		expect(results.results.every(r => r.device === DEVICE)).to.equal(true);
	});

	it('resolves with no results when the suite reports none', async () => {
		const results = await runBuild(buildLog());

		expect(results.results).to.deep.equal([]);
	});

	it('records an incomplete test end as a failure', async () => {
		// a truncated !TEST_END payload that never parses as JSON
		const log = buildLog({
			passed: 1,
			trailer: deviceLine('!TEST_END: {"state":"passed","suite":"example",')
		});
		const results = await runBuild(log);

		expect(results.results).to.have.lengthOf(2);
		const incomplete = results.results[1];
		expect(incomplete.state).to.equal('failed');
		expect(incomplete.message).to.equal('build/lib/test.js failed to parse reported test result');
	});

	it('rejects when the app log ends before the suite finishes', async () => {
		const log = buildLog({ passed: 1, stop: false, trailer: '[INFO] :  -- End application log ----' });

		let err;
		try {
			await runBuild(log);
		} catch (e) {
			err = e;
		}

		expect(err).to.be.an('error');
		expect(err.message).to.equal('Failed to finish test suite before app crashed and logs ended!');
	});

	it('rejects when the app fails to install', async () => {
		const log = buildLog({ stop: false, trailer: deviceLine('Application failed to install') });

		let err;
		try {
			await runBuild(log);
		} catch (e) {
			err = e;
		}

		expect(err).to.be.an('error');
		expect(err.message).to.equal('Failed to install test app to device/sim');
	});
});
