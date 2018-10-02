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

describe('Titanium.Media', function () {
	it('#createAudioPlayer()', function () {
		should(Ti.Media.createAudioPlayer).be.a.Function;
	});
});

describe('Titanium.Media.AudioPlayer', function () {
	var audioPlayer;

	beforeEach(function () {
		audioPlayer = Ti.Media.createAudioPlayer({ url: '/sample.mp3' });
	});

	afterEach(function () {
		audioPlayer = null;
	});

	// Updated existing test-case, please replace with old one
	it('.url', function (finish) {
		should(audioPlayer.url).be.a.String;
		should(audioPlayer.getUrl).be.a.Function;
		should(audioPlayer.setUrl).be.a.Function;
		should(audioPlayer.url).eql(audioPlayer.getUrl());

		// Re-set URL to test TIMOB-26334, this should not crash
		try {
			audioPlayer.url = '/sample.mp3';
			finish();
		} catch (e) {
			finish(e);
		}
	});

	it('.duration', function (finish) {
		this.timeout(2000);
		audioPlayer.start();

		setTimeout(function () {
			try {
				should(audioPlayer.duration).be.a.Number;
				// give a tiny bit of fudge room here. iOS and Android differ by 5ms on this file
				should(audioPlayer.duration).be.within(45250, 45500); // 45 seconds. iOS gives us 45322, Android gives 45327
				finish();
			} catch (e) {
				finish(e);
			}
		}, 1000);
	});
});
