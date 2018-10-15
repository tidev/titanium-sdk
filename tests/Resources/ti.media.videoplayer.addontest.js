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

	it.ios('playableDuration in milliseconds', function (finish) {
		var win = Ti.UI.createWindow();
		var videoPlayer = Ti.Media.createVideoPlayer({
			url: 'https://www.w3schools.com/html/mov_bbb.mp4',
			autoplay: true,
			showsControls: false,
			height: 200
		});

		this.timeout(10000);

		videoPlayer.addEventListener('durationavailable', function (e) {
			e.duration.should.be.above(1000);
			videoPlayer.duration.should.be.above(1000);
			videoPlayer.playableDuration.should.be.above(1000);
			finish();
		});

		win.add(videoPlayer);
		win.open();
	});
});
