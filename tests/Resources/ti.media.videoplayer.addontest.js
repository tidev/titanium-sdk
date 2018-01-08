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
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.Media.VideoPlayer', function () {
	it.windowsMissing('VIDEO_PLAYBACK_* constants', function () {
		should(Ti.Media.VIDEO_PLAYBACK_STATE_STOPPED).eql(0);
		should(Ti.Media.VIDEO_PLAYBACK_STATE_PLAYING).eql(1);
		should(Ti.Media.VIDEO_PLAYBACK_STATE_PAUSED).eql(2);
		should(Ti.Media.VIDEO_PLAYBACK_STATE_INTERRUPTED).eql(3);
		
		if (utilities.isAndroid()) {
			should(Ti.Media.VIDEO_PLAYBACK_STATE_SEEKING_FORWARD).eql(4);
			should(Ti.Media.VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD).eql(5);
		}
	});
});
