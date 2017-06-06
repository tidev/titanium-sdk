/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.Media.AudioPlayer', function () {
	it('apiName', function () {
		should(Ti.Media.AudioPlayer).have.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.Media.AudioPlayer.apiName).be.eql('Titanium.Media.AudioPlayer');
	});

	it('STATE_BUFFERING', function () {
		should(Titanium.Media.AudioPlayer).have.constant('STATE_BUFFERING').which.is.a.Number;
	});

	it('STATE_INITIALIZED', function () {
		should(Titanium.Media.AudioPlayer).have.constant('STATE_INITIALIZED').which.is.a.Number;
	});

	it('STATE_PAUSED', function () {
		should(Titanium.Media.AudioPlayer).have.constant('STATE_PAUSED').which.is.a.Number;
	});

	it('STATE_PLAYING', function () {
		should(Titanium.Media.AudioPlayer).have.constant('STATE_PLAYING').which.is.a.Number;
	});

	it('STATE_STARTING', function () {
		should(Titanium.Media.AudioPlayer).have.constant('STATE_STARTING').which.is.a.Number;
	});

	it('STATE_STOPPED', function () {
		should(Titanium.Media.AudioPlayer).have.constant('STATE_STOPPED').which.is.a.Number;
	});

	it('STATE_STOPPING', function () {
		should(Titanium.Media.AudioPlayer).have.constant('STATE_STOPPING').which.is.a.Number;
	});

	it('STATE_WAITING_FOR_DATA', function () {
		should(Titanium.Media.AudioPlayer).have.constant('STATE_WAITING_FOR_DATA').which.is.a.Number;
	});

	it('STATE_WAITING_FOR_QUEUE', function () {
		should(Titanium.Media.AudioPlayer).have.constant('STATE_WAITING_FOR_QUEUE').which.is.a.Number;
	});
});
