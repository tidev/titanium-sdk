/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.Platform', function () {

	it.ios('#openURL(url, callback)', function (finish) {
		Ti.Platform.openURL('randomapp://', e => finish());
	});

	it.ios('#openURL(url, options, callback)', function (finish) {
		Ti.Platform.openURL('randomapp://', {}, e => finish());
	});

});
