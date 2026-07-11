/**
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import path from 'node:path';
import fs from 'fs-extra';
import 'colors';
import ejs from 'ejs';
import StreamSplitter from 'stream-splitter';
import { spawn } from 'node:child_process';
import stripAnsi from 'strip-ansi';
import { SnapshotManager } from './snapshots.js';
import { REPORT_DIR, JUNIT_TEMPLATE, PROJECT_DIR, PROJECT_NAME } from './runner.js';

// The special magic strings we expect in the logs!
export const GENERATED_IMAGE_PREFIX = '!IMAGE: ';
export const DIFF_IMAGE_PREFIX = '!IMG_DIFF: ';
export const TEST_END_PREFIX = '!TEST_END: ';
export const TEST_START_PREFIX = '!TEST_START: ';
export const TEST_SUITE_STOP = '!TEST_RESULTS_STOP!';
export const OS_VERSION_PREFIX = 'OS_VERSION: ';

let showFailedOnly = false;

export function setShowFailedOnly(value) {
	showFailedOnly = value;
}

export class DeviceTestDetails {
	/**
	 *
	 * @param {string} name device/emulator name (as reported via log output. Defaults to empty string)
	 * @param {'emulator'|'device'|'simulator'} target --target passed to CLI/build
	 * @param {string} snapshotDir path to dir we should save generated snapshot images
	 * @param {Promise[]} snapshotPromises Array of Promises we gather/create for collecting/pulling snapshot images fromd evces/emulators
	 */
	constructor(name, target, snapshotDir, snapshotPromises) {
		this.name = name;
		this.results = [];
		// FIXME: These things don't feel right to pass in here.
		this.target = target;
		this.snapshotDir = snapshotDir;
		this.snapshotPromises = snapshotPromises;
		this.snapshots = new SnapshotManager(name, target, snapshotDir, snapshotPromises);
		// set to completed as true by default because for multi-device build we'll end up with default entry that just corresponds to
		// log output from CLI or not from a specific device. If the device specific test suites finish we want to ignore this one
		// We'll set to false as soon as we see a version or test start
		this.completed = true;
		this.resetTestState();
	}

	appendStderr(line) {
		this.stderr += line.trim() + '\n';
	}

	/**
	 * We saw test end before, but failed to parse as JSON because we got partial output, so continue
	 * trying until it's happy (and resets sawTestEnd to false)
	 * @param {string} token line out log output
	 * @returns {boolean}
	 */
	handleTestContinuation(token) {
		// Strip ANSI color codes robustly rather than by position. The old
		// implementation used substring() with magic offsets (8/24/3/13) that
		// assumed an exact ANSI prefix layout; any deviation corrupted the
		// JSON fragment.
		let cleaned = stripAnsi(token);

		// Strip leading whitespace.
		cleaned = cleaned.replace(/^\s+/, '');

		// Strip leading log level prefix like "[INFO] ", "[DEBUG] ", "[WARN] ", etc.
		cleaned = cleaned.replace(/^\[(?:INFO|DEBUG|WARN|ERROR|TRACE|LOG)\]\s?/, '');

		// Strip leading device name prefix like "[Pixel_6] " if present.
		if (this.name) {
			const namePrefix = `[${this.name}] `;
			if (cleaned.startsWith(namePrefix)) {
				cleaned = cleaned.substring(namePrefix.length);
			}
		}

		// Heuristic: if the cleaned content does not look like a JSON fragment,
		// treat it as interleaved log noise (e.g. ImeTracker, Choreographer,
		// ActivityTaskManager) and skip it without appending to partialTestEnd.
		// The test app splits long JSON at '","' boundaries, so real chunks
		// start with: " { [ } ] : , digit - or the literals true/false/null,
		// optionally preceded by whitespace.
		if (cleaned.length === 0) {
			return false;
		}
		if (!/^\s*["{[\]}:,]/.test(cleaned)
			&& !/^\s*-?\d/.test(cleaned)
			&& !/^\s*(?:true|false|null)\b/.test(cleaned)) {
			return false;
		}

		return this.tryParsingTestResult(this.partialTestEnd + cleaned);
	}

	/**
	 * Handle a new line of output for a given device/emulator
	 * @param {string} token line of output (raw)
	 * @returns {boolean} true if successfully finished the test suite (completed, may have test failures/errors)
	 */
	handleLine(token) {
		if (this.testEndIncomplete) {
			if (token.includes(TEST_START_PREFIX) || token.includes(TEST_SUITE_STOP)) {
				// Make up a failed test result
				this.recordIncompleteTestResult();
			} else {
				this.handleTestContinuation(token);
				return false;
			}
		}

		// check for test start
		if (token.includes(TEST_START_PREFIX)) {
			// new test, wipe the state
			this.resetTestState();
			return false;
		}

		// check for generated images
		if (token.includes(GENERATED_IMAGE_PREFIX)) {
			this.snapshotPromises.push(this.snapshots.grabGeneratedImage(token).catch(e => console.error(e.message)));
			return false;
		}

		// check for mismatched images
		if (token.includes(DIFF_IMAGE_PREFIX)) {
			this.snapshotPromises.push(this.snapshots.handleMismatchedImage(token).catch(e => console.error(e.message)));
			return false;
		}

		// obtain os version
		if (token.includes(OS_VERSION_PREFIX)) {
			this.version = token.slice(token.indexOf(OS_VERSION_PREFIX) + OS_VERSION_PREFIX.length).trim();
			this.completed = false; // it's a real device/emulator and not the entry for generic CLI output!
			return false;
		}

		// check for test end
		const testEndIndex = token.indexOf(TEST_END_PREFIX);
		if (testEndIndex !== -1) {
			this.tryParsingTestResult(token.slice(testEndIndex + TEST_END_PREFIX.length).trim());
			// if this fails, we retry at top of next call to handleLine()
			// success or failure, we're done with this line
			return false;
		}

		// check for suite end
		if (token.includes(TEST_SUITE_STOP)) {
			// device completed tests
			this.completed = true;
			return true;
		}

		// normal output (no test start/end, suite end/crash)
		// append output to our string for stdout
		this.output += token + '\n';
		return false;
	}

	recordIncompleteTestResult() {
		const result = {
			state: 'failed',
			duration: 0,
			suite: 'Unknown',
			title: `Unknown incomplete test ${Date.now()}`,
			message: 'build/lib/test.js failed to parse reported test result',
			stack: this.partialTestEnd, // where should we stick this?
			stdout: this.output,
			stderr: this.stderr,
			device: this.name.length ? this.name : undefined,
			os_version: this.version
		};
		this.results.push(result);
		this.testEndIncomplete = false;
		return true;
	}

	/**
	 * @param {string} resultJSON json string of test details
	 * @return {boolean} indicating if we were able to parse test result
	 */
	tryParsingTestResult(resultJSON) {
		//  grab out the JSON and add to our result set
		let parsed = this.tryParse(resultJSON);
		if (parsed === null) {
			// If the full string failed, attempt to extract the outermost
			// balanced JSON object. This handles cases where the first
			// !TEST_END: line has trailing noise (e.g. a stray log fragment
			// appended after the closing brace on the same logcat line).
			const extracted = extractBalancedJSON(resultJSON);
			if (extracted !== null) {
				parsed = this.tryParse(extracted);
			}
		}
		if (parsed !== null) {
			parsed.stdout = this.output; // record what we saw in output during the test
			parsed.stderr = this.stderr; // record what we saw in output during the test
			parsed.device = this.name.length ? this.name : undefined; // specify device if available
			parsed.os_version = this.version; // specify os version if available
			this.results.push(parsed);
			this.testEndIncomplete = false;
			return true;
		}
		// if we fail to parse as JSON, assume we got truncated output!
		this.partialTestEnd = resultJSON;
		this.testEndIncomplete = true;
		return false;
	}

	tryParse(resultJSON) {
		try {
			return JSON.parse(massageJSONString(resultJSON));
		} catch (err) {
			return null;
		}
	}

	resetTestState() {
		this.output = ''; // reset output
		this.stderr = ''; // reset stderr
		this.partialTestEnd = ''; // reset partial test output
		this.testEndIncomplete = false; // reset flag indicating we saw partial test output
	}
}

