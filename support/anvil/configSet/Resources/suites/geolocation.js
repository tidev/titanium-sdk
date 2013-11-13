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

	this.name = "geolocation";
	this.tests = [
		{name: "getCurrentPositionException"},
		{name: "getPreferredProviderAppCrash"},
		{name: "shouldBeLessThan360", timeout: 50000},
		{name: "trueHeadingNotGenerated", timeout: 50000},
		{name: "invalidValue"}
	]

	this.getCurrentPositionException = function(testRun) {
		// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2395-android-ks-geolocation-always-says-geo-turned-off-and-location-updates-never-occur
		valueOf(testRun,  function() {Ti.Geolocation.getCurrentPosition(function(){});} ).shouldNotThrowException();

		finish(testRun);
	}

	//TIMOB-8751
	this.getPreferredProviderAppCrash = function(testRun) {
		valueOf(testRun,  function() {
			Titanium.Geolocation.getPreferredProvider();
		}).shouldNotThrowException();

		finish(testRun);
	}

	//TIMOB-3077
	this.shouldBeLessThan360 = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			var headingCallback = function(e) {
				valueOf(testRun, e.heading.trueHeading).shouldBeLessThanEqual(360);
			
				finish(testRun);
			};
			Titanium.Geolocation.addEventListener('heading', headingCallback);
		}
		else

			finish(testRun);
	}

	//TIMOB-9434
	this.trueHeadingNotGenerated = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			var headingHandler = function(e) {
				valueOf(testRun, e.heading.trueHeading).shouldNotBeUndefined();
			
				finish(testRun);	
			}
			Ti.Geolocation.addEventListener("heading", headingHandler);
		}
		else

			finish(testRun);
	}

	//TIMOB-11235
	this.invalidValue = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			gpsProvider = Ti.Geolocation.Android.createLocationProvider({
				name: Ti.Geolocation.PROVIDER_GPS,
				minUpdateTime: '5.0',
				minUpdateDistance: '3.0'
			});
			valueOf(testRun, gpsProvider.minUpdateTime).shouldBe('5.0');
			valueOf(testRun, gpsProvider.minUpdateDistance).shouldBe('3.0');

			finish(testRun);
		}
		else

			finish(testRun);
	}
}
