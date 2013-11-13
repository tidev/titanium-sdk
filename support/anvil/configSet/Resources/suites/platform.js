/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "platform";
	this.tests = [
		{name: "apiPoints"},
		{name: "displayCaps_platformHeight"},
		{name: "platform_id_A"},
		{name: "platform_id_B"},
		{name: "platform_Android_API_LEVEL"},
		{name: "displayCaps_platformWidth"},
		{name: "physicalSizeCategory"},
		{name: "platform_manufacturer"}
	]

	this.apiPoints = function(testRun) {
		valueOf(testRun, Ti.Platform.createUUID).shouldBeFunction();
		valueOf(testRun, Ti.Platform.openURL).shouldBeFunction();
		valueOf(testRun, Ti.Platform.is24HourTimeFormat).shouldBeFunction();
		valueOf(testRun, Ti.Platform.is24HourTimeFormat()).shouldBeBoolean();
    	valueOf(testRun, Ti.Platform.BATTERY_STATE_CHARGING).shouldBeNumber();
    	valueOf(testRun, Ti.Platform.BATTERY_STATE_FULL).shouldBeNumber();
    	valueOf(testRun, Ti.Platform.BATTERY_STATE_UNKNOWN).shouldBeNumber();
    	valueOf(testRun, Ti.Platform.BATTERY_STATE_UNPLUGGED).shouldBeNumber();
    	valueOf(testRun, Ti.Platform.address).shouldBeString();
		valueOf(testRun, Ti.Platform.architecture).shouldBeString();
    	valueOf(testRun, Ti.Platform.availableMemory).shouldBeNumber();
    	valueOf(testRun, Ti.Platform.batteryMonitoring).shouldBeBoolean();
    	valueOf(testRun, Ti.Platform.displayCaps).shouldBeObject();
    	valueOf(testRun, Ti.Platform.displayCaps).shouldNotBeNull();
    	valueOf(testRun, Ti.Platform.displayCaps.dpi).shouldBeNumber();
    	valueOf(testRun, Ti.Platform.displayCaps.density).shouldBeString();
    	valueOf(testRun, Ti.Platform.displayCaps.platformHeight).shouldBeNumber();
    	valueOf(testRun, Ti.Platform.displayCaps.platformWidth).shouldBeNumber();
    	valueOf(testRun, Ti.Platform.id).shouldBeString();
    	valueOf(testRun, Ti.Platform.locale).shouldBeString();
    	valueOf(testRun, Ti.Platform.macaddress).shouldBeString();
    	valueOf(testRun, Ti.Platform.model).shouldBeString();
    	valueOf(testRun, Ti.Platform.name).shouldBeString();
    	valueOf(testRun, Ti.Platform.netmask).shouldBeString();
    	valueOf(testRun, Ti.Platform.osname).shouldBeString();
    	valueOf(testRun, Ti.Platform.ostype).shouldBeString();
    	valueOf(testRun, Ti.Platform.processorCount).shouldBeNumber();
    	valueOf(testRun, Ti.Platform.version).shouldBeString();
    	valueOf(testRun, Ti.Platform.runtime).shouldBeString();
    	if (Ti.Platform.osname === 'android') {
    		valueOf(testRun, Ti.Platform.runtime === 'rhino' || Ti.Platform.runtime === 'v8').shouldBeTrue();
    	} else if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
        	valueOf(testRun, Ti.Platform.runtime).shouldBe("javascriptcore");
    	} else {
        	valueOf(testRun, Ti.Platform.runtime.length).shouldBeGreaterThan(0);
    	}

		finish(testRun);
	}

	//TIMOB-2475
	this.displayCaps_platformHeight = function(testRun) {
		valueOf(testRun, Titanium.Platform.displayCaps.platformHeight).shouldNotBeUndefined();
		
		finish(testRun);
	}

	//TIMOB-5752 
	var platform_id;

	this.platform_id_A = function(testRun) {
		platform_id=Ti.Platform.id;
		valueOf(testRun, platform_id).shouldNotBeNull();
		
		finish(testRun);
	}

	this.platform_id_B = function(testRun) {
		valueOf(testRun, Ti.Platform.id).shouldBe(platform_id);
		
		finish(testRun);
	}

	//TIMOB-7242
	this.platform_Android_API_LEVEL = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			valueOf(testRun, Ti.Platform.Android.API_LEVEL).shouldBeNumber();
		}
		finish(testRun);
	}

	//TIMOB-7917
	this.displayCaps_platformWidth = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			var result=Ti.Platform.displayCaps.platformWidth;
			var LastDPI=Ti.Platform.displayCaps.dpi;
			valueOf(testRun, Ti.Platform.displayCaps.platformWidth).shouldBe(result);
		}
		finish(testRun);
	}

	//TIMOB-10043
	this.physicalSizeCategory = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			valueOf(testRun, Ti.Platform.Android.physicalSizeCategory).shouldBeNumber();
		}
		finish(testRun);
	}

	//TIMOB-10482
	this.platform_manufacturer = function(testRun) {
		valueOf(testRun, Ti.Platform.getManufacturer()).shouldBe(Ti.Platform.manufacturer);
		
		finish(testRun);
	}
}
