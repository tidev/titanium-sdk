'use strict';
/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions');

//
// Unit test for Titanium events and some other global functions
//
describe('Global', function () {
	// make sure we have console.time
	it('console.time', function () {
		should(console.time).be.a.Function;
	});
	// make sure we have console.timeEnd
	it('console.timeEnd', function () {
		should(console.timeEnd).be.a.Function;
	});
});

