/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

/**
 * Allowlist of test files that opt into Mocha's retry mechanism for
 * transient failures (network blips, simulator startup hiccups, animation
 * races). Add a file here ONLY when it has demonstrated flakiness — blanket-
 * enabling retries masks real bugs.
 *
 * Key: the basename of the test file (e.g. 'ti.network.httpclient.test.js').
 * Value: the retry count (Mocha retries the test that many times before
 * marking the suite red).
 */
const RETRY_POLICY = {
	'ti.network.httpclient.test.js': 2,
	'ti.network.socket.tcp.test.js': 2,
	'ti.ui.webview.test.js': 2
};

/**
 * Apply the retry policy to a Mocha test context. Call from a global
 * `beforeEach` in app.js. Reads `ctx.currentTest.file` to identify the
 * source file. In Mocha 8.4.0+, a top-level `beforeEach` runs with
 * `this.test` set to the hook itself (whose `.file` is undefined because
 * the root suite has no `.file`), and `this.currentTest` set to the test
 * about to run (whose `.file` is the actual source file path).
 *
 * Set `TI_TEST_RETRY_DISABLED=1` in the environment to disable retries
 * globally (useful when investigating a real failure you don't want
 * masked).
 *
 * @param {Object} ctx the Mocha test context (`this` inside `beforeEach`)
 */
function applyRetryPolicy(ctx) {
	if (process.env.TI_TEST_RETRY_DISABLED === '1') {
		return;
	}
	const test = ctx && ctx.currentTest;
	if (!test || !test.file) {
		return;
	}
	const basename = test.file.split('/').pop();
	const retries = RETRY_POLICY[basename];
	if (retries) {
		test.retries(retries);
	}
}

module.exports = { RETRY_POLICY, applyRetryPolicy };
