/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID, OS_IOS, OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');
const isMacOS = utilities.isMacOS();
const isIOSDevice = OS_IOS && !isMacOS && !Ti.Platform.model.includes('(Simulator)');

// What permission should we check/ask for in tests?
const permission = Ti.Geolocation.AUTHORIZATION_ALWAYS;

describe('Titanium.Geolocation', () => {
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

		describe('.accuracy', () => {
			it.androidBroken('is a Number', () => { // FIXME: defaults to undefined!
				should(Ti.Geolocation).have.a.property('accuracy').which.is.a.Number();
			});

			it('can be assigned value', () => {
				Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
				should(Ti.Geolocation.accuracy).eql(Ti.Geolocation.ACCURACY_HIGH);
			});

			it('has no accessors', () => {
				should(Ti.Geolocation).not.have.accessors('accuracy');
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

			it('has no accessors', () => {
				should(Ti.Geolocation).not.have.accessors('activityType');
			});
		});

		describe.ios('.allowsBackgroundLocationUpdates', () => {
			after(() => Ti.Geolocation.allowsBackgroundLocationUpdates = false);

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

			it('has no accessors', () => {
				should(Ti.Geolocation).not.have.accessors('allowsBackgroundLocationUpdates');
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

			it('has no accessors', () => {
				should(Ti.Geolocation).not.have.accessors('distanceFilter');
			});
		});

		describe.ios('.hasCompass', () => {
			it('is a Boolean', () => {
				should(Ti.Geolocation).have.a.property('hasCompass').which.is.a.Boolean();
			});

			it('has no getter', () => {
				should(Ti.Geolocation).not.have.a.getter('hasCompass');
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

			it('has no accessors', () => {
				should(Ti.Geolocation).not.have.accessors('headingFilter');
			});
		});

		describe('.lastGeolocation', () => {
			// https://jira-archive.titaniumsdk.com/TIMOB-26452
			it.iosBroken('is a property', () => {
				should(Ti.Geolocation).have.a.property('lastGeolocation'); // TODO: which is a String/null/undefined?
			});

			it('has no getter', () => {
				should(Ti.Geolocation).not.have.a.getter('lastGeolocation');
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
				should(Ti.Geolocation).not.have.a.getter('locationServicesAuthorization');
			});
		});

		describe('.locationServicesEnabled', () => {
			it('is a Boolean', () => {
				should(Ti.Geolocation).have.a.property('locationServicesEnabled').which.is.a.Boolean();
			});

			it('has no getter', () => {
				should(Ti.Geolocation).not.have.a.getter('locationServicesEnabled');
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

			it('has no accessors', () => {
				should(Ti.Geolocation).not.have.accessors('pauseLocationUpdateAutomatically');
			});
		});

		describe.ios('.showBackgroundLocationIndicator', () => {
			before(function () {
				if (isMacOS) {
					this.skip();
				}
			});

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

			it('has no accessors', () => {
				should(Ti.Geolocation).not.have.accessors('showBackgroundLocationIndicator');
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

			it('has no accessors', () => {
				should(Ti.Geolocation).not.have.accessors('showCalibration');
			});
		});

		describe.ios('.trackSignificantLocationChange', () => {
			// reset to false at end
			after(() => Ti.Geolocation.trackSignificantLocationChange = false);

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

			it('has no accessors', () => {
				should(Ti.Geolocation).not.have.accessors('trackSignificantLocationChange');
			});
		});
	});

	describe('methods', () => {
		describe('#hasLocationPermissions()', () => {
			it('is a Function', () => {
				should(Ti.Geolocation).have.a.property('hasLocationPermissions').which.is.a.Function();
			});

			it('returns a Boolean', () => {
				should(Ti.Geolocation.hasLocationPermissions()).be.a.Boolean();
			});
		});

		describe('#requestLocationPermissions()', () => {
			it('is a Function', () => {
				should(Ti.Geolocation).have.a.property('requestLocationPermissions').which.is.a.Function();
			});

			it('works via callback argument', function (finish) {
				this.timeout(1e4); // 10 sec

				// can't get permissions on macOS or actual iOS devices, since it prompts
				if ((isMacOS || isIOSDevice) && !Ti.Geolocation.hasLocationPermissions(permission)) {
					return finish(); // FIXME: How can we limit to ios only, and skip on macos?
				}

				Ti.Geolocation.requestLocationPermissions(permission, function (e) {
					try {
						should(e).have.a.property('success').which.is.a.Boolean();
						should(e).have.a.property('code').which.is.a.Number();
						if (!e.success) {
							should(e).have.a.property('error').which.is.a.String();
							should(e).have.a.property('code').which.is.not.eql(0);
						} else {
							should(e.code).eql(0);
						}
					} catch (err) {
						return finish(err);
					}
					finish();
				});
			});

			it('works via Promise return value', function (finish) {
				this.timeout(1e4); // 10 sec

				// can't get permissions on macOS or actual iOS devices, since it prompts
				if ((isMacOS || isIOSDevice) && !Ti.Geolocation.hasLocationPermissions(permission)) {
					return finish(); // FIXME: How can we limit to ios only, and skip on macos?
				}

				const result = Ti.Geolocation.requestLocationPermissions(permission);
				result.should.be.a.Promise();
				// just ensure it resolves/rejects?
				result.then(() => finish()).catch(() => finish());
			});
		});

		describe('#getCurrentHeading()', () => {
			it('is a Function', () => {
				should(Ti.Geolocation).have.a.property('getCurrentHeading').which.is.a.Function();
			});

			it('works via callback argument', function (finish) {
				this.timeout(6e4); // 60 sec

				// can't get permissions on macOS or actual iOS devices, since it prompts
				if ((isMacOS || isIOSDevice) && !Ti.Geolocation.hasLocationPermissions(permission)) {
					return finish(); // FIXME: How can we limit to ios only, and skip on macos?
				}

				function testCurrentHeading() {
					Ti.Geolocation.getCurrentHeading(function (data) {
						try {
							if (Ti.Geolocation.hasCompass) {
								should(data).have.property('success').which.is.true();
								should(data).have.property('code').which.eql(0);
								should(data.heading).be.an.Object();
								should(data.heading).have.a.property('magneticHeading').which.is.a.Number();
								should(data.heading).have.a.property('accuracy').which.is.a.Number();
							} else {
								should(data).have.property('success').which.is.false();
								should(data).have.property('code').which.eql(1);
								should(data.error).be.a.String(); // Do we want to verify what it says?
							}
						} catch (err) {
							return finish(err);
						}
						finish();
					});
				}

				// TODO: Do we need location permissions on Android for heading data?
				if (!Ti.Geolocation.hasLocationPermissions(permission)) {
					Ti.Geolocation.requestLocationPermissions(permission, function (e) {
						if (!e.success) {
							return finish(new Error('Failed to get Geolocation ALWAYS permission: ' + e.error));
						}
						testCurrentHeading();
					});
				} else {
					testCurrentHeading();
				}
			});

			it('works via Promise return value', function (finish) {
				this.timeout(6e4); // 60 sec

				// can't get permissions on macOS or actual iOS devices, since it prompts
				if ((isMacOS || isIOSDevice) && !Ti.Geolocation.hasLocationPermissions(permission)) {
					return finish(); // FIXME: How can we limit to ios only, and skip on macos?
				}

				function testCurrentHeading() {
					const result = Ti.Geolocation.getCurrentHeading();
					try {
						result.should.be.a.Promise();
					} catch (err) {
						return finish(err);
					}
					if (Ti.Geolocation.hasCompass) {
						result.then(data => {
							should(data).have.property('success').which.is.true();
							should(data).have.property('code').which.eql(0);
							should(data.heading).be.an.Object();
							should(data.heading).have.a.property('magneticHeading').which.is.a.Number();
							should(data.heading).have.a.property('accuracy').which.is.a.Number();
							return finish();
						}).catch(e => finish(e));
					} else {
						// expect to fail if no compass!
						result.then(() => finish(new Error('Expected to fail getCurrentHeading() with no compass support!'))).catch(_e => finish());
					}
				}

				// TODO: Do we need location permissions on Android for heading data?
				if (!Ti.Geolocation.hasLocationPermissions(permission)) {
					Ti.Geolocation.requestLocationPermissions(permission, function (e) {
						if (!e.success) {
							return finish(new Error('Failed to get Geolocation ALWAYS permission: ' + e.error));
						}
						testCurrentHeading();
					});
				} else {
					testCurrentHeading();
				}
			});
		});

		describe('#getCurrentPosition()', () => {
			it('is a Function', () => {
				should(Ti.Geolocation).have.a.property('getCurrentPosition').which.is.a.Function();
			});

			it('works via callback argument', function (finish) {
				this.timeout(6e4); // 60 sec

				// can't get permissions on macOS or actual iOS devices, since it prompts
				if ((isMacOS || isIOSDevice) && !Ti.Geolocation.hasLocationPermissions(permission)) {
					return finish(); // FIXME: How can we limit to ios only, and skip on macos?
				}

				Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;

				function testCurrentPosition() {
					Ti.Geolocation.getCurrentPosition(function (data) {
						try {
							should(data).have.property('success').which.is.a.Boolean();
							if (OS_ANDROID && !data.success) {
								// Sometimes fails on Android device/emulator with network/passive/gps is unavailable
								should(data).have.property('code').which.is.not.eql(0);
								should(data).have.property('error').which.match(/^\w+ is unavailable$/);
							} else {
								should(data).have.property('code').which.eql(0);
								should(data.coords).be.an.Object();
								should(data.coords).have.a.property('latitude').which.is.a.Number();
								should(data.coords).have.a.property('longitude').which.is.a.Number();
								should(data.coords).have.a.property('altitude').which.is.a.Number();
								should(data.coords).have.a.property('accuracy').which.is.a.Number();
								should(data.coords).have.a.property('heading').which.is.a.Number();
								should(data.coords).have.a.property('speed').which.is.a.Number();
								should(data.coords).have.a.property('timestamp').which.is.a.Number();
							}
						} catch (err) {
							return finish(err);
						}
						finish();
					});
				}

				if (!Ti.Geolocation.hasLocationPermissions(permission)) {
					Ti.Geolocation.requestLocationPermissions(permission, function (e) {
						if (!e.success) {
							return finish(new Error('Failed to get Geolocation ALWAYS permission: ' + e.error));
						}
						testCurrentPosition();
					});
				} else {
					testCurrentPosition();
				}
			});

			it('works via Promise return value', function (finish) {
				this.timeout(6e4); // 60 sec

				// can't get permissions on macOS or actual iOS devices, since it prompts
				if ((isMacOS || isIOSDevice) && !Ti.Geolocation.hasLocationPermissions(permission)) {
					return finish(); // FIXME: How can we limit to ios only, and skip on macos?
				}

				Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;

				function testCurrentPosition() {
					const result = Ti.Geolocation.getCurrentPosition();
					try {
						result.should.be.a.Promise();
					} catch (err) {
						return finish(err);
					}
					result.then(data => {
						try {
							should(data).have.property('success').which.is.true();
							should(data).have.property('code').which.eql(0);
							should(data.coords).be.an.Object();
							should(data.coords).have.a.property('latitude').which.is.a.Number();
							should(data.coords).have.a.property('longitude').which.is.a.Number();
							should(data.coords).have.a.property('altitude').which.is.a.Number();
							should(data.coords).have.a.property('accuracy').which.is.a.Number();
							should(data.coords).have.a.property('heading').which.is.a.Number();
							should(data.coords).have.a.property('speed').which.is.a.Number();
							should(data.coords).have.a.property('timestamp').which.is.a.Number();
						} catch (err) {
							return finish(err);
						}
						return finish();
					}).catch(e => {
						// Sometimes fails on Android device/emulator w/ 'passive/gps/network is unavailable'
						if (OS_ANDROID) {
							try {
								e.should.have.property('message').which.is.a.String();
								e.message.should.match(/^\w+ is unavailable$/);
							} catch (err) {
								return finish(err);
							}
							return finish();
						}

						finish(e);
					});
				}

				if (!Ti.Geolocation.hasLocationPermissions(permission)) {
					Ti.Geolocation.requestLocationPermissions(permission, function (e) {
						if (!e.success) {
							return finish(new Error('Failed to get Geolocation ALWAYS permission: ' + e.error));
						}
						testCurrentPosition();
					});
				} else {
					testCurrentPosition();
				}
			});
		});

		describe('#forwardGeocoder()', () => {
			it('is a Function', () => should(Ti.Geolocation.forwardGeocoder).be.a.Function());
			/*
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
				result.should.be.a.Promise();
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
			*/
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
						should(data.places[0].state).be.oneOf('California', 'CA');
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
				result.should.be.a.Promise();
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
					should(data.places[0].state).be.oneOf('California', 'CA');
					should(data.places[0].countryCode).be.eql('US');
					should(data.places[0]).have.property('city').which.is.a.String();
					should(data.places[0]).have.property('address').which.is.a.String();
					return finish();
				}).catch(e => finish(e));
			});
		});
	});
});
