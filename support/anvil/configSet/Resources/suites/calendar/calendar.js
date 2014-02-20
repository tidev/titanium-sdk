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
		{name: "moduleReachable"},
		{name: "eventLocation"},
		{name: "noSuchColumnError"},
		{name: "eventsBetweenTwoDates"}
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


	//TIMOB-10415
	this.eventLocation = function(testRun) {
		var eventBegins = new Date(2010, 11, 26, 12, 0, 0);
		var eventEnds = new Date(2010, 11, 26, 14, 0, 0);
		var details = {
			title : 'Do some stuff',
			description : "I'm going to do some stuff at this time.",
			begin : eventBegins,
			end : eventEnds,
			location : 'my_location'
		};
		if (Ti.Platform.osname === 'android') {
			var event = Ti.Calendar.selectableCalendars[0].createEvent(details);
		}
		else {
			var event = Ti.Calendar.allCalendars[0].createEvent(details);
		}
		valueOf(testRun, event.getLocation( )).shouldBe('my_location');

		finish(testRun);
	}

	//TIMOB-7959
	this.noSuchColumnError = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			var calendar = Ti.Calendar.getCalendarById(1);
		} else {
			var calendar = Ti.Calendar.allCalendars[0];
		}
		var eventBegins = new Date(2012, 03, 26, 12, 0, 0);
		var eventEnds = new Date(2012, 03, 26, 14, 0, 0);
		var details = {
			title : 'Do some stuff',
			description : "I'm going to do some stuff at this time.",
			begin : eventBegins,
			end : eventEnds
		};
		var event = calendar.createEvent(details);
		valueOf(testRun, function() {
			var events = calendar.getEventsInYear(2012);
		}).shouldNotThrowException();

		finish(testRun);
	}

	//TIMOB-8085
	this.eventsBetweenTwoDates = function(testRun) {
		valueOf(testRun, function() {
			var startDate = new Date(2012, 03, 10, 12, 0, 0);
			var endDate = new Date(2012, 03, 19, 14, 0, 0);
			var out = [];
			var calendars = Ti.Calendar.allCalendars;
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
