/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-undef: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';

const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');
const IOS_SIM = OS_IOS && Ti.Platform.model.includes('(Simulator)');
const OS_MACOS = utilities.isMacOS();

describe('Titanium.Platform', () => {

	describe('properties', () => {
		describe('.address', () => {
			// may be undefined on ios sim!
			before(function () {
				if (IOS_SIM || OS_MACOS) {
					this.skip();
				}
			});

			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('address').which.is.a.String();
			});

			it('matches IP address format if defined', () => {
				should(Ti.Platform.address).match(/\d+\.\d+\.\d+\.\d+/);
				// TODO Verify the format of the String. Should be an IP address, so like: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
			});
		});

		describe('.apiName', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.Platform', () => {
				should(Ti.Platform.apiName).eql('Ti.Platform');
			});
		});

		describe('.architecture', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('architecture').which.is.a.String();
			});
		});

		describe('.availableMemory', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.readOnlyProperty('availableMemory').which.is.a.Number();
			});
		});

		describe('.batteryLevel', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.readOnlyProperty('batteryLevel').which.is.a.Number();
			});
		});

		describe('.batteryMonitoring', () => {
			it('is a Boolean', () => {
				should(Ti.Platform).have.a.property('batteryMonitoring').which.is.a.Boolean();
			});

			it('defaults to false', () => {
				should(Ti.Platform.batteryMonitoring).be.false();
			});
		});

		describe('.batteryState', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.readOnlyProperty('batteryState').which.is.a.Number();
			});

			it('is one of Ti.Platform.BATTERY_STATE_*', () => {
				should([
					Ti.Platform.BATTERY_STATE_CHARGING,
					Ti.Platform.BATTERY_STATE_FULL,
					Ti.Platform.BATTERY_STATE_UNKNOWN,
					Ti.Platform.BATTERY_STATE_UNPLUGGED,
				]).containEql(Ti.Platform.batteryState);
			});
		});

		describe('.displayCaps', () => {
			it('is a Titanium.Platform.DisplayCaps', () => {
				should(Ti.Platform).have.a.readOnlyProperty('displayCaps').which.is.an.Object();
				should(Ti.Platform.displayCaps).have.a.readOnlyProperty('apiName').which.eql('Ti.Platform.DisplayCaps');
			});
		});

		describe('.id', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('id').which.is.a.String();
			});

			it.ios('is a 36-character String matching guid format', () => {
				const platformId = Ti.Platform.id;
				should(platformId).be.a.String();
				should(platformId.length).eql(36);
				// Verify format using regexp!
				platformId.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
			});
		});

		describe.ios('.identifierForAdvertising', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.property('identifierForAdvertising').which.is.a.String();
			});
		});

		describe.ios('.identifierForVendor', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('identifierForVendor').which.is.a.String();
			});
		});

		describe.ios('.isAdvertisingTrackingEnabled', () => {
			it('is a Boolean', () => {
				should(Ti.Platform).have.a.readOnlyProperty('isAdvertisingTrackingEnabled').which.is.a.Boolean();
			});
		});

		describe('.locale', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('locale').which.is.a.String();
			});
		});

		describe('.macaddress', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('macaddress').which.is.a.String();
			});

			it.ios('returns a 36-character guid format String', () => {
				const macaddress = Ti.Platform.macaddress;
				should(macaddress).be.a.String();
				should(macaddress.length).eql(36);
				// Verify format using regexp!
				macaddress.should.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
			});
		});

		describe('.manufacturer', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('manufacturer').which.is.a.String();
			});
		});

		describe('.model', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('model').which.is.a.String();
			});
		});

		describe('.name', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('name').which.is.a.String();
			});

			it('is one of known constant String values', () => {
				should(Ti.Platform.name).be.equalOneOf([ 'android', 'iOS', 'windows', 'mobileweb', 'Mac OS X', 'iPadOS' ]);
				// TODO match with osname!
			});
		});

		describe('.netmask', () => {
			// may be undefined on ios sim!
			before(function () {
				if (IOS_SIM || OS_MACOS) {
					this.skip();
				}
			});

			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('netmask').which.is.a.String();
			});

			it('matches IP address format if defined', () => {
				should(Ti.Platform.netmask).match(/\d+\.\d+\.\d+\.\d+/);
			});
		});

		describe('.osname', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('osname').which.is.a.String();
			});

			it('is one of known constant String values', () => {
				should(Ti.Platform.osname).be.equalOneOf([ 'android', 'iphone', 'ipad', 'windowsphone', 'windowsstore', 'mobileweb' ]);
				// TODO match up Ti.Platform.name?
			});
		});

		describe('.ostype', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('ostype').which.is.a.String();
			});

			it('is one of known String constant values', () => {
				// Verify it's one of the known values
				should(Ti.Platform.ostype).be.equalOneOf([ '64bit', '32bit', 'unknown' ]);
			});
		});

		describe('.processorCount', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.readOnlyProperty('processorCount').which.is.a.Number();
			});
		});

		describe('.runtime', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('runtime').which.is.a.String();
			});

			it('is one of known conatant String values', () => {
				if (OS_ANDROID) {
					should(Ti.Platform.runtime).eql('v8');
				} else {
					should(Ti.Platform.runtime).eql('javascriptcore');
				}
			});
		});

		describe('.totalMemory', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.readOnlyProperty('totalMemory').which.is.a.Number();
			});
		});

		describe('.uptime', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.readOnlyProperty('uptime').which.is.a.Number();
			});
		});

		describe('.username', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('username').which.is.a.String();
			});
		});

		describe('.version', () => {
			it('is a String', () => {
				should(Ti.Platform).have.a.readOnlyProperty('version').which.is.a.String();
			});
		});

		describe('.versionMajor', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.readOnlyProperty('versionMajor').which.is.a.Number();
			});

			it('equals OS_VERSION_MAJOR value', () => {
				should(Ti.Platform.versionMajor).be.eql(OS_VERSION_MAJOR);
			});

			it('equals first segment of Ti.Platform.version as Integer', () => {
				should(Ti.Platform.versionMajor).be.eql(parseInt(Ti.Platform.version.split('.')[0]));
			});
		});

		describe('.versionMinor', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.readOnlyProperty('versionMinor').which.is.a.Number();
			});

			it('equals OS_VERSION_MINOR value', () => {
				should(Ti.Platform.versionMinor).be.eql(OS_VERSION_MINOR);
			});

			it('equals second segment of Ti.Platform.version as Integer', () => {
				const versionComponents = Ti.Platform.version.split('.');
				const versionMinor = (versionComponents.length >= 2) ? parseInt(versionComponents[1]) : 0;
				should(Ti.Platform.versionMinor).be.eql(versionMinor);
			});
		});

		describe('.versionPatch', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.readOnlyProperty('versionPatch').which.is.a.Number();
			});

			it('equals OS_VERSION_PATCH value', () => {
				should(Ti.Platform.versionPatch).be.eql(OS_VERSION_PATCH);
			});

			it('equals third segment of Ti.Platform.version as Integer', () => {
				const versionComponents = Ti.Platform.version.split('.');
				const versionPatch = (versionComponents.length >= 3) ? parseInt(versionComponents[2]) : 0;
				should(Ti.Platform.versionPatch).be.eql(versionPatch);
			});
		});

	});

	describe('methods', () => {
		describe('#canOpenURL()', () => {
			it('is a Function', () => {
				should(Ti.Platform.canOpenURL).be.a.Function();
			});

			it('returns true for typical http URL', () => {
				should(Ti.Platform.canOpenURL('http://www.google.com/')).be.true();
			});

			it('returns true for app-sepcific URI scheme', () => {
				should(Ti.Platform.canOpenURL('mocha://')).be.true();
			});
		});

		describe.android('#cpus()', () => {
			it('is a Function', () => {
				should(Ti.Platform.cpus).be.a.Function();
			});
		});

		describe('#createUUID()', () => {
			it('is a Function', () => {
				should(Ti.Platform.createUUID).be.a.Function();
			});

			it('returns a 36-character String matching guid format', () => {
				const result = Ti.Platform.createUUID();
				should(result).be.a.String();
				should(result.length).eql(36);
				// Verify format using regexp!
				should(result.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)).not.eql(null);
				should(result.charAt(0)).not.eql('{');
				should(result.charAt(result.length - 1)).not.eql('}');
			});
		});

		describe('#is24HourTimeFormat()', () => {
			it('is a Function', () => {
				should(Ti.Platform.is24HourTimeFormat).be.a.Function();
			});

			it('returns a Boolean', () => {
				should(Ti.Platform.is24HourTimeFormat()).be.a.Boolean();
			});
		});

		describe('#openURL', () => {
			it('is a Function', () => {
				should(Ti.Platform.openURL).be.a.Function();
			});

			// Checks if openURL() successfully opened this app with its own "mocha://" custom URL scheme.
			function handleUrl(url, finish) {
				if (OS_ANDROID) {
					Ti.Android.rootActivity.addEventListener('newintent', function listener(e) {
						try {
							Ti.Android.rootActivity.removeEventListener('newintent', listener);
							should(e.intent.data).be.eql(url);
						} catch (err) {
							return finish(err);
						}
						finish();
					});
				} else if (OS_IOS) {
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

			it('(url)', finish => {
				const url = 'mocha://test1';
				handleUrl(url, finish);
				should(Ti.Platform.openURL).be.a.Function();
				const wasOpened = Ti.Platform.openURL(url);
				if (OS_IOS) {
					should(wasOpened).be.a.Boolean();
				} else {
					should(wasOpened).be.true();
				}
			});

			it('(url, callback)', finish => {
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
				if (OS_IOS) {
					should(wasOpened).be.a.Boolean;
				} else {
					should(wasOpened).be.true();
				}
			});

			it('(url, options, callback)', finish => {
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
				if (OS_IOS) {
					should(wasOpened).be.a.Boolean;
				} else {
					should(wasOpened).be.true();
				}
			});

			// FIXME: macOS pops dialogs about no application set to open this url scheme
			it.ios('(url, callback) with unhandled scheme passes Error to callback', finish => {
				Ti.Platform.openURL('randomapp://', _e => finish());
			});

			it.ios('#openURL(url, options, callback) with unhandled scheme passes Error to callback', finish => {
				Ti.Platform.openURL('randomapp://', {}, _e => finish());
			});
		});
	});

	describe('constants', () => {
		describe('.BATTERY_STATE_CHARGING', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.constant('BATTERY_STATE_CHARGING').which.is.a.Number();
			});
		});

		describe('.BATTERY_STATE_FULL', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.constant('BATTERY_STATE_FULL').which.is.a.Number();
			});
		});

		describe('.BATTERY_STATE_UNKNOWN', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.constant('BATTERY_STATE_UNKNOWN').which.is.a.Number();
			});
		});

		describe('.BATTERY_STATE_UNPLUGGED', () => {
			it('is a Number', () => {
				should(Ti.Platform).have.a.constant('BATTERY_STATE_UNPLUGGED').which.is.a.Number();
			});
		});

	});
});
