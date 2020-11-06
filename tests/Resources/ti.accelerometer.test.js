/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Accelerometer', () => {
	it('namespace exists', () => {
		should.exist(Ti.Accelerometer);
	});

	it('.apiName', () => {
		should(Ti.Accelerometer).have.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.Accelerometer.apiName).eql('Ti.Accelerometer');
	});

	it('#addEventListener() is a function', () => {
		should(Ti.Accelerometer.addEventListener).be.a.Function();
	});

	it('#removeEventListener() is a function', () => {
		should(Ti.Accelerometer.removeEventListener).be.a.Function();
	});
});
