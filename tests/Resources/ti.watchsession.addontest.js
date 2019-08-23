/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.WatchSession', function () {

	it.ios('apiName', function () {
		var watchSession = Ti.WatchSession;
		should(watchSession).have.readOnlyProperty('apiName').which.is.a.String;
		should(watchSession.apiName).be.eql('Ti.WatchSession');
	});

	// constants
	it.ios('ACTIVATION_STATE_NOT_ACTIVATED', function () {
		should(Ti.WatchSession).have.constant('ACTIVATION_STATE_NOT_ACTIVATED').which.is.a.Number;
	});

	it.ios('ACTIVATION_STATE_INACTIVE', function () {
		should(Ti.WatchSession).have.constant('ACTIVATION_STATE_INACTIVE').which.is.a.Number;
	});

	it.ios('ACTIVATION_STATE_ACTIVATED', function () {
		should(Ti.WatchSession).have.constant('ACTIVATION_STATE_ACTIVATED').which.is.a.Number;
	});

	it.ios('#isSupported', function () {
		should(Ti.WatchSession.isSupported).be.a.Boolean;
	});

	it.ios('#isPaired', function () {
		should(Ti.WatchSession.isPaired).be.a.Boolean;
	});

	it.ios('#isWatchAppInstalled', function () {
		should(Ti.WatchSession.isWatchAppInstalled).be.a.Boolean;
	});

	it.ios('#isComplicationEnabled', function () {
		should(Ti.WatchSession.isComplicationEnabled).be.a.Boolean;
	});

	it.ios('#isReachable', function () {
		should(Ti.WatchSession.isReachable).be.a.Boolean;
	});

	it.ios('#isActivated', function () {
		should(Ti.WatchSession.isActivated).be.a.Boolean;
	});

	it.ios('#hasContentPending', function () {
		should(Ti.WatchSession.hasContentPending).be.a.Boolean;
	});

	it.ios('#remainingComplicationUserInfoTransfers', function () {
		should(Ti.WatchSession.remainingComplicationUserInfoTransfers).be.a.Number;
	});
});
