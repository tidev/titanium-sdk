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

	this.name = "iphone_geolocation";
	this.tests = [
		{name: "accuracyLowAndHigh"}
		]

	//TIMOB-8517
	this.accuracyLowAndHigh = function(testRun) {
		Ti.Geolocation.accuracy=Ti.Geolocation.ACCURACY_HIGH;
		valueOf(testRun, Ti.Geolocation.accuracy).shouldBe(3000);
		Ti.Geolocation.accuracy=Ti.Geolocation.ACCURACY_LOW;
		valueOf(testRun, Ti.Geolocation.accuracy).shouldBe(3000);
	
		finish(testRun);
	}
}
