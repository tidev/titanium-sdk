/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.ios('Titanium.WatchSession', function () {

	it('.apiName', () => {
		const watchSession = Ti.WatchSession;
		should(watchSession).have.readOnlyProperty('apiName').which.is.a.String();
		should(watchSession.apiName).be.eql('Ti.WatchSession');
	});

	// constants
	it('.ACTIVATION_STATE_NOT_ACTIVATED', () => {
		should(Ti.WatchSession).have.constant('ACTIVATION_STATE_NOT_ACTIVATED').which.is.a.Number();
	});

	it('.ACTIVATION_STATE_INACTIVE', () => {
		should(Ti.WatchSession).have.constant('ACTIVATION_STATE_INACTIVE').which.is.a.Number();
	});

	it('.ACTIVATION_STATE_ACTIVATED', () => {
		should(Ti.WatchSession).have.constant('ACTIVATION_STATE_ACTIVATED').which.is.a.Number();
	});

	// properties
	it('.isSupported', () => should(Ti.WatchSession.isSupported).be.a.Boolean());

	it('.isPaired', () => should(Ti.WatchSession.isPaired).be.a.Boolean());

	it('.isWatchAppInstalled', () => should(Ti.WatchSession.isWatchAppInstalled).be.a.Boolean());

	it('.isComplicationEnabled', () => should(Ti.WatchSession.isComplicationEnabled).be.a.Boolean());

	it('.isReachable', () => should(Ti.WatchSession.isReachable).be.a.Boolean());

	it('.isActivated', () => should(Ti.WatchSession.isActivated).be.a.Boolean());

	it('.hasContentPending', () => should(Ti.WatchSession.hasContentPending).be.a.Boolean());

	it('.remainingComplicationUserInfoTransfers', () => {
		should(Ti.WatchSession.remainingComplicationUserInfoTransfers).be.a.Number();
	});
});
