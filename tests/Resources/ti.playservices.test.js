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

// FIXME: These tests should live in the module., not in the SDK test suite!
describe.android('ti.playservices', () => {
	it('GOOGLE_PLAY_SERVICES_PACKAGE', () => {
		should(PlayServices).have.constant('GOOGLE_PLAY_SERVICES_PACKAGE').which.is.a.String();
	});

	it('GOOGLE_PLAY_SERVICES_VERSION_CODE', () => {
		should(PlayServices).have.constant('GOOGLE_PLAY_SERVICES_VERSION_CODE').which.is.a.Number();
	});

	it('RESULT_SUCCESS', () => {
		should(PlayServices).have.constant('RESULT_SUCCESS').which.is.a.Number();
	});

	it('RESULT_SERVICE_MISSING', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_MISSING').which.is.a.Number();
	});

	it('RESULT_SERVICE_UPDATING', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_UPDATING').which.is.a.Number();
	});

	it('RESULT_SERVICE_VERSION_UPDATE_REQUIRED', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_VERSION_UPDATE_REQUIRED').which.is.a.Number();
	});

	it('RESULT_SERVICE_DISABLED', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_DISABLED').which.is.a.Number();
	});

	it('RESULT_SERVICE_INVALID', () => {
		should(PlayServices).have.constant('RESULT_SERVICE_INVALID').which.is.a.Number();
	});

	it('isGooglePlayServicesAvailable()', () => {
		should(PlayServices.isGooglePlayServicesAvailable).be.a.Function();
		should(PlayServices.isGooglePlayServicesAvailable()).be.a.Number();
	});

	it('isUserResolvableError()', () => {
		should(PlayServices.isUserResolvableError).be.a.Function();

		let result = PlayServices.isUserResolvableError(PlayServices.RESULT_SERVICE_VERSION_UPDATE_REQUIRED);
		should(result).be.a.Boolean();
		should(result).be.true();

		// FIXME: Returns true on emulator
		// result = PlayServices.isUserResolvableError(PlayServices.RESULT_SERVICE_INVALID);
		// should(result).be.a.Boolean();
		// should(result).be.false();
	});

	it('getErrorString()', () => {
		should(PlayServices.getErrorString).be.a.Function();

		let result = PlayServices.getErrorString(PlayServices.RESULT_SERVICE_VERSION_UPDATE_REQUIRED);
		should(result).be.a.String();
	});

	it('makeGooglePlayServicesAvailable()', () => {
		should(PlayServices.makeGooglePlayServicesAvailable).be.a.Function();
	});
});
