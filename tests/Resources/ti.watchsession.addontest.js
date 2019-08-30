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

describe.ios('Titanium.WatchSession', function () {

	it('apiName', function () {
		var watchSession = Ti.WatchSession;
		should(watchSession).have.readOnlyProperty('apiName').which.is.a.String;
		should(watchSession.apiName).be.eql('Ti.WatchSession');
	});

	// constants
	it('ACTIVATION_STATE_NOT_ACTIVATED', function () {
		should(Ti.WatchSession).have.constant('ACTIVATION_STATE_NOT_ACTIVATED').which.is.a.Number;
	});

	it('ACTIVATION_STATE_INACTIVE', function () {
		should(Ti.WatchSession).have.constant('ACTIVATION_STATE_INACTIVE').which.is.a.Number;
	});

	it('ACTIVATION_STATE_ACTIVATED', function () {
		should(Ti.WatchSession).have.constant('ACTIVATION_STATE_ACTIVATED').which.is.a.Number;
	});

	it('#isSupported', function () {
		should(Ti.WatchSession.isSupported).be.a.Boolean;
	});

	it('#isPaired', function () {
		should(Ti.WatchSession.isPaired).be.a.Boolean;
	});

	it('#isWatchAppInstalled', function () {
		should(Ti.WatchSession.isWatchAppInstalled).be.a.Boolean;
	});

	it('#isComplicationEnabled', function () {
		should(Ti.WatchSession.isComplicationEnabled).be.a.Boolean;
	});

	it('#isReachable', function () {
		should(Ti.WatchSession.isReachable).be.a.Boolean;
	});

	it('#isActivated', function () {
		should(Ti.WatchSession.isActivated).be.a.Boolean;
	});

	it('#hasContentPending', function () {
		should(Ti.WatchSession.hasContentPending).be.a.Boolean;
	});

	it('#remainingComplicationUserInfoTransfers', function () {
		should(Ti.WatchSession.remainingComplicationUserInfoTransfers).be.a.Number;
	});
});
