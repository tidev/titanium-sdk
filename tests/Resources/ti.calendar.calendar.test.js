/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe.windowsMissing('Titanium.Calendar', function () {
	it('apiName', function () {
		should(Ti.Calendar.apiName).be.eql('Ti.Calendar');
		should(Ti.Calendar).have.a.readOnlyProperty('apiName').which.is.a.String();
	});
});
