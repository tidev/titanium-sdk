/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_VERSION_MAJOR, OS_VERSION_MINOR, OS_IOS */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

describe('Titanium.Platform', function () {

	it('apiName', () => {
		should(Ti.Platform).have.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.Platform.apiName).be.eql('Ti.Platform');
	});

	it('canOpenURL()', () => {
		should(Ti.Platform.canOpenURL).be.a.Function();
		should(Ti.Platform.canOpenURL('http://www.appcelerator.com/')).be.true();
		should(Ti.Platform.canOpenURL('mocha://')).be.true();
	});

	it('#createUUID()', () => {
		should(Ti.Platform.createUUID).be.a.Function();

		const result = Ti.Platform.createUUID();
		should(result).be.a.String();
		should(result.length).eql(36);
		// Verify format using regexp!
		should(result.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)).not.eql(null);
		should(result.charAt(0)).not.eql('{');
		should(result.charAt(result.length - 1)).not.eql('}');
	});

	describe('#openURL', () => {
		// Checks if openURL() successfully opened this app with its own "mocha://" custom URL scheme.
		function handleUrl(url, finish) {
			if (utilities.isAndroid()) {
				Ti.Android.rootActivity.addEventListener('newintent', function listener(e) {
					try {
						Ti.Android.rootActivity.removeEventListener('newintent', listener);
						should(e.intent.data).be.eql(url);
					} catch (err) {
						return finish(err);
					}
					finish();
				});
			} else if (utilities.isIOS()) {
				Ti.App.iOS.addEventListener('handleurl', function listener(e) {
					try {
						Ti.App.iOS.removeEventListener('handleurl', listener);
						should(e.launchOptions.url).be.eql(url);
					} catch (err) {
						return finish(err);
					}
					finish();
				});
			} else {
				finish(new Error('This test is not supported on this platform.'));
			}
		}

		it('(url)', (finish) => {
			const url = 'mocha://test1';
			handleUrl(url, finish);
			should(Ti.Platform.openURL).be.a.Function();
			const wasOpened = Ti.Platform.openURL(url);
			if (utilities.isIOS()) {
				should(wasOpened).be.a.Boolean();
			} else {
				should(wasOpened).be.true();
			}
		});

		it('(url, callback)', (finish) => {
			const url = 'mocha://test2';
			let wasCallbackInvoked = false;
			let wasUrlReceived = false;

			handleUrl(url, (err) => {
				wasUrlReceived = true;
				if (err) {
					return finish(err);
				}
				if (wasCallbackInvoked) {
					finish();
				}
			});
			const wasOpened = Ti.Platform.openURL(url, (e) => {
				try {
					wasCallbackInvoked = true;
					should(e.success).be.true();
				} catch (err) {
					return finish(err);
				}
				if (wasUrlReceived) {
					finish();
				}
			});
			if (utilities.isIOS()) {
				should(wasOpened).be.a.Boolean;
			} else {
				should(wasOpened).be.true();
			}
		});

		it('(url, options, callback)', (finish) => {
			const url = 'mocha://test3';
			let wasCallbackInvoked = false;
			let wasUrlReceived = false;

			handleUrl(url, (err) => {
				wasUrlReceived = true;
				if (err) {
					return finish(err);
				}
				if (wasCallbackInvoked) {
					finish();
				}
			});
			const options = {
				UIApplicationOpenURLOptionsOpenInPlaceKey: true
			};
			const wasOpened = Ti.Platform.openURL(url, options, (e) => {
				try {
					wasCallbackInvoked = true;
					should(e.success).be.true();
				} catch (err) {
					return finish(err);
				}
				if (wasUrlReceived) {
					finish();
				}
			});
			if (utilities.isIOS()) {
				should(wasOpened).be.a.Boolean;
			} else {
				should(wasOpened).be.be.true();
			}
		});
	});

	it('#is24HourTimeFormat()', () => {
		should(Ti.Platform.is24HourTimeFormat).be.a.Function();
		should(Ti.Platform.is24HourTimeFormat()).be.a.Boolean();
	});

	it('.BATTERY_STATE_CHARGING', () => {
		should(Ti.Platform).have.constant('BATTERY_STATE_CHARGING').which.is.a.Number();
	});

	it('.BATTERY_STATE_FULL', () => {
		should(Ti.Platform).have.constant('BATTERY_STATE_FULL').which.is.a.Number();
	});

	it('.BATTERY_STATE_UNKNOWN', () => {
		should(Ti.Platform).have.constant('BATTERY_STATE_UNKNOWN').which.is.a.Number();
	});

	it('.BATTERY_STATE_UNPLUGGED', () => {
		should(Ti.Platform).have.constant('BATTERY_STATE_UNPLUGGED').which.is.a.Number();
	});

	// TODO Add tests for getters!
	it('.address', () => {
		should(Ti.Platform).have.readOnlyProperty('address');
		if (Ti.Platform.address) { // we typically get undefined on iOS sim
			should(Ti.Platform.address).match(/\d+\.\d+\.\d+\.\d+/);
		}
		// TODO Verify the format of the String. Should be an IP address, so like: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
	});

	it('.architecture', () => {
		should(Ti.Platform).have.readOnlyProperty('architecture').which.is.a.String();
	});

	it('.availableMemory', () => {
		should(Ti.Platform).have.readOnlyProperty('availableMemory').which.is.a.Number();
	});

	it('.batteryLevel', () => {
		// batteryLevel should be a number and only accessible from phone
		should(Ti.Platform).have.readOnlyProperty('batteryLevel').which.is.a.Number();
	});

	it('.batteryMonitoring', () => {
		should(Ti.Platform.batteryMonitoring).be.a.Boolean();
		// Note: Windows 10 Mobile doesn't support battery monitoring
		if (utilities.isWindowsPhone() && !/^10\./.test(Ti.Platform.version)) {
			should(Ti.Platform.batteryMonitoring).be.true();
		} else if (utilities.isWindowsDesktop()) {
			should(Ti.Platform.batteryMonitoring).be.false();
		}
	});

	it('.batteryState', () => {
		should(Ti.Platform).have.readOnlyProperty('batteryState').which.is.a.Number();
		// Must be one of the constant values
		should(Ti.Platform.batteryState).be.equalOneOf([
			Ti.Platform.BATTERY_STATE_CHARGING,
			Ti.Platform.BATTERY_STATE_FULL,
			Ti.Platform.BATTERY_STATE_UNKNOWN,
			Ti.Platform.BATTERY_STATE_UNPLUGGED ]);
	});

	it('.displayCaps', () => {
		should(Ti.Platform.displayCaps).be.an.Object();
		should(Ti.Platform.displayCaps).not.be.null();
		should(Ti.Platform.displayCaps.apiName).eql('Ti.Platform.DisplayCaps');
	});

	it('.id', () => {
		should(Ti.Platform).have.readOnlyProperty('id').which.is.a.String();
		if (OS_IOS) {
			const platformId = Ti.Platform.id;
			should(platformId).be.a.String();
			should(platformId.length).eql(36);
			// Verify format using regexp!
			platformId.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		}
	});

	it('.locale', () => {
		should(Ti.Platform).have.readOnlyProperty('locale').which.is.a.String();
		// TODO Verify format of the string, i.e. 'en-US', 'en-GB' typically a 2-letter or two 2-letter segments combined with hyphen
	});

	it('.macaddress', () => {
		should(Ti.Platform).have.readOnlyProperty('macaddress').which.is.a.String();
		if (OS_IOS) {
			const macaddress = Ti.Platform.macaddress;
			should(macaddress).be.a.String();
			should(macaddress.length).eql(36);
			// Verify format using regexp!
			macaddress.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		}
	});

	it('.manufacturer', () => {
		should(Ti.Platform).have.readOnlyProperty('manufacturer').which.is.a.String();
	});

	it('.model', () => {
		should(Ti.Platform).have.readOnlyProperty('model').which.is.a.String();
	});

	it('.name', () => {
		should(Ti.Platform).have.readOnlyProperty('name').which.is.a.String();
		should(Ti.Platform.name).be.equalOneOf([ 'android', 'iOS', 'windows', 'mobileweb' ]);
		// TODO match with osname!
	});

	it('.netmask', () => {
		should(Ti.Platform).have.readOnlyProperty('netmask');
		if (Ti.Platform.netmask) { // undefined on iOS sim
			should(Ti.Platform.netmask).match(/\d+\.\d+\.\d+\.\d+/);
		}
	});

	it('.osname', () => {
		should(Ti.Platform).have.readOnlyProperty('osname').which.is.a.String();
		// Must be one of the known platforms!
		should(Ti.Platform.osname).be.equalOneOf([ 'android', 'iphone', 'ipad', 'windowsphone', 'windowsstore', 'mobileweb' ]);
		// TODO match up Ti.Platform.name?
	});

	it('.ostype', () => {
		should(Ti.Platform).have.readOnlyProperty('ostype').which.is.a.String();
		// Verify it's one of the known values
		should(Ti.Platform.ostype).be.equalOneOf([ '64bit', '32bit', 'unknown' ]);
	});

	it('.processorCount', () => {
		should(Ti.Platform).have.readOnlyProperty('processorCount').which.is.a.Number();
	});

	it('.runtime', () => {
		should(Ti.Platform).have.readOnlyProperty('runtime').which.is.a.String();
		if (utilities.isAndroid()) {
			should(Ti.Platform.runtime).eql('v8');
		} else if (utilities.isIOS() || utilities.isWindows()) {
			should(Ti.Platform.runtime).eql('javascriptcore');
		} else {
			should(Ti.Platform.runtime.length).be.greaterThan(0);
		}
	});

	it('.version', () => {
		should(Ti.Platform).have.readOnlyProperty('version').which.is.a.String();
	});

	it('.versionMajor', () => {
		should(Ti.Platform).have.readOnlyProperty('versionMajor').which.is.a.Number();
		should(Ti.Platform.versionMajor).be.eql(OS_VERSION_MAJOR);
		should(Ti.Platform.versionMajor).be.eql(parseInt(Ti.Platform.version.split('.')[0]));
	});

	it('.versionMinor', () => {
		should(Ti.Platform).have.readOnlyProperty('versionMinor').which.is.a.Number();
		should(Ti.Platform.versionMinor).be.eql(OS_VERSION_MINOR);

		const versionComponents = Ti.Platform.version.split('.');
		const versionMinor = (versionComponents.length >= 2) ? parseInt(versionComponents[1]) : 0;
		should(Ti.Platform.versionMinor).be.eql(versionMinor);
	});

	it.ios('.identifierForVendor', () => {
		should(Ti.Platform.identifierForVendor).be.a.String();
		should(Ti.Platform.getIdentifierForVendor).be.a.Function();
		should(Ti.Platform.identifierForVendor).eql(Ti.Platform.getIdentifierForVendor());
	});

	it.ios('.identifierForAdvertising', () => {
		should(Ti.Platform.identifierForAdvertising).be.a.String();
		should(Ti.Platform.getIdentifierForAdvertising).be.a.Function();
		should(Ti.Platform.identifierForAdvertising).eql(Ti.Platform.getIdentifierForAdvertising());
	});

	it.ios('.isAdvertisingTrackingEnabled', () => {
		should(Ti.Platform.isAdvertisingTrackingEnabled).be.a.Boolean();
	});

	it.ios('#openURL(url, callback)', function (finish) {
		Ti.Platform.openURL('randomapp://', _e => finish());
	});

	it.ios('#openURL(url, options, callback)', function (finish) {
		Ti.Platform.openURL('randomapp://', {}, _e => finish());
	});
});
