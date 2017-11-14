/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.Platform', function () {

	it('apiName', function () {
		should(Ti.Platform).have.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.Platform.apiName).be.eql('Ti.Platform');
	});

	// TODO: Expose on Android as well?
	it.androidMissing('canOpenURL()', function () {
		should(Ti.Platform.canOpenURL).be.a.Function; // Android gives undefined?
		should(Ti.Platform.canOpenURL('http://www.appcelerator.com/')).be.a.Boolean;
	});

	it('createUUID()', function () {
		var result;
		should(Ti.Platform.createUUID).be.a.Function;

		result = Ti.Platform.createUUID();
		should(result).be.a.String;
		should(result.length).eql(36);
		// Verify format using regexp!
		should(result.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)).not.eql(null);
		should(result.charAt(0)).not.eql('{');
		should(result.charAt(result.length - 1)).not.eql('}');
	});

	it('openURL()', function () {
		should(Ti.Platform.openURL).be.a.Function;
	});

	it('is24HourTimeFormat()', function () {
		should(Ti.Platform.is24HourTimeFormat).be.a.Function;
		should(Ti.Platform.is24HourTimeFormat()).be.Boolean;
	});

	it('BATTERY_STATE_CHARGING', function () {
		should(Ti.Platform).have.constant('BATTERY_STATE_CHARGING').which.is.a.Number;
	});

	it('BATTERY_STATE_FULL', function () {
		should(Ti.Platform).have.constant('BATTERY_STATE_FULL').which.is.a.Number;
	});

	it('BATTERY_STATE_UNKNOWN', function () {
		should(Ti.Platform).have.constant('BATTERY_STATE_UNKNOWN').which.is.a.Number;
	});

	it('BATTERY_STATE_UNPLUGGED', function () {
		should(Ti.Platform).have.constant('BATTERY_STATE_UNPLUGGED').which.is.a.Number;
	});

	// TODO Add tests for getters!
	it('address', function () {
		should(Ti.Platform).have.readOnlyProperty('address').which.is.a.String;
		// TODO Verify the format of the String. SHould be an IP address, so like: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
	});

	it('architecture', function () {
		should(Ti.Platform).have.readOnlyProperty('architecture').which.is.a.String;
	});

	it('availableMemory', function () {
		should(Ti.Platform).have.readOnlyProperty('availableMemory').which.is.a.Number;
	});

	it('batteryLevel', function () {
		// batteryLevel should be a number and only accessible from phone
		should(Ti.Platform).have.readOnlyProperty('batteryLevel').which.is.a.Number;
	});

	it('batteryMonitoring', function () {
		should(Ti.Platform.batteryMonitoring).be.Boolean;
		// Note: Windows 10 Mobile doesn't support battery monitoring
		if (utilities.isWindowsPhone() && !/^10\./.test(Ti.Platform.version)) {
			should(Ti.Platform.batteryMonitoring).be.eql(true);
		} else if (utilities.isWindowsDesktop()) {
			should(Ti.Platform.batteryMonitoring).be.eql(false);
		}
	});

	it('batteryState', function () {
		should(Ti.Platform).have.readOnlyProperty('batteryState').which.is.a.Number;
		// Must be one of the constant values
		[Ti.Platform.BATTERY_STATE_CHARGING,
			Ti.Platform.BATTERY_STATE_FULL,
			Ti.Platform.BATTERY_STATE_UNKNOWN,
			Ti.Platform.BATTERY_STATE_UNPLUGGED].indexOf(Ti.Platform.batteryState).should.not.eql(-1);
	});

	it('displayCaps', function () {
		should(Ti.Platform.displayCaps).be.an.Object;
		should(Ti.Platform.displayCaps).not.be.null;
		should(Ti.Platform.displayCaps.apiName).eql('Ti.Platform.DisplayCaps');
	});

	it('id', function () {
		should(Ti.Platform).have.readOnlyProperty('id').which.is.a.String;
		// TODO Verify format?!
	});

	it('locale', function () {
		should(Ti.Platform).have.readOnlyProperty('locale').which.is.a.String;
		// TODO Verify format of the string, i.e. 'en-US', 'en-GB' typically a 2-letter or two 2-letter segments combined with hyphen
	});

	it('macaddress', function () {
		should(Ti.Platform).have.readOnlyProperty('macaddress').which.is.a.String;
	});

	it('manufacturer', function () {
		should(Ti.Platform).have.readOnlyProperty('manufacturer').which.is.a.String;
	});

	it('model', function () {
		should(Ti.Platform).have.readOnlyProperty('model').which.is.a.String;
	});

	it('name', function () {
		should(Ti.Platform).have.readOnlyProperty('name').which.is.a.String;
		['android', 'iOS', 'windows', 'mobileweb'].indexOf(Ti.Platform.name).should.not.eql(-1);
		// TODO match with osname!
	});

	it('netmask', function () {
		should(Ti.Platform).have.readOnlyProperty('netmask').which.is.a.String;
		// TODO Verify format of string
	});

	it('osname', function () {
		should(Ti.Platform).have.readOnlyProperty('osname').which.is.a.String;
		// Must be one of the known platforms!
		['android', 'iphone', 'ipad', 'windowsphone', 'windowsstore', 'mobileweb'].indexOf(Ti.Platform.osname).should.not.eql(-1);
		// TODO match up Ti.Platform.name?
	});

	it('ostype', function () {
		should(Ti.Platform).have.readOnlyProperty('ostype').which.is.a.String;
		// Verify it's one of the known values
		['64bit', '32bit', 'unknown'].indexOf(Ti.Platform.ostype).should.not.eql(-1);
	});

	it('processorCount', function () {
		should(Ti.Platform).have.readOnlyProperty('processorCount').which.is.a.Number;
	});

	it('runtime', function () {
		if (utilities.isAndroid()) {
			should(Ti.Platform.runtime).eql('v8');
		} else if (utilities.isIOS() || utilities.isWindows()) {
			should(Ti.Platform.runtime).eql('javascriptcore');
		} else {
			should(Ti.Platform.runtime.length).be.greaterThan(0);
		}
		should(Ti.Platform).have.readOnlyProperty('runtime').which.is.a.String;
	});

	it('version', function () {
		should(Ti.Platform).have.readOnlyProperty('version').which.is.a.String;
	});

	it.ios('identifierForVendor', function () {
		should(Ti.Platform.identifierForVendor).be.a.String;
		should(Ti.Platform.getIdentifierForVendor).be.a.Function;
		should(Ti.Platform.identifierForVendor).eql(Ti.Platform.getIdentifierForVendor());
	});
	
	it.ios('identifierForAdvertising', function () {
		should(Ti.Platform.identifierForAdvertising).be.a.String;
		should(Ti.Platform.getIdentifierForAdvertising).be.a.Function;
		should(Ti.Platform.identifierForAdvertising).eql(Ti.Platform.getIdentifierForAdvertising());
	});

	it.ios('isAdvertisingTrackingEnabled', function () {
		should(Ti.Platform.isAdvertisingTrackingEnabled).be.a.Boolean;
	});
});