/**
 * Once a build has been spawned off this handles grabbing the test results from the output.
 * @param {child_process} prc  Handle of the running process from spawn
 * @param {string} target 'emulator' || 'simulator' || 'device'
 * @param {string} snapshotDir directory to place generated images
 * @param {Promise[]} snapshotPromises array to hold promises for grabbign generated images
 * @returns {Promise<object>}
 */
export async function handleBuild(prc, target, snapshotDir, snapshotPromises) {
	return new Promise((resolve, reject) => {
		const deviceMap = new Map();
		let started = false;

		const splitter = prc.stdout.pipe(StreamSplitter('\n'));
		// Set encoding on the splitter Stream, so tokens come back as a String.
		splitter.encoding = 'utf8';

		function getDeviceName(token) {
			// eslint-disable-next-line security/detect-child-process
			const matches = /^[\s\b]+\[([^\]]+)\]\s/g.exec(token.substring(token.indexOf(':') + 1));
			if (matches && matches.length === 2) {
				return matches[1];
			}
			return '';
		}
		// pipe along the output as we go, retaining ANSI colors
		splitter.on('data', data => process.stdout.write(data));
		// handle the newline split output
		splitter.on('token', function (token) {

			// Workaround to launch iOS application on device.
			if (token.includes('Please manually launch the application')) {
				console.log('Launching application using ios-deploy');
				const deploy = spawn('ios-deploy', [ '-L', '-b', path.join(PROJECT_DIR, `build/iphone/build/Products/Debug-iphoneos/${PROJECT_NAME}.app`) ]);
				deploy.stdout.on('data', data => process.stdout.write(data));
				deploy.stderr.on('data', data => process.stderr.write(data));
			}

			if (token.includes('Application failed to install')) {
				prc.kill(); // quit this build...
				return reject(new Error('Failed to install test app to device/sim'));
			}

			// Fail immediately if android emulator is forcing restart
			// TODO: Can we restart/retry test suite in this case?
			if (token.includes('Module config changed, forcing restart due')) {
				prc.kill(); // quit this build...
				return reject(new Error(`Failed to finish test suite before Android emulator killed app due to updated module: ${token}`));
			}

			// Handle when app crashes and we haven't finished tests yet!
			if (token.includes('-- End application log ----')
				|| token.includes('-- End simulator log ---')
				|| token.includes('-- End mac application log ---')) {
				prc.kill(); // quit this build...
				return reject(new Error('Failed to finish test suite before app crashed and logs ended!')); // failed too many times
			}

			// ignore the build output until the app actually starts
			if (!started) {
				if (token.includes('-- Start application log ---')
					|| token.includes('-- Start simulator log ---')
					|| token.includes('-- Start mac application log ---')) {
					started = true;
				}
				return;
			}

			// We should not be checking the line for a device name until after the app starts!
			// Otherwise we create an entry for '' (default) device which will never be completed
			const stripped = stripAnsi(token);
			const device = getDeviceName(stripped);
			if (!deviceMap.has(device)) {
				deviceMap.set(device, new DeviceTestDetails(device, target, snapshotDir, snapshotPromises));
			}
			const curTest = deviceMap.get(device);
			const done = curTest.handleLine(token);
			if (done) {
				let results = [];
				// check if all devices have completed tests
				for (const d of deviceMap.values()) {
					// not all devices have completed tests
					// continue without processing results
					if (!d.completed) {
						return;
					}
					results = results.concat(d.results);
				}

				prc.kill(); // ok, tests finished as expected, kill the process
				return resolve({ date: (new Date()).toISOString(), results });
			}
		});
		// Any errors that occur on a source stream will be emitted on the
		// splitter Stream, if the source stream is piped into the splitter
		// Stream, and if the source stream doesn't have any other error
		// handlers registered.
		splitter.on('error', reject);

		prc.stderr.on('data', data => {
			process.stderr.write(data); // pipe along the stderr as we go, retaining ANSI colors
			if (!started) {
				return;
			}
			const line = data.toString();
			const stripped = stripAnsi(line);
			if (stripped.includes('Application failed to install')) {
				prc.kill(); // quit this build...
				return reject(new Error('Failed to install test app to device/sim'));
			}
			// Handle iOS "soft" crash
			if (stripped.includes('Application received error: signal error code: 11')) {
				prc.kill(); // quit this build...
				return reject(new Error('Application received error: signal error code: 11'));
			}
			const device = getDeviceName(stripped);
			if (!deviceMap.has(device)) {
				deviceMap.set(device, new DeviceTestDetails(device, target, snapshotDir, snapshotPromises));
			}
			deviceMap.get(device).appendStderr(line);
		});

		prc.on('close', code => {
			if (code !== 0) {
				return reject(new Error(`Exited unexpectedly with exit code: ${code}`));
			}
		});
	});
}

