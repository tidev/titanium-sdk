/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { SKIP_IOS_SIM_CORELOCATION, skipIfIOSSim } from '../../../tests/Resources/utilities/skip-reasons.js';
import { expect } from 'chai';

// stub the Ti global that utilities.js reads. mocha-filter and skip-reasons
// both ultimately depend on utilities.isIOSSimulator().
global.Ti = global.Ti || { Platform: { osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2 (Simulator)' } };

describe('skip-reasons', function () {
	it('exports named reason constants', () => {
		expect(SKIP_IOS_SIM_CORELOCATION).to.be.a('string').that.is.not.empty;
	});

	it('skipIfIOSSim calls ctx.skip and returns true on iOS simulator', () => {
		let skipped = null;
		const ctx = { skip: (reason) => { skipped = reason; } };
		const result = skipIfIOSSim(ctx, SKIP_IOS_SIM_CORELOCATION);
		expect(result).to.equal(true);
		expect(skipped).to.equal(SKIP_IOS_SIM_CORELOCATION);
	});

	it('skipIfIOSSim returns false and does not call ctx.skip off-simulator', () => {
		// Temporarily force off-sim by stubbing the model
		const origModel = global.Ti.Platform.model;
		global.Ti.Platform.model = 'iPhone15,2';
		try {
			let called = false;
			const ctx = { skip: () => { called = true; } };
			const result = skipIfIOSSim(ctx, SKIP_IOS_SIM_CORELOCATION);
			expect(result).to.equal(false);
			expect(called).to.equal(false);
		} finally {
			global.Ti.Platform.model = origModel;
		}
	});
});
