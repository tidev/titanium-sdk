/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.ios('Titanium.UI.iOS', () => {
	it('#createStepper() is a Function', () => {
		should(Ti.UI.iOS.createStepper).not.be.undefined();
		should(Ti.UI.iOS.createStepper).be.a.Function();
	});
});

describe.ios('Titanium.UI.iOS.Stepper', () => {
	it('.apiName', () => {
		const stepper = Ti.UI.iOS.createStepper({
			steps: 3,
			maximum: 30,
			minimum: 0,
			value: 20
		});
		should(stepper).have.readOnlyProperty('apiName').which.is.a.String();
		should(stepper.apiName).be.eql('Ti.UI.iOS.Stepper');
	});

	describe('.value', () => {
		it('is a Number', () => {
			const stepper = Ti.UI.iOS.createStepper({
				steps: 3,
				maximum: 30,
				minimum: 0,
				value: 20
			});
			should(stepper.value).be.eql(20);
			stepper.value = 30;
			should(stepper.value).be.eql(30);
		});

		it('has no accessors', () => {
			const stepper = Ti.UI.iOS.createStepper({
				steps: 3,
				maximum: 30,
				minimum: 0,
				value: 20
			});
			should(stepper).not.have.accessors('value');
		});
	});
});