/**
 * Escapes given test output string so it can be used by JSON.parse() method.
 * @param {string} testResults The test output to be escaped and parsed as JSON.
 * @returns {string} Returns a string that can be passed to JSON.parse() method.
 */
export function massageJSONString(testResults) {
	// preserve newlines, etc - use valid JSON
	return testResults.replace(/\\n/g, '\\n')
		.replace(/\\'/g, '\\\'')
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, '\\&')
		.replace(/\\r/g, '\\r')
		.replace(/\\t/g, '\\t')
		.replace(/\\b/g, '\\b')
		.replace(/\\f/g, '\\f')
		// remove non-printable and other non-valid JSON chars
		.replace(/[\u0000-\u0019]+/g, ''); // eslint-disable-line no-control-regex
}

/**
 * Attempts to extract the outermost balanced JSON object from a string that
 * may have trailing/leading noise (e.g. interleaved log fragments). Scans for
 * the first '{', tracks brace depth while respecting string literals and
 * backslash escapes, and returns the substring from that '{' through the
 * matching '}'. Returns null if no balanced object is found.
 * @param {string} input potentially JSON-with-noise string
 * @returns {string|null}
 */
export function extractBalancedJSON(input) {
	const start = input.indexOf('{');
	if (start < 0) {
		return null;
	}
	let depth = 0;
	let inString = false;
	let escaped = false;
	for (let i = start; i < input.length; i++) {
		const ch = input[i];
		if (inString) {
			if (escaped) {
				escaped = false;
			} else if (ch === '\\') {
				escaped = true;
			} else if (ch === '"') {
				inString = false;
			}
			continue;
		}
		if (ch === '"') {
			inString = true;
		} else if (ch === '{') {
			depth++;
		} else if (ch === '}') {
			depth--;
			if (depth === 0) {
				return input.slice(start, i + 1);
			}
		}
	}
	return null;
}

