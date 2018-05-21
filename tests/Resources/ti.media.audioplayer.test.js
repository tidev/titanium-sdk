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

	it('apiName', function () {
		var player = Ti.Media.createAudioPlayer({ url: 'sample.mp3' });
		should(player).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(player.apiName).be.eql('Ti.Media.AudioPlayer');
		player = null;
	});

	before(function () {
		audioPlayer = Ti.Media.createAudioPlayer({ url: 'sample.mp3' });
	});

	afterEach(function () {
		audioPlayer = null;
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

	it('basic', function () {
		should(audioPlayer.url).be.a.String;
		should(audioPlayer.getUrl).be.a.Function;
		should(audioPlayer.setUrl).be.a.Function;
	});

	it('methods', function () {
		should(audioPlayer.start).be.a.Function;
		should(audioPlayer.restart).be.a.Function;
		should(audioPlayer.pause).be.a.Function;
		should(audioPlayer.stop).be.a.Function;
	});
});
