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

describe.windowsDesktopBroken('Titanium.XML', function () {
	it.ios('parseString (invalid xml)', function () {
		should(Ti.XML.parseString).be.a.Function;
		should(function () {
			var xml = Ti.XML.parseString('invalid XML');
		}).throw();
	});
});