/**
 * Defensively normalizes a result's state from Mocha's 'pending' to 'skipped'.
 * The in-app runner (tests/Resources/app.js) already does this normalization
 * before emitting the !TEST_END: JSON, but the reporter re-applies it so a
 * future app.js regression (or a hand-built result from a different harness)
 * does not inflate the 'passed' count or hide skipped tests from the
 * skipped-tests summary.
 * @param {object} result one test result
 * @returns {object} the same result, with state normalized
 */
function normalizeState(result) {
	if (result && result.state === 'pending') {
		result.state = 'skipped';
	}
	return result;
}

/**
 * Removes duplicate entries from a results array. Two entries are considered
 * duplicates when they share the same suite, title, file, and state. The iOS
 * simulator log stream has been observed delivering each skipped test's
 * !TEST_END: line twice (passed/failed tests are not affected), which
 * inflates the skipped count and prints every skipped test twice in the
 * report. This dedup is a defensive fix at the reporter level so the counts
 * and JUnit output stay correct regardless of upstream duplication.
 * @param {object[]} results test results, possibly with duplicates
 * @returns {object[]} deduplicated results
 */
export function dedupeResults(results) {
	const seen = new Set();
	const deduped = [];
	let duplicates = 0;
	for (const item of results) {
		normalizeState(item);
		const key = `${item.suite}${item.title}${item.file || ''}${item.state}`;
		if (seen.has(key)) {
			duplicates++;
			continue;
		}
		seen.add(key);
		deduped.push(item);
	}
	if (duplicates > 0) {
		console.warn('dedupeResults: removed %d duplicate result entr%s (likely iOS log-stream duplication)'.yellow, duplicates, duplicates === 1 ? 'y' : 'ies');
	}
	return deduped;
}

