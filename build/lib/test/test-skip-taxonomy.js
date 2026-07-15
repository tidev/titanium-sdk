/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

import { expect } from 'chai';
import Module from 'module';
import filterModule from '../../../tests/Resources/utilities/mocha-filter.js';

// assertions.js requires several Titanium-runtime / native deps that are
// not installed in a plain Node test environment (should, browserify-zlib,
// pixelmatch, cgbi-to-png) and reads Titanium globals (Ti, OS_IOS, OS_ANDROID,
// global.binding). Stub them before importing assertions.js so the module
// can load. We only care about the filter-registration side effect.
global.Ti = global.Ti || { Platform: { osname: 'iphone', name: 'iPhone OS', model: 'iPhone15,2' } };
global.OS_IOS = global.OS_IOS || false;
global.OS_ANDROID = global.OS_ANDROID || false;
global.binding = global.binding || { register() {} };

// Override Module._load to intercept the missing native deps. This must
// happen BEFORE assertions.js is loaded, so we use a dynamic import() below
// rather than a hoisted static import.
const origLoad = Module._load;
Module._load = function (request, _parent, _isMain) {
	if (request === 'should') {
		return { Assertion: { add() {}, alias() {} }, fail() {} };
	}
	if (request === 'browserify-zlib') {
		return {};
	}
	if (request === 'pixelmatch') {
		return { default: () => 0 };
	}
	if (request === 'cgbi-to-png') {
		return { revert: (b) => b };
	}
	return origLoad.apply(this, arguments);
};

// Capture the underlying filter functions. mocha-filter's default export
// reassigns its internal `checks` closure variable to the passed object, so
// when assertions.js later calls addFilters(filters), each addFilter() call
// mutates our `myChecks` object. That lets us compare the UNDERLYING filter
// references (filters.iosBroken vs filters.iosMissing), not just the
// mocha-filter wrappers that global.it.<name> exposes (which are always
// distinct per-name wrappers regardless of whether the underlying filters
// are aliased).
const myChecks = {};
filterModule(myChecks); // sets mocha-filter's `checks` to myChecks

// Import assertions.js for its side effect: it builds the `filters` object
// and registers each filter via mocha-filter.addFilters(), which mutates
// `myChecks`. Must be dynamic so the Module._load override above is in place
// first (static imports are hoisted above the override).
await import('../../../tests/Resources/utilities/assertions.js');

// `it` is Mocha's `it`, decorated by setupMocha with each filter as
// `it.<filterName>`. We assert against both the wrappers (sanity: filters
// are registered) and the underlying myChecks references (the actual alias
// split the fix restores).
const it = global.it;

describe('skip taxonomy: *Broken vs *Missing are distinct', function () {
	it('iosBroken and iosMissing are distinct function references', () => {
		expect(it.iosBroken).to.be.a('function');
		expect(it.iosMissing).to.be.a('function');
		expect(myChecks.iosBroken).to.be.a('function');
		expect(myChecks.iosMissing).to.be.a('function');
		expect(myChecks.iosBroken).to.not.equal(myChecks.iosMissing);
	});

	it('androidBroken and androidMissing are distinct function references', () => {
		expect(it.androidBroken).to.be.a('function');
		expect(it.androidMissing).to.be.a('function');
		expect(myChecks.androidBroken).to.be.a('function');
		expect(myChecks.androidMissing).to.be.a('function');
		expect(myChecks.androidBroken).to.not.equal(myChecks.androidMissing);
	});

	it('macBroken and macMissing are distinct function references', () => {
		expect(it.macBroken).to.be.a('function');
		expect(it.macMissing).to.be.a('function');
		expect(myChecks.macBroken).to.be.a('function');
		expect(myChecks.macMissing).to.be.a('function');
		expect(myChecks.macBroken).to.not.equal(myChecks.macMissing);
	});

	it('windowsBroken and windowsMissing are distinct function references', () => {
		expect(it.windowsBroken).to.be.a('function');
		expect(it.windowsMissing).to.be.a('function');
		expect(myChecks.windowsBroken).to.be.a('function');
		expect(myChecks.windowsMissing).to.be.a('function');
		expect(myChecks.windowsBroken).to.not.equal(myChecks.windowsMissing);
	});

	it('androidAndWindowsMissing and androidAndWindowsBroken are distinct function references', () => {
		expect(it.androidAndWindowsMissing).to.be.a('function');
		expect(it.androidAndWindowsBroken).to.be.a('function');
		expect(myChecks.androidAndWindowsMissing).to.be.a('function');
		expect(myChecks.androidAndWindowsBroken).to.be.a('function');
		expect(myChecks.androidAndWindowsMissing).to.not.equal(myChecks.androidAndWindowsBroken);
	});

	it('androidBrokenAndIosMissing and androidMissingAndIosBroken are distinct function references', () => {
		// These two represent different labelings of the same underlying
		// condition (broken on Android, missing on iOS) vs (missing on
		// Android, broken on iOS). They should be distinct references so
		// the reporter can tell them apart.
		expect(it.androidBrokenAndIosMissing).to.be.a('function');
		expect(it.androidMissingAndIosBroken).to.be.a('function');
		expect(myChecks.androidBrokenAndIosMissing).to.be.a('function');
		expect(myChecks.androidMissingAndIosBroken).to.be.a('function');
		expect(myChecks.androidBrokenAndIosMissing).to.not.equal(myChecks.androidMissingAndIosBroken);
	});
});
