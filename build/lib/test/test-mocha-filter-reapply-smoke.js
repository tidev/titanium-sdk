/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

// S-007 smoke test: Mocha's BDD interface reassigns global.it on each
// 'pre-require' emit (see mocha/lib/interfaces/bdd.js), discarding the
// .ios/.android/... filter extensions attached to the previous global.it.
// tests/Resources/app.js re-applies filter.setupMocha() after each emit
// to keep the extensions alive across sequential test files. This smoke
// test reproduces the bug condition in Node: emit 'pre-require' twice,
// call filter.setupMocha() after each emit, and assert it.ios is callable
// after the second emit. Without the re-apply, it.ios would be undefined
// after the second emit and the assertion would throw.

import Mocha from 'mocha';
import { expect } from 'chai';
import filter from '../../../tests/Resources/utilities/mocha-filter.js';

describe('mocha-filter re-apply across pre-require emits (S-007)', function () {
	let mocha;
	let origGlobalIt;

	beforeEach(() => {
		mocha = new Mocha();
		// Save and restore global.it so this test does not poison other suites.
		origGlobalIt = global.it;
	});

	afterEach(() => {
		global.it = origGlobalIt;
	});

	it('it.ios is callable after the second pre-require emit when setupMocha is re-applied', () => {
		// First "test file": emit pre-require, then re-apply the filter extensions.
		mocha.suite.emit('pre-require', global, 'file1.test', mocha);
		filter.setupMocha();
		expect(global.it.ios).to.be.a('function', 'it.ios must be callable after the first pre-require + setupMocha');

		// Second "test file": emit pre-require again (this reassigns global.it,
		// discarding the .ios extension attached above), then re-apply setupMocha.
		mocha.suite.emit('pre-require', global, 'file2.test', mocha);
		filter.setupMocha();
		expect(global.it.ios).to.be.a('function', 'it.ios must be callable after the second pre-require + setupMocha');
	});

	it('it.ios is undefined after a pre-require emit WITHOUT re-applying setupMocha (the bug condition)', () => {
		// First file: emit + re-apply → it.ios is callable.
		mocha.suite.emit('pre-require', global, 'file1.test', mocha);
		filter.setupMocha();
		expect(global.it.ios).to.be.a('function');

		// Second file: emit WITHOUT re-applying setupMocha → it.ios is undefined
		// (this is the bug condition the app.js workaround prevents).
		mocha.suite.emit('pre-require', global, 'file2.test', mocha);
		expect(global.it.ios).to.equal(undefined, 'without re-apply, it.ios is discarded by the second pre-require emit');
	});
});
