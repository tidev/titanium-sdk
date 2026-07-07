/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { RETRY_POLICY, applyRetryPolicy } from '../../../tests/Resources/utilities/retry-policy.js';
import { expect } from 'chai';

describe('retry-policy', function () {
	afterEach(() => {
		delete process.env.TI_TEST_RETRY_DISABLED;
	});

	it('RETRY_POLICY is an object mapping filename to retry count', () => {
		expect(RETRY_POLICY).to.be.an('object');
		for (const [file, count] of Object.entries(RETRY_POLICY)) {
			expect(file, file).to.be.a('string').that.is.not.empty;
			expect(count, file).to.be.a('number').that.is.greaterThan(0);
		}
	});

	it('applyRetryPolicy calls ctx.retries(count) when file is in policy', () => {
		const target = Object.keys(RETRY_POLICY)[0];
		const expected = RETRY_POLICY[target];
		let called = null;
		const ctx = {
			retries: (n) => { called = n; },
			test: { file: `/some/path/${target}` }
		};
		applyRetryPolicy(ctx);
		expect(called).to.equal(expected);
	});

	it('applyRetryPolicy does nothing when file is not in policy', () => {
		let called = null;
		const ctx = {
			retries: (n) => { called = n; },
			test: { file: '/some/path/ti.unknown.test.js' }
		};
		applyRetryPolicy(ctx);
		expect(called).to.be.null;
	});

	it('applyRetryPolicy is a no-op when TI_TEST_RETRY_DISABLED is set', () => {
		process.env.TI_TEST_RETRY_DISABLED = '1';
		const target = Object.keys(RETRY_POLICY)[0];
		let called = null;
		const ctx = {
			retries: (n) => { called = n; },
			test: { file: `/some/path/${target}` }
		};
		applyRetryPolicy(ctx);
		expect(called).to.be.null;
	});
});
