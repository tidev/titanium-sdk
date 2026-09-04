/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

// Integration smoke test for retry-policy.applyRetryPolicy.
//
// The unit tests in test-retry-policy.js stub the Mocha context. This test
// exercises the production call site — a real Mocha top-level `beforeEach`
// that calls `applyRetryPolicy(this)` — to confirm the function reads
// `this.currentTest.file` (the test about to run) and not `this.test.file`
// (the hook itself, whose `.file` is undefined in Mocha 8's top-level
// beforeEach). This is the test that would have caught C1 originally.

import { applyRetryPolicy, RETRY_POLICY } from '../../../tests/Resources/utilities/retry-policy.js';
import { expect } from 'chai';

describe('retry-policy-smoke (real Mocha beforeEach)', function () {
	const smokeBasename = 'test-retry-policy-smoke.js';
	let called = null;

	before(() => {
		// Add this file's basename to the allowlist so applyRetryPolicy
		// has something to apply.
		RETRY_POLICY[smokeBasename] = 2;
	});

	after(() => {
		delete RETRY_POLICY[smokeBasename];
	});

	beforeEach(function () {
		// Spy on the real currentTest's retries method BEFORE invoking the
		// policy. If applyRetryPolicy reads the wrong field (this.test.file,
		// which is undefined for a top-level beforeEach), it will early-exit
		// and `called` stays null — failing the assertion below.
		const test = this.currentTest;
		called = null;
		if (test && test.file && test.file.endsWith(smokeBasename)) {
			const original = test.retries.bind(test);
			test.retries = (n) => {
				called = n;
				return original(n);
			};
		}
		// Production call site: top-level beforeEach passes `this`.
		applyRetryPolicy(this);
	});

	it('applyRetryPolicy sets retries via this.currentTest in a real Mocha beforeEach', function () {
		expect(called, 'expected applyRetryPolicy to call currentTest.retries(2)').to.equal(2);
	});
});
