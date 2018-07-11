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

describe('Ti.UI.TextField', function () {
	it.ios('.passwordRules', function () {
		var textField = Ti.UI.createTextField({
			passwordMask: true,
			passwordRules: 'required: upper; required: lower; required: digit; max-consecutive: 2'
		});
		should(textField.passwordRules).equal('required: upper; required: lower; required: digit; max-consecutive: 2');
	});
});

describe('Ti.UI', function () {
	it.ios('.AUTOFILL_TYPE_NEW_PASSWORD', function () {
		should(Ti.UI).have.a.constant('AUTOFILL_TYPE_NEW_PASSWORD').which.is.a.String;
	});

	it.ios('.AUTOFILL_TYPE_ONE_TIME_CODE', function () {
		should(Ti.UI).have.a.constant('AUTOFILL_TYPE_ONE_TIME_CODE').which.is.a.String;
	});
});