/**
 * @param {string} platform 'ios' || 'android'
 * @param {string} [target] 'emulator' || 'simulator' || 'device'
 * @param {string} [customPrefix] A custom prefix to help differentiate junit results
 * @returns {string}
 */
export function generateJUnitPrefix(platform, target, customPrefix) {
	let prefix = platform;
	if (target) {
		prefix += '.' + target;
	}
	if (customPrefix) {
		prefix += '.' + customPrefix;
	}
	return prefix;
}

/**
 * Converts JSON results of unit tests into a JUnit test result XML formatted file.
 *
 * @param {Object} jsonResults JSON containing results of the unit test output
 * @param {String} prefix prefix for test names to identify them uniquely
 * @returns {Promise<void>}
 */
export async function outputJUnitXML(jsonResults, prefix) {
	// We need to go through the results and separate them out into suites!
	const suites = {};
	jsonResults.results.forEach(item => {
		const s = suites[item.suite] || { tests: [], suite: item.suite, duration: 0, passes: 0, failures: 0, start: '' }; // suite name to group by
		s.tests.unshift(item);
		s.duration += item.duration;
		if (item.state === 'failed') {
			s.failures += 1;
		} else if (item.state === 'passed') {
			s.passes += 1;
		}
		suites[item.suite] = s;
	});
	const keys = Object.keys(suites);
	const values = keys.map(v => suites[v]);
	const template = await fs.readFile(JUNIT_TEMPLATE, 'utf8');
	const r = ejs.render(template,  { suites: values, prefix: prefix });

	// Write the JUnit XML to a file
	const outFile = path.join(REPORT_DIR, `junit.${prefix}.xml`);
	console.log(`JUnit test report written to ${outFile}`);
	return fs.writeFile(outFile, r);
}

/**
 * @param {object[]} results test results
 */
export async function outputResults(results) {
	const suites = {};

	// start
	console.log();

	results.forEach(item => {
		normalizeState(item);
		const s = suites[item.suite] || { tests: [], suite: item.suite, duration: 0, passes: 0, failures: 0, start: '' }; // suite name to group by
		s.tests.unshift(item);
		s.duration += item.duration;
		if (item.state === 'failed') {
			s.failures += 1;
		} else if (item.state === 'passed') {
			s.passes += 1;
		}
		suites[item.suite] = s;
	});

	let indents = 0,
		n = 0,
		passes = 0,
		failures = 0,
		skipped = 0;
	const skippedTests = [];
	function indent() {
		return Array(indents).join('  ');
	}
	const keys = Object.keys(suites);
	keys.forEach(v => {
		++indents;
		console.log('%s%s', indent(), v);
		// now loop through the tests
		suites[v].tests.forEach(test => {
			if (test.state === 'skipped') {
				skipped++;
				skippedTests.push({ suite: v, title: test.title, reason: test.skipReason, file: test.file });
				console.log(indent() + '  - %s'.cyan, test.title);
			} else if (test.state === 'failed') {
				failures++;
				console.log(indent() + '  %d) %s'.red, ++n, test.title);
				++indents;
				console.log(indent() + '  %s'.red, JSON.stringify(test));
				--indents;
			} else {
				passes++;
				if (!showFailedOnly) {
					console.log(indent() + '  ✓'.green + ' %s '.gray, test.title);
				}
			}
		});
		--indents;
		if (indents === 1) {
			console.log();
		}
	});

	// Spit out overall stats: test count, failure count, pending count, pass count.
	const total = skipped + failures + passes;
	console.log('%d Total Tests: %d passed, %d failed, %d skipped.', total, passes, failures, skipped);

	// List skipped tests at the end so they're easy to find without scrolling
	// through the per-suite output above. Include the skip reason (filter name
	// or 'runtime this.skip()' or 'explicit it.skip') and the source test file.
	if (skippedTests.length > 0) {
		console.log();
		console.log('Skipped tests (%d):'.cyan, skippedTests.length);
		skippedTests.forEach(t => {
			const reason = t.reason ? ` [${t.reason}]` : '';
			const file = t.file ? ` (${t.file})` : '';
			console.log('  - %s > %s%s%s'.cyan, t.suite, t.title, reason, file);
		});
	}
}
