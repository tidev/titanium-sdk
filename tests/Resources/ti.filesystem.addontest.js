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

describe('Ti.Filesystem', function () {

	it('#getFile() should handle files with spaces in path - TIMOB-18765', function () {
		var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, '/folder with spaces/comingSoon.html');
		should(f.exists()).eql(true);
	});

	// FIXME: Should this work? It is a difference versus how some other file/url resolution works...
	it.allBroken('#getFile() should handle absolute-looking paths by resolving relative to resource dir', function () {
		var f = Ti.Filesystem.getFile('/Logo.png'); // use absolute-looking URL, but actually relative to resources dir!
		should(f.exists()).eql(true);
	});
});
