/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

// Integration smoke test for mocha-filter's addFilter shadow guard.
//
// The unit tests in test-mocha-filter.js stub the module state. This test
// exercises the production path: app.js calls `filter.setupMocha()` /
// `filter.addFilters(...)`, then a test file calls `addFilter('ios', ...)`.
// With the C2 fix, addFilter adds each registered name to `reservedChecks`,
// so the second `addFilter('ios', ...)` must throw. Before the fix,
// `reservedChecks` only ever contained 'ignore' (the refresh path inside
// `module.exports(defaults)` was never called in production), so the
// collision was silently allowed.

import filter from '../../../tests/Resources/utilities/mocha-filter.js';
import { expect } from 'chai';

describe('mocha-filter-smoke (production addFilters path)', function () {
	afterEach(() => {
		// Reset module state so subsequent suites start clean.
		filter({ ignore: () => false });
	});

	it('addFilter throws when colliding with a filter registered via addFilters (production path)', () => {
		filter({ ignore: () => false });
		filter.addFilters({ ios: () => true });
		expect(() => filter.addFilter('ios', () => false)).to.throw(/reserved/);
	});

	it('addFilter throws when colliding with a user-defined filter registered via addFilter', () => {
		filter({ ignore: () => false });
		filter.addFilter('myCustom', () => true);
		expect(() => filter.addFilter('myCustom', () => false)).to.throw(/reserved/);
	});
});
