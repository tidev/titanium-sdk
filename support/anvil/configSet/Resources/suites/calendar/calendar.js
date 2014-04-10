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

	this.name = "calendar";
	this.tests = [
		{name: "moduleReachable"}
	]

	this.moduleReachable = function(testRun) {
		//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2435-android-titaniumandroidcalendar-returns-null
		// Just tests if the module is even reachable, by referencing one of its constants
		if (Ti.Platform.osname === 'android') {
			valueOf(testRun,  function() { Ti.Calendar.METHOD_ALERT; }).shouldNotThrowException();
			valueOf(testRun, Ti.Calendar.METHOD_ALERT).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.METHOD_DEFAULT).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.METHOD_EMAIL).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.METHOD_SMS).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.STATE_DISMISSED).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.STATE_FIRED).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.STATE_SCHEDULED).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.VISIBILITY_CONFIDENTIAL).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.VISIBILITY_DEFAULT).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.VISIBILITY_PRIVATE).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.VISIBILITY_PUBLIC).shouldBeNumber();
			valueOf(testRun, Ti.Calendar.allAlerts).shouldBeArray();
			valueOf(testRun, Ti.Calendar.selectableCalendars).shouldBeArray();
		}
		valueOf(testRun, Ti.Calendar.STATUS_CANCELED).shouldBeNumber();
		valueOf(testRun, Ti.Calendar.STATUS_CONFIRMED).shouldBeNumber();
		valueOf(testRun, Ti.Calendar.STATUS_TENTATIVE).shouldBeNumber();
		valueOf(testRun, Ti.Calendar.allCalendars).shouldBeArray();

		finish(testRun);
	}
}
