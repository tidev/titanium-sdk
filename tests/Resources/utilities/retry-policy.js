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
 * `beforeEach` in app.js. Reads `ctx.test.file` to identify the source file.
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
	const file = ctx && ctx.test && ctx.test.file;
	if (!file) {
		return;
	}
	const basename = file.split('/').pop();
	const retries = RETRY_POLICY[basename];
	if (retries) {
		ctx.retries(retries);
	}
}

module.exports = { RETRY_POLICY, applyRetryPolicy };
