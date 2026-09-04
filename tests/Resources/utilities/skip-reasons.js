/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

const utilities = require('./utilities');

/**
 * Named skip reasons. Use these constants instead of inline strings so the
 * skipped-tests report stays consistent across files, and so retiring a
 * reason after the underlying issue is fixed is a single grep.
 */
const SKIP_IOS_SIM_CORELOCATION = 'iOS simulator: CoreLocation blocks indefinitely';
const SKIP_IOS_SIM_CLIPBOARD_SYNC = 'iOS simulator: clipboard sync hangs';
const SKIP_IOS_SIM_COMPASS = 'iOS simulator: heading service blocks indefinitely';

/**
 * Call `ctx.skip(reason)` and return true when running on the iOS simulator,
 * otherwise return false (no-op). Use this instead of inlining
 * `if (isIOSSimulator) { this.skip('...'); return; }` in every test.
 *
 * @param {Object} ctx the Mocha test context (i.e. `this` inside an `it`)
 * @param {string} reason one of the SKIP_* constants above
 * @returns {boolean} true if the skip was triggered
 */
function skipIfIOSSim(ctx, reason) {
	if (utilities.isIOSSimulator()) {
		ctx.skip(reason);
		return true;
	}
	return false;
}

module.exports = {
	SKIP_IOS_SIM_CORELOCATION,
	SKIP_IOS_SIM_CLIPBOARD_SYNC,
	SKIP_IOS_SIM_COMPASS,
	skipIfIOSSim
};
