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

describe('Titanium.Media', function () {
	it('#createVideoPlayer()', function () {
		should(Ti.Media.createVideoPlayer).be.a.Function;
	});
});

describe('Titanium.Media.VideoPlayer', function () {
	it('apiName', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('apiName').which.is.a.String;
		should(player.apiName).be.eql('Ti.Media.VideoPlayer');
	});

	it('playing', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('playing').which.is.a.Boolean;
	});

	it('scalingMode', function () {
		var player = Ti.Media.createVideoPlayer();
		if (utilities.isIOS()) { // FIXME: Parity issue!
			should(player.scalingMode).be.a.String;
		} else {
			should(player.scalingMode).be.a.Number;
		}
	});

	it.ios('allowsAirPlay', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.allowsAirPlay).be.a.Boolean;
	});

	it.ios('autoplay', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.autoplay).be.a.Boolean;
	});

	it.ios('volume', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.volume).be.a.Number;
	});

	it.ios('pictureInPictureEnabled', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.pictureInPictureEnabled).be.a.Boolean;
	});

	it.windowsMissing('showsControls', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.showsControls).be.a.Boolean;
	});

	it.ios('playableDuration', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('playableDuration').which.is.a.Number;
	});

	it.ios('duration', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('duration').which.is.a.Number;
	});

	it('currentPlaybackTime', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.currentPlaybackTime).be.a.Number;
	});

	it.ios('endPlaybackTime', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player.endPlaybackTime).be.a.Number;
	});

	it.ios('moviePlayerStatus', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('moviePlayerStatus').which.is.a.Number;
	});

	it.ios('Close window containing a video player (TIMOB-25574)', function (finish) {
		var win = Titanium.UI.createWindow();

		var nav = Titanium.UI.iOS.createNavigationWindow({
			window: win
		});

		var detailWindow = Titanium.UI.createWindow();

		var videoPlayer = Titanium.Media.createVideoPlayer({
			url: 'https://www.w3schools.com/html/mov_bbb.mp4',
			top: 2,
			autoplay: true,
			backgroundColor: 'blue',
			height: 300,
			width: 300,
			mediaControlStyle: Titanium.Media.VIDEO_CONTROL_DEFAULT,
			scalingMode: Titanium.Media.VIDEO_SCALING_ASPECT_FIT
		});

		this.timeout(10000);

		// When the first window opens, open the next one
		win.addEventListener('open', function () {
			setTimeout(function () {
				nav.openWindow(detailWindow);
			}, 2000);
		});

		// Once the next window opens, close it again
		detailWindow.addEventListener('open', function () {
			setTimeout(function () {
				nav.closeWindow(detailWindow);
			}, 2000);
		});

		// If the detail window closes successfully without a crash, we are good!
		detailWindow.addEventListener('close', function () {
			finish();
		});

		detailWindow.add(videoPlayer);
		nav.open();
	});
});
