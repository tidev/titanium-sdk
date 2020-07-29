/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium, mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const PlayServices = require('ti.playservices');

describe('ti.playservices', () => {
	it.android('GOOGLE_PLAY_SERVICES_PACKAGE', () => {
		should(PlayServices).have.constant('GOOGLE_PLAY_SERVICES_PACKAGE').which.is.a.String();
	});

	it.android('GOOGLE_PLAY_SERVICES_VERSION_CODE', () => {
		should(PlayServices).have.constant('GOOGLE_PLAY_SERVICES_VERSION_CODE').which.is.a.Number();
	});

	it.android('RESULT_SUCCESS', () => {
		should(PlayServices).have.constant('RESULT_SUCCESS').which.is.a.Number();
	});

	it.android('RESULT_SERVICE_MISSING', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_MISSING').which.is.a.Number();
	});

	it.android('RESULT_SERVICE_UPDATING', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_UPDATING').which.is.a.Number();
	});

	it.android('RESULT_SERVICE_VERSION_UPDATE_REQUIRED', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_VERSION_UPDATE_REQUIRED').which.is.a.Number();
	});

	it.android('RESULT_SERVICE_DISABLED', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_DISABLED').which.is.a.Number();
	});

	it.android('RESULT_SERVICE_INVALID', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_INVALID').which.is.a.Number();
	});

	it.android('isGooglePlayServicesAvailable()', () => {
		should(PlayServices.isGooglePlayServicesAvailable).be.a.Function();
		should(PlayServices.isGooglePlayServicesAvailable()).be.a.Number();
	});

	it.android('isUserResolvableError()', () => {
		should(PlayServices.isUserResolvableError).be.a.Function();

		let result = PlayServices.isUserResolvableError(PlayServices.RESULT_SERVICE_VERSION_UPDATE_REQUIRED);
		should(result).be.a.Boolean();
		should(result).be.true();

		result = PlayServices.isUserResolvableError(PlayServices.RESULT_SERVICE_INVALID);
		should(result).be.a.Boolean();
		should(result).eql(false);
	});

	it.android('getErrorString()', () => {
		should(PlayServices.getErrorString).be.a.Function();

		let result = PlayServices.getErrorString(PlayServices.RESULT_SERVICE_VERSION_UPDATE_REQUIRED);
		should(result).be.a.String();
	});

	it.android('makeGooglePlayServicesAvailable()', () => {
		should(PlayServices.makeGooglePlayServicesAvailable).be.a.Function();
	});
});
