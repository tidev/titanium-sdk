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

describe('Titanium.Media', function () {
	it('#createVideoPlayer()', function () {
		should(Ti.Media.createVideoPlayer).be.a.Function;
	});
});

describe('Titanium.Media.VideoPlayer', function () {
	var win;

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.ios('App should not crash when setting video player url to null (TIMOB-27799)', function (finish) {
		this.timeout(10000);

		win = Ti.UI.createWindow();
		var videoPlayer = Ti.Media.createVideoPlayer({
			height: '72%',
			url: '/movie.mp4'
		});
		win.add(videoPlayer);
		win.addEventListener('open', function () {
			videoPlayer.play();

			setTimeout(function () {
				videoPlayer.stop();
				videoPlayer.url = null;
			}, 2000);
		});

		videoPlayer.addEventListener('playing', function () {
			finish();
		});

		win.open();
	});
});
