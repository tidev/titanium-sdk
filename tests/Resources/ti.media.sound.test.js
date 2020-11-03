/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Media', () => {
	it('#createSound()', () => should(Ti.Media.createSound).be.a.Function());
});

describe('Titanium.Media.Sound', function () {
	it.windowsPhoneBroken('apiName', function () { // this crashes windows phone
		const sound = Ti.Media.createSound();
		should(sound).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(sound.apiName).be.eql('Ti.Media.Sound');
		// FIXME This only works on an instance of a proxy now on Android
		// should(Ti.Media.Sound).have.readOnlyProperty('apiName').which.is.a.String();
		// should(Ti.Media.Sound.apiName).be.eql('Ti.Media.Sound');
	});

	// constants
	// Trying to loop over an array of constants makes the tests mysteriously fail
	// FIXME These only work on instances of proxy on iOS
	it.iosBroken('STATE_BUFFERING', function () {
		should(Ti.Media.Sound).have.constant('STATE_BUFFERING').which.is.a.Number();
	});

	it.iosBroken('STATE_INITIALIZED', function () {
		should(Ti.Media.Sound).have.constant('STATE_INITIALIZED').which.is.a.Number();
	});

	it.iosBroken('STATE_PAUSED', function () {
		should(Ti.Media.Sound).have.constant('STATE_PAUSED').which.is.a.Number();
	});

	it.iosBroken('STATE_PLAYING', function () {
		should(Ti.Media.Sound).have.constant('STATE_PLAYING').which.is.a.Number();
	});

	it.iosBroken('STATE_STARTING', function () {
		should(Ti.Media.Sound).have.constant('STATE_STARTING').which.is.a.Number();
	});

	it.iosBroken('STATE_STOPPED', function () {
		should(Ti.Media.Sound).have.constant('STATE_STOPPED').which.is.a.Number();
	});

	it.iosBroken('STATE_STOPPING', function () {
		should(Ti.Media.Sound).have.constant('STATE_STOPPING').which.is.a.Number();
	});

	it.iosBroken('STATE_WAITING_FOR_DATA', function () {
		should(Ti.Media.Sound).have.constant('STATE_WAITING_FOR_DATA').which.is.a.Number();
	});

	it.iosBroken('STATE_WAITING_FOR_QUEUE', function () {
		should(Ti.Media.Sound).have.constant('STATE_WAITING_FOR_QUEUE').which.is.a.Number();
	});

	// TODO Add tests for non-constant properties
	// TODO Add tests for methods
});
