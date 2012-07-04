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

	this.name = "android_resources";
	this.tests = [
		{name: "packagedResources"},
		{name: "failedResourceLookup"}
	]

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/3163
	this.packagedResources = function(testRun) {
		Ti.Facebook.appid=1;//forces inclusion of facebook module.
		valueOf(testRun,  function() {
			var resid=Ti.App.Android.R.drawable.facebook_login;
			valueOf(testRun, resid).shouldBeGreaterThan(0);
		}).shouldNotThrowException();

		finish(testRun);
	}

	// http://jira.appcelerator.org/browse/TIMOB-4027
	this.failedResourceLookup = function(testRun) {
		// checking non-existent resource should not raise exception
		// (It was raising exception second time).
		valueOf(testRun, function(){var x = L('mickey');}).shouldNotThrowException();
		valueOf(testRun, function(){var x = L('mickey');}).shouldNotThrowException();

		finish(testRun);
	}
}
