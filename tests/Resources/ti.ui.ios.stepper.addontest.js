/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.ios('Titanium.UI.iOS', function () {
	it('#createStepper()', function () {
		var stepper;
		should(Ti.UI.iOS.createStepper).not.be.undefined;
		should(Ti.UI.iOS.createStepper).be.a.Function;
		stepper = Ti.UI.iOS.createStepper({
			steps: 3,
			maximum: 30,
			minimum: 0,
			value: 20
		});
		should(stepper.value).be.eql(20);
		stepper.setValue(30);
		should(stepper.value).be.eql(30);
	});
});
