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

	it.ios('showsControls', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('showsControls').which.is.a.Boolean;
	});

	it.ios('Close window containing a video player (TIMOB-25574)', function (finish) {
		this.timeout(15000);

		var win = Ti.UI.createWindow({
			backgroundColor: 'white'
		});

		var nav = Ti.UI.iOS.createNavigationWindow({
			window: win
		});

		win.addEventListener('focus', openWindow);

		nav.open();

		function openWindow() {
			win.removeEventListener('focus', openWindow);
			var detailWindow = Ti.UI.createWindow({
				backgroundColor: 'black'
			});

			var videoPlayer = Ti.Media.createVideoPlayer({
				url: 'https://www.w3schools.com/html/mov_bbb.mp4',
				autoplay: true,
				backgroundColor: 'blue',
				height: 300,
				width: 300,
				mediaControlStyle: Ti.Media.VIDEO_CONTROL_NONE,
				scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FILL,
				repeatMode: Ti.Media.VIDEO_REPEAT_MODE_ONE,
				showsControls: false
			});

			detailWindow.addEventListener('open', function () {
				setTimeout(function () {
					detailWindow.close();
				}, 2000);
			});

			detailWindow.addEventListener('close', function () {
				setTimeout(function () {
					finish(); // We are done!
				}, 2000);
			});

			detailWindow.add(videoPlayer);
			nav.openWindow(detailWindow);
		}
	});
});
