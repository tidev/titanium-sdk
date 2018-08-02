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
		audioPlayer = Ti.Media.createAudioPlayer({ url: 'sample.mp3' });
	});

	afterEach(function () {
		audioPlayer = null;
	});

	it('apiName', function () {
		should(audioPlayer).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(audioPlayer.apiName).be.eql('Ti.Media.AudioPlayer');
	});

	// constants
	it('STATE_BUFFERING', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_BUFFERING').which.is.a.Number;
	});

	it('STATE_INITIALIZED', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_INITIALIZED').which.is.a.Number;
	});

	it('STATE_PAUSED', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_PAUSED').which.is.a.Number;
	});

	it('STATE_PLAYING', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_PLAYING').which.is.a.Number;
	});

	it('STATE_STARTING', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_STARTING').which.is.a.Number;
	});

	it('STATE_STOPPED', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_STOPPED').which.is.a.Number;
	});

	it('STATE_STOPPING', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_STOPPING').which.is.a.Number;
	});

	it('STATE_WAITING_FOR_DATA', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_WAITING_FOR_DATA').which.is.a.Number;
	});

	it('STATE_WAITING_FOR_QUEUE', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_WAITING_FOR_QUEUE').which.is.a.Number;
	});

	it('.url', function () {
		should(audioPlayer.url).be.a.String;
		should(audioPlayer.getUrl).be.a.Function;
		should(audioPlayer.setUrl).be.a.Function;
		should(audioPlayer.url).eql(audioPlayer.getUrl());
	});

	it('#start, #stop', function (finish) {
		should(audioPlayer.start).be.a.Function;
		should(audioPlayer.stop).be.a.Function;

		audioPlayer.start();

		setTimeout(function () {
			audioPlayer.stop();
			finish();
		}, 1000);
	});

	it('#pause', function (finish) {
		should(audioPlayer.pause).be.a.Function;

		audioPlayer.start();

		setTimeout(function () {
			audioPlayer.pause();
			finish();
		}, 1000);
	});

	it('#restart', function (finish) {
		should(audioPlayer.restart).be.a.Function;

		audioPlayer.start();

		setTimeout(function () {
			audioPlayer.restart();
			audioPlayer.stop();
			finish();
		}, 1000);
	});
});
