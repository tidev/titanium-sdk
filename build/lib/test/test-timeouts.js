/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
// Default import: timeouts.js is CommonJS (consumed by the Titanium test
// runtime via require()), so `import * as` would surface the CJS-interop
// `default`/`module.exports` keys in the namespace and break the
// "every constant is a positive integer" loop below. The default export
// is the module.exports object holding the seven named constants.
import timeouts from '../../../tests/Resources/utilities/timeouts.js';

describe('timeouts vocabulary (S-008)', function () {
	it('exports the original three constants with their existing values', () => {
		expect(timeouts.DEFAULT).to.equal(10000);
		expect(timeouts.LONG).to.equal(30000);
		expect(timeouts.NETWORK).to.equal(60000);
	});
	it('exports UI_ANIMATION for animation-driven tests', () => {
		expect(timeouts.UI_ANIMATION).to.be.a('number');
		expect(timeouts.UI_ANIMATION).to.equal(20000);
	});
	it('exports PERMISSION_PROMPT for tests that trigger OS permission dialogs', () => {
		expect(timeouts.PERMISSION_PROMPT).to.be.a('number');
		expect(timeouts.PERMISSION_PROMPT).to.equal(30000);
	});
	it('exports SNAPSHOT for image-snapshot capture + comparison', () => {
		expect(timeouts.SNAPSHOT).to.be.a('number');
		expect(timeouts.SNAPSHOT).to.equal(30000);
	});
	it('exports DEVICE_OPERATION for slow device-only flows (boot, install, first-launch)', () => {
		expect(timeouts.DEVICE_OPERATION).to.be.a('number');
		expect(timeouts.DEVICE_OPERATION).to.equal(120000);
	});
	it('every constant is a positive integer (milliseconds)', () => {
		for (const [ name, value ] of Object.entries(timeouts)) {
			expect(value, name).to.be.a('number');
			expect(Number.isInteger(value), `${name} is an integer`).to.equal(true);
			expect(value, name).to.be.greaterThan(0);
		}
	});
});
