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

// FIXME This pops a prompt on Windows 10 and will hang tests. We can log on and allow manually...
// Skip on Windows 10 Mobile device family due to prompt,
// however we might be able to run some tests?
describe.windowsBroken('Titanium.Geolocation', function () {
	it('.apiName', function () {
		should(Ti.Geolocation).have.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.Geolocation.apiName).be.eql('Ti.Geolocation');
	});

	it('.ACCURACY_BEST', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_BEST').which.is.a.Number;
	});

	// Intentionally skip for Android, doesn't exist
	it.androidMissing('.ACCURACY_BEST_FOR_NAVIGATION', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_BEST_FOR_NAVIGATION').which.is.a.Number;
	});

	it('.ACCURACY_HIGH', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_HIGH').which.is.a.Number;
	});

	it('.ACCURACY_HUNDRED_METERS', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_HUNDRED_METERS').which.is.a.Number;
	});

	it('.ACCURACY_KILOMETER', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_KILOMETER').which.is.a.Number;
	});

	it('.ACCURACY_LOW', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_LOW').which.is.a.Number;
	});

	it('.ACCURACY_NEAREST_TEN_METERS', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_NEAREST_TEN_METERS').which.is.a.Number;
	});

	it('.ACCURACY_THREE_KILOMETERS', function () {
		should(Ti.Geolocation).have.constant('ACCURACY_THREE_KILOMETERS').which.is.a.Number;
	});

	it.androidMissing('.ACTIVITYTYPE_*', function () {
		should(Ti.Geolocation).have.enumeration('Number', [ 'ACTIVITYTYPE_AUTOMOTIVE_NAVIGATION', 'ACTIVITYTYPE_FITNESS', 'ACTIVITYTYPE_OTHER', 'ACTIVITYTYPE_OTHER_NAVIGATION' ]);
	});

	it.androidMissing('.AUTHORIZATION_*', function () {
		should(Ti.Geolocation).have.enumeration('Number', [ 'AUTHORIZATION_ALWAYS', 'AUTHORIZATION_DENIED', 'AUTHORIZATION_RESTRICTED', 'AUTHORIZATION_UNKNOWN', 'AUTHORIZATION_WHEN_IN_USE' ]);
	});

	it.androidMissing('.ERROR_*', function () {
		should(Ti.Geolocation).have.enumeration('Number', [ 'ERROR_DENIED', 'ERROR_HEADING_FAILURE', 'ERROR_LOCATION_UNKNOWN', 'ERROR_NETWORK', 'ERROR_REGION_MONITORING_DELAYED', 'ERROR_REGION_MONITORING_DENIED', 'ERROR_REGION_MONITORING_FAILURE' ]);
	});

	it.iosMissing('.PROVIDER_*', function () {
		should(Ti.Geolocation).have.enumeration('String', [ 'PROVIDER_GPS', 'PROVIDER_NETWORK', 'PROVIDER_PASSIVE' ]);
	});

	// FIXME Get working on Android
	it.androidBroken('.accuracy', function () {
		should(Ti.Geolocation).have.a.property('accuracy').which.is.a.Number;
	});

	it.androidBroken('#getAccuracy()', function () {
		should(Ti.Geolocation).have.a.property('getAccuracy').which.is.a.Function;
		should(Ti.Geolocation.getAccuracy()).be.a.Number;
	});

	it.androidBroken('#setAccuracy()', function () {
		should(Ti.Geolocation).have.a.property('setAccuracy').which.is.a.Function;
		Ti.Geolocation.setAccuracy(Ti.Geolocation.ACCURACY_BEST);
		should(Ti.Geolocation.accuracy).be.eql(Ti.Geolocation.ACCURACY_BEST);
	});

	it.ios('.activityType', function () {
		should(Ti.Geolocation).have.a.property('activityType').which.is.a.Number;
	});

	it.ios('#getActivityType()', function () {
		should(Ti.Geolocation).have.a.property('getActivityType').which.is.a.Function;
		should(Ti.Geolocation.getActivityType()).be.a.Number;
	});

	it.ios('#setActivityType()', function () {
		should(Ti.Geolocation).have.a.property('setActivityType').which.is.a.Function;
		Ti.Geolocation.setActivityType(Ti.Geolocation.ACTIVITYTYPE_FITNESS);
		should(Ti.Geolocation.activityType).be.eql(Ti.Geolocation.ACTIVITYTYPE_FITNESS);
	});

	it.ios('.allowsBackgroundLocationUpdates', function () {
		should(Ti.Geolocation).have.a.property('allowsBackgroundLocationUpdates').which.is.a.Boolean;
		should(Ti.Geolocation.allowsBackgroundLocationUpdates).be.eql(false); // defaults to false (unless a special tiapp property is set, see docs)
	});

	it.ios('#getAllowsBackgroundLocationUpdates()', function () {
		should(Ti.Geolocation).have.a.property('getAllowsBackgroundLocationUpdates').which.is.a.Function;
		should(Ti.Geolocation.getAllowsBackgroundLocationUpdates()).be.a.Boolean;
	});

	it.ios('#setAllowsBackgroundLocationUpdates()', function () {
		should(Ti.Geolocation).have.a.property('setAllowsBackgroundLocationUpdates').which.is.a.Function;
		Ti.Geolocation.setAllowsBackgroundLocationUpdates(true); // defaults to false, set to true
		should(Ti.Geolocation.allowsBackgroundLocationUpdates).be.eql(true);
	});

	// Intentionally skip for Android, doesn't exist
	it.androidMissing('.distanceFilter', function () {
		should(Ti.Geolocation).have.a.property('distanceFilter').which.is.a.Number;
	});

	it.androidMissing('#getDistanceFilter()', function () {
		should(Ti.Geolocation).have.a.property('getDistanceFilter').which.is.a.Function;
		should(Ti.Geolocation.getDistanceFilter()).be.a.Number;
	});

	it.androidMissing('#setDistanceFilter()', function () {
		should(Ti.Geolocation).have.a.property('setDistanceFilter').which.is.a.Function;
		Ti.Geolocation.setDistanceFilter(1000);
		should(Ti.Geolocation.distanceFilter).eql(1000);
	});

	it.ios('.hasCompass', function () {
		should(Ti.Geolocation).have.a.property('hasCompass').which.is.a.Boolean;
	});

	it.ios('#getHasCompass()', function () {
		should(Ti.Geolocation).have.a.property('getHasCompass').which.is.a.Function;
		should(Ti.Geolocation.getHasCompass()).be.a.Boolean;
	});

	// Intentionally skip for Android, doesn't exist
	it.androidMissing('.headingFilter', function () {
		should(Ti.Geolocation).have.a.property('headingFilter').which.is.a.Number;
	});

	it.androidMissing('#getHeadingFilter()', function () {
		should(Ti.Geolocation).have.a.property('getHeadingFilter').which.is.a.Function;
		should(Ti.Geolocation.getHeadingFilter()).be.a.Number;
	});

	it.androidMissing('#setHeadingFilter', function () {
		should(Ti.Geolocation).have.a.property('setHeadingFilter').which.is.a.Function;
		Ti.Geolocation.setHeadingFilter(90);
		should(Ti.Geolocation.headingFilter).eql(90);
	});

	it('.lastGeolocation', function () {
		should(Ti.Geolocation).have.a.property('lastGeolocation'); // TODO: which is a String/null/undefined?
	});

	it('#getLastGeolocation()', function () {
		should(Ti.Geolocation).have.a.property('getLastGeolocation').which.is.a.Function;
		const returnValue = Ti.Geolocation.getLastGeolocation();
		// should(returnValue).be.a.Object; // FIXME How do we test return type? Docs say String. May be null or undefined, as well!
	});

	it.androidMissing('.locationServicesAuthorization', function () {
		should(Ti.Geolocation).have.a.property('locationServicesAuthorization').which.is.a.Number;
	});

	it.androidMissing('#getLocationServicesAuthorization()', function () {
		should(Ti.Geolocation).have.a.property('getLocationServicesAuthorization').which.is.a.Function;
		should(Ti.Geolocation.getLocationServicesAuthorization()).be.a.Number;
	});

	it('.locationServicesEnabled', function () {
		should(Ti.Geolocation).have.a.property('locationServicesEnabled').which.is.a.Boolean;
	});

	it('#getLocationServicesEnabled()', function () {
		should(Ti.Geolocation).have.a.property('getLocationServicesEnabled').which.is.a.Function;
		should(Ti.Geolocation.getLocationServicesEnabled()).be.a.Boolean;
	});

	it.ios('.pauseLocationUpdateAutomatically', function () {
		should(Ti.Geolocation).have.a.property('pauseLocationUpdateAutomatically').which.is.a.Boolean;
		should(Ti.Geolocation.pauseLocationUpdateAutomatically).eql(false); // defaults to false
	});

	it.ios('#getPauseLocationUpdateAutomatically()', function () {
		should(Ti.Geolocation).have.a.property('getPauseLocationUpdateAutomatically').which.is.a.Function;
		should(Ti.Geolocation.getPauseLocationUpdateAutomatically()).be.a.Boolean;
	});

	it.ios('#setPauseLocationUpdateAutomatically()', function () {
		should(Ti.Geolocation).have.a.property('setPauseLocationUpdateAutomatically').which.is.a.Function;
		Ti.Geolocation.setPauseLocationUpdateAutomatically(true); // defaults to false
		should(Ti.Geolocation.pauseLocationUpdateAutomatically).eql(true);
	});

	it.ios('.showBackgroundLocationIndicator', function () {
		should(Ti.Geolocation).have.a.property('showBackgroundLocationIndicator').which.is.a.Boolean;
		should(Ti.Geolocation.showBackgroundLocationIndicator).eql(false); // defaults to false
	});

	it.ios('#getShowBackgroundLocationIndicator()', function () {
		should(Ti.Geolocation).have.a.property('getShowBackgroundLocationIndicator').which.is.a.Function;
		should(Ti.Geolocation.getShowBackgroundLocationIndicator()).be.a.Boolean;
	});

	it.ios('#setShowBackgroundLocationIndicator()', function () {
		should(Ti.Geolocation).have.a.property('setShowBackgroundLocationIndicator').which.is.a.Function;
		Ti.Geolocation.setShowBackgroundLocationIndicator(true); // defaults to false
		should(Ti.Geolocation.showBackgroundLocationIndicator).eql(true);
	});

	it.ios('.showCalibration', function () {
		should(Ti.Geolocation).have.a.property('showCalibration').which.is.a.Boolean;
		should(Ti.Geolocation.showCalibration).eql(true); // defaults to true
	});

	it.ios('#getShowCalibration()', function () {
		should(Ti.Geolocation).have.a.property('getShowCalibration').which.is.a.Function;
		should(Ti.Geolocation.getShowCalibration()).be.a.Boolean;
	});

	it.ios('#setShowCalibration()', function () {
		should(Ti.Geolocation).have.a.property('setShowCalibration').which.is.a.Function;
		Ti.Geolocation.setShowCalibration(false); // defaults to true
		should(Ti.Geolocation.showCalibration).eql(false);
	});

	it.ios('.trackSignificantLocationChange', function () {
		should(Ti.Geolocation).have.a.property('trackSignificantLocationChange').which.is.a.Boolean;
		should(Ti.Geolocation.trackSignificantLocationChange).eql(false); // defaults to false
	});

	it.ios('#getTrackSignificantLocationChange()', function () {
		should(Ti.Geolocation).have.a.property('getTrackSignificantLocationChange').which.is.a.Function;
		should(Ti.Geolocation.getTrackSignificantLocationChange()).be.a.Boolean;
	});

	it.ios('#setTrackSignificantLocationChange()', function () {
		should(Ti.Geolocation).have.a.property('setTrackSignificantLocationChange').which.is.a.Function;
		Ti.Geolocation.setTrackSignificantLocationChange(true); // defaults to false
		should(Ti.Geolocation.trackSignificantLocationChange).eql(true);
	});

	// Methods

	it('#forwardGeocoder()', function (finish) {
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
	it('#reverseGeocoder()', function (finish) {
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
				should(data.places[0].country).be.eql('USA');
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

	it('#getCurrentPosition()', function () {
		should(Ti.Geolocation).have.a.property('getCurrentPosition').which.is.a.Function;
	});

	it('#getCurrentHeading()', function () {
		should(Ti.Geolocation).have.a.property('getCurrentHeading').which.is.a.Function;
	});
});
