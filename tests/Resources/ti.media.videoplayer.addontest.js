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

describe('Titanium.Media.VideoPlayer', function () {
	it.ios('playbackState', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('playbackState').which.is.a.Number;
	});
});
