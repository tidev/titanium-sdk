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

describe('Titanium.Media.AudioPlayer', function () {
	var audioPlayer;

	beforeEach(function () {
		audioPlayer = Ti.Media.createAudioPlayer({ url: '/sample.mp3' });
	});

	afterEach(function () {
		audioPlayer = null;
	});

	it.ios('TIMOB-26533', function (finish) {
		//	Ti.Media.Audio player without url set is crashing while registering for event listener
		audioPlayer = null;
		audioPlayer = Ti.Media.createAudioPlayer();

		try {
			audioPlayer.addEventListener('progress', function (e) {
			});
			finish();
		} catch (e) {
			finish(e);
		}
	});
});
