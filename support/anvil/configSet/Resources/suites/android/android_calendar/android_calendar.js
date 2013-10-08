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

	this.name = "android_calendar";
	this.tests = [
		{name: "moduleReachable"},
		{name: "noSuchColumnError"},
		{name: "eventsBetween2Dates"}
	]

	this.moduleReachable = function(testRun) {
		//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2435-android-titaniumandroidcalendar-returns-null
		// Just tests if the module is even reachable, by referencing one of its constants
		valueOf(testRun,  function() { Ti.Android.Calendar.METHOD_ALERT; }).shouldNotThrowException();
		valueOf(testRun, Ti.Android.Calendar.METHOD_ALERT).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.METHOD_DEFAULT).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.METHOD_EMAIL).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.METHOD_SMS).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.STATE_DISMISSED).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.STATE_FIRED).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.STATE_SCHEDULED).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.STATUS_CANCELED).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.STATUS_CONFIRMED).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.STATUS_TENTATIVE).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.VISIBILITY_CONFIDENTIAL).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.VISIBILITY_DEFAULT).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.VISIBILITY_PRIVATE).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.VISIBILITY_PUBLIC).shouldBeNumber();
		valueOf(testRun, Ti.Android.Calendar.allAlerts).shouldBeArray();
		valueOf(testRun, Ti.Android.Calendar.allCalendars).shouldBeArray();
		valueOf(testRun, Ti.Android.Calendar.selectableCalendars).shouldBeArray();

		finish(testRun);
	}

	this.noSuchColumnError = function(testRun) {
		var calendar = Ti.Android.Calendar.getCalendarById(1);
		var eventBegins = new Date(2012, 03, 26, 12, 0, 0);
		var eventEnds = new Date(2012, 03, 26, 14, 0, 0);
		var details = {
			title: 'Do some stuff',
			description: "I'm going to do some stuff at this time.",
			begin: eventBegins,
			end: eventEnds
		};
		var event = calendar.createEvent(details);
		valueOf(testRun, function() {
			var events = calendar.getEventsInYear(2012);
		}).shouldNotThrowException();

		finish(testRun);
	}

	this.eventsBetween2Dates = function(testRun) {
		valueOf(testRun, function() {
			var startDate = new Date(2012, 03, 10, 12, 0, 0);
			var endDate = new Date(2012, 03, 19, 14, 0, 0);
			var out = [];
			var calendars = Ti.Android.Calendar.allCalendars;
			for (var i=0; i < calendars.length; i++) {
				var cal_events = calendars[i].getEventsBetweenDates(startDate,endDate);
				for (var j=0; j < cal_events.length; j++) {
					out.push(cal_events[j]);
				};
			};
		}).shouldNotThrowException();

		finish(testRun);
	}
}
