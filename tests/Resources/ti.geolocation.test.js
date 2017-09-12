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
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

// Skip on Windows 10 Mobile device family due to prompt,
// however we might be able to run some tests?
describe.windowsEmulatorBroken('Titanium.Geolocation', function () {
	it('apiName', function () {
		should(Ti.Geolocation).have.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.Geolocation.apiName).be.eql('Ti.Geolocation');
	});

	it('ACCURACY_BEST', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_BEST').which.is.a.Number;
	});

	// Intentionally skip for Android, doesn't exist
	it.androidMissing('ACCURACY_BEST_FOR_NAVIGATION', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_BEST_FOR_NAVIGATION').which.is.a.Number;
	});

	it('ACCURACY_HIGH', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_HIGH').which.is.a.Number;
	});

	it('ACCURACY_HUNDRED_METERS', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_HUNDRED_METERS').which.is.a.Number;
	});

	it('ACCURACY_KILOMETER', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_KILOMETER').which.is.a.Number;
	});

	it('ACCURACY_LOW', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_LOW').which.is.a.Number;
	});

	it('ACCURACY_NEAREST_TEN_METERS', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_NEAREST_TEN_METERS').which.is.a.Number;
	});

	it('ACCURACY_THREE_KILOMETERS', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_THREE_KILOMETERS').which.is.a.Number;
	});

	// FIXME Get working on Android
	it.androidBroken('accuracy', function () {
		should(Ti.Geolocation.getAccuracy()).be.a.Number;
		should(Ti.Geolocation.getAccuracy).be.a.Function;
		should(Ti.Geolocation.setAccuracy).be.a.Function;
		Ti.Geolocation.setAccuracy(Ti.Geolocation.ACCURACY_BEST);
		should(Ti.Geolocation.getAccuracy()).be.eql(Ti.Geolocation.ACCURACY_BEST);
	});

	// Intentionally skip for Android, doesn't exist
	it.androidMissing('distanceFilter', function () {
		should(Ti.Geolocation.getDistanceFilter).be.a.Function;
		should(Ti.Geolocation.getDistanceFilter()).be.a.Number;
		should(Ti.Geolocation.setDistanceFilter).be.a.Function;
		Ti.Geolocation.setDistanceFilter(1000);
		should(Ti.Geolocation.getDistanceFilter()).be.eql(1000);
	});

	// Intentionally skip for Android, doesn't exist
	it.androidMissing('headingFilter', function () {
		should(Ti.Geolocation.getHeadingFilter).be.a.Function;
		should(Ti.Geolocation.getHeadingFilter()).be.a.Number;
		should(Ti.Geolocation.setHeadingFilter).be.a.Function;
		Ti.Geolocation.setHeadingFilter(90);
		should(Ti.Geolocation.getHeadingFilter()).be.eql(90);
	});

	it('lastGeolocation', function () {
		var returnValue;
		should(Ti.Geolocation.getLastGeolocation).be.a.Function;
		returnValue = Ti.Geolocation.getLastGeolocation();
		// should(returnValue).be.a.Object; // FIXME How do we test return type? Docs say String. May be null or undefined, as well!
	});

	it('locationServicesEnabled', function () {
		should(Ti.Geolocation.getLocationServicesEnabled).be.a.Function;
		should(Ti.Geolocation.getLocationServicesEnabled()).be.a.Boolean;
	});

	it('forwardGeocoder', function (finish) {
		this.timeout(6e4); // 60 sec

		should(Ti.Geolocation.forwardGeocoder).be.a.Function;
		Ti.Geolocation.forwardGeocoder('440 N Bernardo Ave, Mountain View', function (data) {
			try {
				should(data).have.property('success').which.is.a.Boolean;
				should(data.success).be.eql(true);
				should(data).have.property('code').which.is.a.Number;
				should(data.code).be.eql(0);
				should(data.latitude).be.approximately(37.387, 0.002); // iOS gives: 37.38605, Windows does 37.3883645
				should(data.longitude).be.approximately(-122.065, 0.02); // WIndows gives: -122.0512682, iOS gives -122.08385
				finish();
			} catch (err) {
				finish(err);
			}
		});
	});

	// FIXME The address object is different from platform to platform! https://jira.appcelerator.org/browse/TIMOB-23496
	it('reverseGeocoder', function (finish) {
		this.timeout(6e4); // 60 sec

		should(Ti.Geolocation.reverseGeocoder).be.a.Function;
		Ti.Geolocation.reverseGeocoder(37.3883645, -122.0512682, function (data) {
			try {
				should(data).have.property('success').which.is.a.Boolean;
				should(data.success).be.eql(true);
				should(data).have.property('code').which.is.a.Number;
				should(data.code).be.eql(0);
				// FIXME error property is missing altogether on success for iOS...
				// should(data).have.property('error'); // undefined on success, holds error message as String otherwise.
				should(data).have.property('places').which.is.an.Array;
				// FIXME Parity issues!
				if (utilities.isAndroid()) {
					should(data.places[0].postalCode).be.eql('94043');
					should(data.places[0]).have.property('latitude').which.is.a.String;
					should(data.places[0]).have.property('longitude').which.is.a.String;
				} else {
					should(data.places[0].zipcode).be.eql('94043');
					should(data.places[0]).have.property('latitude').which.is.a.Number; // docs say String!
					should(data.places[0]).have.property('longitude').which.is.a.Number; // docs say String!
				}
				should(data.places[0].country).be.eql('United States of America');
				should(data.places[0].state).be.eql('California');
				should(data.places[0].country_code).be.eql('US');
				should(data.places[0]).have.property('city').which.is.a.String;
				should(data.places[0]).have.property('address').which.is.a.String;

				finish();
			} catch (err) {
				finish(err);
			}
		});
	});

	it('currentPosition', function () {
		should(Ti.Geolocation.getCurrentPosition).be.a.Function;
	});

	it('currentHeading', function () {
		should(Ti.Geolocation.getCurrentHeading).be.a.Function;
	});
});
