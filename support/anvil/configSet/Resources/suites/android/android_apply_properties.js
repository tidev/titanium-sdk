
           
/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
// TIMOB_10415
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}
    
	this.name = "android_apply_properties";
	this.tests = [
                  {name: "test_TIMOB_10415"},
                  ]
    
	this.test_TIMOB_10415 = function(testRun) {
            var eventBegins = new Date(2010, 11, 26, 12, 0, 0);
            var eventEnds = new Date(2010, 11, 26, 14, 0, 0);
            var details = {
            title: 'Do some stuff',
            description: "I'm going to do some stuff at this time.",
            begin: eventBegins,
            end: eventEnds,
            location:'my_location'
            };
            var event = Ti.Calendar.selectableCalendars[0].createEvent(details);
            valueOf(testRun, event.location).shouldBe('my_location');
            
            finish(testRun);
    }
}
