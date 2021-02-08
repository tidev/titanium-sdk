/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';
const should = require('./utilities/assertions');
const isMacOS = Ti.Platform.name === 'Mac OS X';

// FIXME This pops a prompt on Windows 10 and will hang tests. We can log on and allow manually...
// Skip on Windows 10 Mobile device family due to prompt,
// however we might be able to run some tests?
describe.windowsBroken('Titanium.Geolocation', () => {

	describe('constants', () => {
		it.ios('.ACCURACY_BEST', () => {
			should(Ti.Geolocation).have.constant('ACCURACY_BEST').which.is.a.Number();
		});

		it.ios('.ACCURACY_BEST_FOR_NAVIGATION', () => {
			should(Ti.Geolocation).have.constant('ACCURACY_BEST_FOR_NAVIGATION').which.is.a.Number();
		});

		it('.ACCURACY_HIGH', () => {
			should(Ti.Geolocation).have.constant('ACCURACY_HIGH').which.is.a.Number();
		});

		it.ios('.ACCURACY_HUNDRED_METERS', () => {
			should(Ti.Geolocation).have.constant('ACCURACY_HUNDRED_METERS').which.is.a.Number();
		});

		it.ios('.ACCURACY_KILOMETER', () => {
			should(Ti.Geolocation).have.constant('ACCURACY_KILOMETER').which.is.a.Number();
		});

		it('.ACCURACY_LOW', () => {
			should(Ti.Geolocation).have.constant('ACCURACY_LOW').which.is.a.Number();
		});

		it.ios('.ACCURACY_NEAREST_TEN_METERS', () => {
			should(Ti.Geolocation).have.constant('ACCURACY_NEAREST_TEN_METERS').which.is.a.Number();
		});

		it.ios('.ACCURACY_THREE_KILOMETERS', () => {
			should(Ti.Geolocation).have.constant('ACCURACY_THREE_KILOMETERS').which.is.a.Number();
		});

		it.androidMissing('.ACTIVITYTYPE_*', () => {
			should(Ti.Geolocation).have.enumeration('Number', [ 'ACTIVITYTYPE_AUTOMOTIVE_NAVIGATION', 'ACTIVITYTYPE_FITNESS', 'ACTIVITYTYPE_OTHER', 'ACTIVITYTYPE_OTHER_NAVIGATION' ]);
		});

		it.androidMissing('.AUTHORIZATION_*', () => {
			should(Ti.Geolocation).have.enumeration('Number', [ 'AUTHORIZATION_ALWAYS', 'AUTHORIZATION_DENIED', 'AUTHORIZATION_RESTRICTED', 'AUTHORIZATION_UNKNOWN', 'AUTHORIZATION_WHEN_IN_USE' ]);
		});

		it.androidMissing('.ERROR_*', () => {
			should(Ti.Geolocation).have.enumeration('Number', [ 'ERROR_DENIED', 'ERROR_HEADING_FAILURE', 'ERROR_LOCATION_UNKNOWN', 'ERROR_NETWORK', 'ERROR_REGION_MONITORING_DELAYED', 'ERROR_REGION_MONITORING_DENIED', 'ERROR_REGION_MONITORING_FAILURE' ]);
		});

		it.ios('.ACCURACY_REDUCED', () => {
			if (OS_VERSION_MAJOR >= 14) {
				should(Ti.Geolocation).have.constant('ACCURACY_REDUCED').which.is.a.Number();
			}
		});

		it.ios('.ACCURACY_AUTHORIZATION_FULL', () => {
			if (OS_VERSION_MAJOR >= 14) {
				should(Ti.Geolocation).have.constant('ACCURACY_AUTHORIZATION_FULL').which.is.a.Number();
			}
		});

		it.ios('.ACCURACY_AUTHORIZATION_REDUCED', () => {
			if (OS_VERSION_MAJOR >= 14) {
				should(Ti.Geolocation).have.constant('ACCURACY_AUTHORIZATION_REDUCED').which.is.a.Number();
			}
		});
	});

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a String', () => {
				should(Ti.Geolocation).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.Geolocation', () => {
				should(Ti.Geolocation.apiName).be.eql('Ti.Geolocation');
			});
		});

		// FIXME Get working on Android
		describe.androidBroken('.accuracy', () => {
			it('is a Number', () => {
				should(Ti.Geolocation).have.a.property('accuracy').which.is.a.Number();
			});

			it('can be assigned value', () => {
				Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
				should(Ti.Geolocation.accuracy).eql(Ti.Geolocation.ACCURACY_BEST);
			});

			it('has accessors', () => {
				should(Ti.Geolocation).have.accessors('accuracy');
			});
		});

		describe.androidBroken('.activityType', () => {
			it('is a Number', () => {
				should(Ti.Geolocation).have.a.property('activityType').which.is.a.Number();
			});

			it('can be assigned value', () => {
				Ti.Geolocation.activityType = Ti.Geolocation.ACTIVITYTYPE_FITNESS;
				should(Ti.Geolocation.activityType).eql(Ti.Geolocation.ACTIVITYTYPE_FITNESS);
			});

			it('has accessors', () => {
				should(Ti.Geolocation).have.accessors('activityType');
			});
		});

		describe.ios('.allowsBackgroundLocationUpdates', () => {
			it('is a Boolean', () => {
				should(Ti.Geolocation).have.a.property('allowsBackgroundLocationUpdates').which.is.a.Boolean();
			});

			it('defaults to false', () => {
				should(Ti.Geolocation.allowsBackgroundLocationUpdates).be.false(); // defaults to false (unless a special tiapp property is set, see docs)
			});

			it('can be assigned Boolean value', () => {
				Ti.Geolocation.allowsBackgroundLocationUpdates = true;
				should(Ti.Geolocation.allowsBackgroundLocationUpdates).be.true();
			});

			it('has accessors', () => {
				should(Ti.Geolocation).have.accessors('allowsBackgroundLocationUpdates');
			});
		});

		// Intentionally skip for Android, doesn't exist
		describe.androidMissing('.distanceFilter', () => {
			it('is a Number', () => {
				should(Ti.Geolocation).have.a.property('distanceFilter').which.is.a.Number();
			});

			it('can be assigned integer value', () => {
				Ti.Geolocation.distanceFilter = 1000;
				should(Ti.Geolocation.distanceFilter).eql(1000);
			});

			it('has accessors', () => {
				should(Ti.Geolocation).have.accessors('distanceFilter');
			});
		});

		describe.ios('.hasCompass', () => {
			it('is a Boolean', () => {
				should(Ti.Geolocation).have.a.property('hasCompass').which.is.a.Boolean();
			});

			it('has no getter', () => {
				should(Ti.Geolocation).have.a.getter('hasCompass');
			});
		});

		// Intentionally skip for Android, doesn't exist
		describe.androidMissing('.headingFilter', () => {
			it('is a Number', () => {
				should(Ti.Geolocation).have.a.property('headingFilter').which.is.a.Number();
			});

			it('can be assigned integer value', () => {
				Ti.Geolocation.headingFilter = 90;
				should(Ti.Geolocation.headingFilter).eql(90);
			});

			it('has accessors', () => {
				should(Ti.Geolocation).have.accessors('headingFilter');
			});
		});

		describe('.lastGeolocation', () => {
			// https://jira.appcelerator.org/browse/TIMOB-26452
			it.iosBroken('is a property', () => {
				should(Ti.Geolocation).have.a.property('lastGeolocation'); // TODO: which is a String/null/undefined?
			});

			it('has no getter', () => {
				should(Ti.Geolocation).have.a.getter('lastGeolocation');
			});
		});

		it.ios('.locationAccuracyAuthorization', () => {
			if (OS_VERSION_MAJOR >= 14) {
				should(Ti.Geolocation).have.a.property('locationAccuracyAuthorization').which.is.a.Number();
			}
		});

		describe.androidMissing('.locationServicesAuthorization', () => {
			it('is a Number', () => {
				should(Ti.Geolocation).have.a.property('locationServicesAuthorization').which.is.a.Number();
			});

			it('has no getter', () => {
				should(Ti.Geolocation).have.a.getter('locationServicesAuthorization');
			});
		});

		describe('.locationServicesEnabled', () => {
			it('is a Boolean', () => {
				should(Ti.Geolocation).have.a.property('locationServicesEnabled').which.is.a.Boolean();
			});

			it('has no getter', () => {
				should(Ti.Geolocation).have.a.getter('locationServicesEnabled');
			});
		});

		describe.ios('.pauseLocationUpdateAutomatically', () => {
			it('is a Boolean', () => {
				should(Ti.Geolocation).have.a.property('pauseLocationUpdateAutomatically').which.is.a.Boolean();
			});

			it('defaults to false', () => {
				should(Ti.Geolocation.pauseLocationUpdateAutomatically).be.false();
			});

			it('can be assigned a Boolean', () => {
				Ti.Geolocation.pauseLocationUpdateAutomatically = true;
				should(Ti.Geolocation.pauseLocationUpdateAutomatically).be.true();
			});

			it('has accessors', () => {
				should(Ti.Geolocation).have.accessors('pauseLocationUpdateAutomatically');
			});
		});

		describe.ios('.showBackgroundLocationIndicator', () => {
			if (isMacOS) {
				return; // FIXME: How can we limit to ios only, and skip on macos?
			}

			it('is a Boolean', () => {
				should(Ti.Geolocation).have.a.property('showBackgroundLocationIndicator').which.is.a.Boolean();
			});

			it('defaults to false', () => {
				should(Ti.Geolocation.showBackgroundLocationIndicator).be.false();
			});

			it('can be assigned a Boolean', () => {
				Ti.Geolocation.showBackgroundLocationIndicator = true;
				should(Ti.Geolocation.showBackgroundLocationIndicator).be.true();
			});

			it('has accessors', () => {
				should(Ti.Geolocation).have.accessors('showBackgroundLocationIndicator');
			});
		});

		describe.ios('.showCalibration', () => {
			it('is a Boolean', () => {
				should(Ti.Geolocation).have.a.property('showCalibration').which.is.a.Boolean();
			});

			it('defaults to true', () => {
				should(Ti.Geolocation.showCalibration).be.true();
			});

			it('can be assigned Boolean value', () => {
				Ti.Geolocation.showCalibration = false;
				should(Ti.Geolocation.showCalibration).be.false();
			});

			it('has accessors', () => {
				should(Ti.Geolocation).have.accessors('showCalibration');
			});
		});

		describe.ios('.trackSignificantLocationChange', () => {
			it('is a Boolean', () => {
				should(Ti.Geolocation).have.a.property('trackSignificantLocationChange').which.is.a.Boolean();
			});

			it('defaults to false', () => {
				should(Ti.Geolocation.trackSignificantLocationChange).be.false();
			});

			it('can be assigned Boolean value', () => {
				Ti.Geolocation.trackSignificantLocationChange = true;
				should(Ti.Geolocation.trackSignificantLocationChange).be.true();
			});

			it('has accessors', () => {
				should(Ti.Geolocation).have.accessors('trackSignificantLocationChange');
			});
		});
	});

	describe('methods', () => {
		describe('#getCurrentHeading()', () => {
			it('is a Function', () => {
				should(Ti.Geolocation).have.a.property('getCurrentHeading').which.is.a.Function();
			});
		});

		describe('#getCurrentPosition()', () => {
			it('is a Function', () => {
				should(Ti.Geolocation).have.a.property('getCurrentPosition').which.is.a.Function();
			});
		});

		describe('#forwardGeocoder()', () => {
			it('is a Function', () => should(Ti.Geolocation.forwardGeocoder).be.a.Function());

			it('works via callback argument', function (finish) {
				this.timeout(6e4); // 60 sec

				// If we do not add state and zipcode, we end up with Morrow Bay, CA address on Android now!
				// the coords are: 35.3601686, -120.8433491
				Ti.Geolocation.forwardGeocoder('440 N Bernardo Ave, Mountain View, CA 94043', function (data) {
					try {
						should(data).have.property('success').which.is.a.Boolean();
						should(data.success).be.be.true();
						should(data).have.property('code').which.is.a.Number();
						should(data.code).be.eql(0);
						should(data.latitude).be.approximately(37.395, 0.02); // iOS: 37.38605, Windows: 37.3883645, Android: 37.3910366, new iOS: 37.4056
						should(data.longitude).be.approximately(-122.065, 0.02); // Windows: -122.0512682, iOS: -122.08385, Android: -122.0472468
					} catch (err) {
						return finish(err);
					}
					finish();
				});
			});

			it('works via Promise return value', function (finish) {
				this.timeout(6e4); // 60 sec

				const result = Ti.Geolocation.forwardGeocoder('440 N Bernardo Ave, Mountain View, CA 94043');
				should(result).be.a.Promise();
				result.then(data => {
					should(data).have.property('success').which.is.a.Boolean();
					should(data.success).be.eql(true);
					should(data).have.property('code').which.is.a.Number();
					should(data.code).be.eql(0);
					should(data.latitude).be.approximately(37.395, 0.02); // iOS: 37.38605, Windows: 37.3883645, Android: 37.3910366, new iOS: 37.4056
					should(data.longitude).be.approximately(-122.065, 0.02); // Windows: -122.0512682, iOS: -122.08385, Android: -122.
					return finish();
				}).catch(e => finish(e));
			});
		});

		it.ios('#requestTemporaryFullAccuracyAuthorization()', function (finish) {
			this.timeout(6e4); // 60 sec
			if (OS_VERSION_MAJOR < 14) {
				return finish();
			}

			should(Ti.Geolocation.requestTemporaryFullAccuracyAuthorization).be.a.Function();
			Ti.Geolocation.requestTemporaryFullAccuracyAuthorization('purposekey', function (e) {
				try {
					// It will always give error because 'purposekey' is not in tiapp.xml.
					should(e).have.property('success').which.is.a.Boolean();
					should(e.success).be.false();
					should(e).have.property('code').which.is.a.Number();
					should(e.code).be.eql(1);
					should(e).have.property('error').which.is.a.String();
					finish();
				} catch (err) {
					return finish(err);
				}
			});
		});

		// FIXME The address object is different from platform to platform! https://jira.appcelerator.org/browse/TIMOB-23496
		describe('#reverseGeocoder()', () => {
			it('is a Function', () => should(Ti.Geolocation.reverseGeocoder).be.a.Function());

			it('works via function callback', function (finish) {
				this.timeout(6e4); // 60 sec

				Ti.Geolocation.reverseGeocoder(37.3883645, -122.0512682, function (data) {
					try {
						should(data).have.property('success').which.is.a.Boolean();
						should(data.success).be.be.true();
						should(data).have.property('code').which.is.a.Number();
						should(data.code).be.eql(0);
						// FIXME error property is missing altogether on success for iOS...
						// should(data).have.property('error'); // undefined on success, holds error message as String otherwise.
						should(data).have.property('places').which.is.an.Array();

						should(data.places[0].postalCode).be.eql('94043');
						should(data.places[0]).have.property('latitude').which.is.a.Number();
						should(data.places[0]).have.property('longitude').which.is.a.Number();
						should(data.places[0].country).be.oneOf('USA', 'United States of America', 'United States');
						should(data.places[0].state).be.eql('California');
						should(data.places[0].countryCode).be.eql('US');
						should(data.places[0]).have.property('city').which.is.a.String();
						should(data.places[0]).have.property('address').which.is.a.String();
					} catch (err) {
						return finish(err);
					}
					finish();
				});
			});

			it('works via Promise return value', function (finish) {
				const result = Ti.Geolocation.reverseGeocoder(37.3883645, -122.0512682);
				should(result).be.a.Promise();
				result.then(data => {
					should(data).have.property('success').which.is.a.Boolean();
					should(data.success).be.eql(true);
					should(data).have.property('code').which.is.a.Number();
					should(data.code).be.eql(0);
					// FIXME error property is missing altogether on success for iOS...
					// should(data).have.property('error'); // undefined on success, holds error message as String otherwise.
					should(data).have.property('places').which.is.an.Array();

					should(data.places[0].postalCode).be.eql('94043');
					should(data.places[0]).have.property('latitude').which.is.a.Number();
					should(data.places[0]).have.property('longitude').which.is.a.Number();
					should(data.places[0].country).be.oneOf('USA', 'United States of America', 'United States');
					should(data.places[0].state).be.eql('California');
					should(data.places[0].countryCode).be.eql('US');
					should(data.places[0]).have.property('city').which.is.a.String();
					should(data.places[0]).have.property('address').which.is.a.String();
					return finish();
				}).catch(e => finish(e));
			});
		});
	});
});
