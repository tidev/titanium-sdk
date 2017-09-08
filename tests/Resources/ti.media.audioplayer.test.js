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
	var STATE_CONSTANTS = [
			'STATE_BUFFERING', 'STATE_INITIALIZED', 'STATE_PAUSED', 'STATE_PLAYING',
			'STATE_STARTING', 'STATE_STOPPED', 'STATE_STOPPING',
			'STATE_WAITING_FOR_DATA', 'STATE_WAITING_FOR_QUEUE'
		],
		i;

	it('apiName', function () {
		var player = Ti.Media.createAudioPlayer();
		should(player).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(player.apiName).be.eql('Ti.Media.AudioPlayer');
		// FIXME This only works on an instance of a proxy now on Android
		// should(Ti.Media.AudioPlayer).have.readOnlyProperty('apiName').which.is.a.String;
		// should(Ti.Media.AudioPlayer.apiName).be.eql('Ti.Media.AudioPlayer');
	});

	// constants
	for (i = 0; i < STATE_CONSTANTS.length; i++) {
		// FIXME These constants are on instances of iOS proxies, not on module itself
		it.iosBroken(STATE_CONSTANTS[i], function () { // eslint-disable-line no-loop-func
			should(Ti.Media.Sound).have.constant(STATE_CONSTANTS[i]).which.is.a.Number;
		});
	}

	// TODO Add tests for non-constant properties
	// TODO Add tests for methods
});
