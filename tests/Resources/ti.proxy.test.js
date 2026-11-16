/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium, mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Proxy', () => {
	describe('#hasOwnProperty()', () => {
		it('should report false for non-existent ownProperty', () => {
			const label = Ti.UI.createLabel({
				text: 'Hello World!'
			});
			should(label).not.have.ownProperty('madeup');
		});

		it('should report true for ownProperty set in create* function', () => {
			const label = Ti.UI.createLabel({
				text: 'Hello World!'
			});
			should(label).have.ownProperty('text');
		});

		it('should report true for custom property set after construction', () => {
			const label = Ti.UI.createLabel({
				text: 'Hello World!'
			});
			should(label).not.have.ownProperty('madeup');
			label.madeup = 123;
			should(label).have.ownProperty('madeup');
		});
	});

	describe('#getOwnPropertyDescriptor()', () => {
		it('should return undefined for non-existent property', () => {
			const label = Ti.UI.createLabel({
				text: 'Hello World!'
			});
			const desc = Object.getOwnPropertyDescriptor(label, 'madeup');
			should(desc).not.be.ok(); // FIXME: We get null on iOS, according to spec we should get undefined!
		});

		it('should report descriptor for ownProperty set in create* function', () => {
			const label = Ti.UI.createLabel({
				text: 'Hello World!'
			});
			const desc = Object.getOwnPropertyDescriptor(label, 'text');
			// iOS gives: {"value":"Hello World!","writable":false,"enumerable":false,"configurable":true}
			desc.value.should.eql('Hello World!');
		});

		it('should report descriptor for custom property set after construction', () => {
			const label = Ti.UI.createLabel({
				text: 'Hello World!'
			});
			label.madeup = 123;
			const desc = Object.getOwnPropertyDescriptor(label, 'madeup');
			desc.value.should.eql(123);
			// iOS gives: {"value":123,"writable":false,"enumerable":false,"configurable":true}
			// What do we expect in terms of those properties?
		});
	});
});
