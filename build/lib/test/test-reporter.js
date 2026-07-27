/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import util from 'node:util';
import {
	dedupeResults,
	extractBalancedJSON,
	massageJSONString,
	generateJUnitPrefix,
	outputJUnitXML,
	outputResults,
	DeviceTestDetails,
	TEST_END_PREFIX,
	TEST_START_PREFIX,
	TEST_SUITE_STOP,
	OS_VERSION_PREFIX
} from '../../../build/lib/test/reporter.js';

describe('reporter helpers', function () {
	describe('extractBalancedJSON', () => {
		it('returns the outermost balanced object', () => {
			const input = 'noise {"a":1,"b":{"c":2}} trailing';
			expect(JSON.parse(extractBalancedJSON(input))).to.deep.equal({ a: 1, b: { c: 2 } });
		});
		it('returns null when there is no opening brace', () => {
			expect(extractBalancedJSON('no json here')).to.equal(null);
		});
		it('returns null when braces are unbalanced', () => {
			expect(extractBalancedJSON('{"a":1')).to.equal(null);
		});
		it('respects string literals containing braces', () => {
			const input = '{"a":"{ not a brace }"}';
			expect(JSON.parse(extractBalancedJSON(input))).to.deep.equal({ a: '{ not a brace }' });
		});
		it('respects backslash escapes inside strings', () => {
			const input = '{"a":"\\"}","b":2}';
			expect(JSON.parse(extractBalancedJSON(input))).to.deep.equal({ a: '"}', b: 2 });
		});
	});

	describe('massageJSONString', () => {
		it('preserves escape sequences', () => {
			const input = '{"a":"\\n\\t\\r"}';
			expect(JSON.parse(massageJSONString(input))).to.deep.equal({ a: '\n\t\r' });
		});
		it('strips non-printable control chars', () => {
			const input = '{"a":"xy"}';
			expect(massageJSONString(input)).to.not.contain('');
		});
	});

	describe('dedupeResults', () => {
		it('removes duplicates sharing suite/title/file/state', () => {
			const results = [
				{ suite: 'A', title: 't1', file: 'f.test.js', state: 'passed', duration: 1 },
				{ suite: 'A', title: 't1', file: 'f.test.js', state: 'passed', duration: 1 },
				{ suite: 'A', title: 't2', file: 'f.test.js', state: 'failed', duration: 1 }
			];
			const deduped = dedupeResults(results);
			expect(deduped).to.have.length(2);
			expect(deduped[0].title).to.equal('t1');
			expect(deduped[1].title).to.equal('t2');
		});
		it('keeps entries that differ in state (passed vs failed)', () => {
			const results = [
				{ suite: 'A', title: 't1', file: 'f.test.js', state: 'passed' },
				{ suite: 'A', title: 't1', file: 'f.test.js', state: 'failed' }
			];
			expect(dedupeResults(results)).to.have.length(2);
		});
		it('normalizes pending state to skipped before deduping', () => {
			const results = [
				{ suite: 'A', title: 't1', file: 'f.test.js', state: 'pending' },
				{ suite: 'A', title: 't1', file: 'f.test.js', state: 'skipped' }
			];
			const deduped = dedupeResults(results);
			expect(deduped).to.have.length(1);
			expect(deduped[0].state).to.equal('skipped');
		});
	});

	describe('generateJUnitPrefix', () => {
		it('builds platform.target.customPrefix', () => {
			expect(generateJUnitPrefix('ios', 'simulator', 'ipad')).to.equal('ios.simulator.ipad');
		});
		it('omits target when undefined', () => {
			expect(generateJUnitPrefix('android', undefined, undefined)).to.equal('android');
		});
		it('omits customPrefix when undefined', () => {
			expect(generateJUnitPrefix('android', 'emulator', undefined)).to.equal('android.emulator');
		});
	});

	describe('outputJUnitXML', () => {
		it('writes a JUnit XML file with the prefix in the filename', async function () {
			this.timeout(5000);
			const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'titanium-reporter-'));
			const jsonResults = {
				results: [
					{ suite: 'S1', title: 't1', state: 'passed', duration: 5, file: 'f.test.js' },
					{ suite: 'S1', title: 't2', state: 'failed', duration: 3, file: 'f.test.js' },
					{ suite: 'S2', title: 't3', state: 'skipped', duration: 0, file: 'g.test.js', skipReason: 'SKIP_IOS_SIM_CORELOCATION' }
				]
			};
			const prefix = 'test-reporter-spec';
			const outFile = path.join(tmpDir, `junit.${prefix}.xml`);
			await outputJUnitXML(jsonResults, prefix, tmpDir);
			expect(await fs.pathExists(outFile)).to.equal(true);
			const xml = await fs.readFile(outFile, 'utf8');
			expect(xml).to.contain('S1');
			expect(xml).to.contain('S2');
			expect(xml).to.contain('t1');
			expect(xml).to.contain('t2');
			expect(xml).to.contain('t3');
			await fs.remove(tmpDir);
		});
	});

	describe('DeviceTestDetails parsing', () => {
		it('parses a complete !TEST_END: line', () => {
			const d = new DeviceTestDetails('', 'simulator', '/tmp/snaps', []);
			const payload = JSON.stringify({ state: 'passed', duration: 5, suite: 'S', title: 't1' });
			const done = d.handleLine(`${TEST_END_PREFIX}${payload}`);
			expect(done).to.equal(false);
			expect(d.results).to.have.length(1);
			expect(d.results[0].state).to.equal('passed');
			expect(d.results[0].title).to.equal('t1');
		});
		it('parses a multi-line partial !TEST_END: across two lines', () => {
			const d = new DeviceTestDetails('', 'simulator', '/tmp/snaps', []);
			const payload = JSON.stringify({ state: 'passed', duration: 5, suite: 'S', title: 't1' });
			const mid = Math.floor(payload.length / 2);
			d.handleLine(`${TEST_END_PREFIX}${payload.slice(0, mid)}`);
			// First half did not parse; partialTestEnd should be set, testEndIncomplete true.
			expect(d.testEndIncomplete).to.equal(true);
			d.handleLine(payload.slice(mid));
			expect(d.testEndIncomplete).to.equal(false);
			expect(d.results).to.have.length(1);
			expect(d.results[0].title).to.equal('t1');
		});
		it('records OS_VERSION and marks the device as not-completed-default', () => {
			const d = new DeviceTestDetails('', 'simulator', '/tmp/snaps', []);
			expect(d.completed).to.equal(true);
			d.handleLine(`${OS_VERSION_PREFIX}17.0`);
			expect(d.version).to.equal('17.0');
			expect(d.completed).to.equal(false);
		});
		it('marks completed=true and returns done on !TEST_RESULTS_STOP!', () => {
			const d = new DeviceTestDetails('', 'simulator', '/tmp/snaps', []);
			const done = d.handleLine(TEST_SUITE_STOP);
			expect(done).to.equal(true);
			expect(d.completed).to.equal(true);
		});
		it('records an incomplete-test result when a !TEST_START: arrives mid-partial-parse', () => {
			const d = new DeviceTestDetails('', 'simulator', '/tmp/snaps', []);
			const payload = JSON.stringify({ state: 'passed', duration: 5, suite: 'S', title: 't1' });
			d.handleLine(`${TEST_END_PREFIX}${payload.slice(0, 10)}`);
			expect(d.testEndIncomplete).to.equal(true);
			d.handleLine(`${TEST_START_PREFIX}t2`);
			expect(d.results).to.have.length(1);
			expect(d.results[0].state).to.equal('failed');
			expect(d.results[0].title).to.match(/Unknown incomplete test/);
		});
	});

	describe('outputResults skip-reason propagation', () => {
		let logs;
		let origLog;
		beforeEach(() => {
			logs = [];
			origLog = console.log;
			console.log = (...args) => logs.push(util.format(...args));
		});
		afterEach(() => {
			console.log = origLog;
		});
		it('includes the skip reason and source file in the skipped-tests summary', () => {
			const results = [
				{ suite: 'Geolocation', title: 'getCurrentPosition', state: 'skipped', duration: 0, skipReason: 'SKIP_IOS_SIM_CORELOCATION', file: 'ti.geolocation.test.js' },
				{ suite: 'Map', title: 'isGooglePlayServicesAvailable', state: 'passed', duration: 1 }
			];
			outputResults(results);
			const joined = logs.join('\n');
			expect(joined).to.contain('Skipped tests (1)');
			expect(joined).to.contain('Geolocation > getCurrentPosition');
			expect(joined).to.contain('[SKIP_IOS_SIM_CORELOCATION]');
			expect(joined).to.contain('(ti.geolocation.test.js)');
		});
		it('normalizes pending state to skipped in the count', () => {
			const results = [
				{ suite: 'S', title: 't1', state: 'pending', duration: 0, skipReason: 'runtime this.skip()', file: 'f.test.js' }
			];
			outputResults(results);
			const joined = logs.join('\n');
			expect(joined).to.contain('1 skipped');
			expect(joined).to.contain('[runtime this.skip()]');
		});
	});
});
