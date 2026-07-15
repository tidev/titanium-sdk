/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import filterModule from '../../../tests/Resources/utilities/mocha-filter.js';
import { expect } from 'chai';

// mocha-filter uses module.exports = function (defaults) { ... } with
// setupMocha / addFilter / addFilters hung off it as properties. Load it
// and call setupMocha manually so we control what is registered.
const filter = filterModule;

describe('mocha-filter.addFilter shadow guard', function () {
	beforeEach(() => {
		// Reset to known state: register only the ignore filter and the
		// platform filters a typical test file would have on iOS.
		filter({ ignore: () => false });
	});

	afterEach(() => {
		// Some tests register extra filters (e.g. `ios` via addFilters); reset
		// the module state so the next test starts from a clean baseline.
		filter({ ignore: () => false });
	});

	it('listReservedFilters includes ignore', () => {
		expect(filter.listReservedFilters()).to.include('ignore');
	});

	it('throws when addFilter collides with a registered default', () => {
		expect(() => filter.addFilter('ignore', () => true)).to.throw(/reserved/);
	});

	it('does not throw when addFilter uses a new name', () => {
		expect(() => filter.addFilter('myCustomFilter', () => true)).to.not.throw();
	});

	it('throws when addFilter collides with a filter registered via addFilters', () => {
		filter.addFilters({ ios: () => true });
		expect(() => filter.addFilter('ios', () => false)).to.throw(/reserved/);
	});
});
