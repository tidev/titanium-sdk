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

	it.ios('Release video player and close window (TIMOB-26033)', function (finish) {
		var win = Ti.UI.createWindow();
		var videoWindow = Ti.UI.createWindow();
		var videoPlayer = Ti.Media.createVideoPlayer({
			url: 'https://www.w3schools.com/html/mov_bbb.mp4',
			top: 2,
			autoplay: true,
			backgroundColor: 'blue',
			height: 300,
			width: 300,
			mediaControlStyle: Ti.Media.VIDEO_CONTROL_DEFAULT,
			scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FIT
		});

		this.timeout(10000);

		win.addEventListener('open', function () {
			setTimeout(function () {
				videoWindow.open();
			}, 2000);
		});

		videoWindow.addEventListener('open', function () {
			setTimeout(function () {
				videoPlayer.release();
				videoWindow.remove(videoPlayer);
				videoPlayer = null;
				videoWindow.close();
			}, 2000);
		});

		videoWindow.addEventListener('close', function () {
			finish();
		});

		videoWindow.add(videoPlayer);
		win.open();
	});
});
