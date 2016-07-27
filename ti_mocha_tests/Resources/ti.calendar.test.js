/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
//This test should only be ran locally as permissions are required.
var should = require('./should');

describe("Titanium.Calendar", function() {
    
    it("Attendee.role", function (finish) {
        
        if (Ti.Platform.osname == 'android') {
            finish();
        }
        
        should(Ti.Calendar.ATTENDEE_ROLE_UNKNOWN).be.a.Number;
        should(Ti.Calendar.ATTENDEE_ROLE_OPTIONAL).be.a.Number;
        should(Ti.Calendar.ATTENDEE_ROLE_REQUIRED).be.a.Number;
        should(Ti.Calendar.ATTENDEE_ROLE_CHAIR).be.a.Number;
        should(Ti.Calendar.ATTENDEE_ROLE_NON_PARTICIPANT).be.a.Number;

        should(Ti.Calendar.ATTENDEE_STATUS_UNKNOWN).be.a.Number;
        should(Ti.Calendar.ATTENDEE_STATUS_PENDING).be.a.Number;
        should(Ti.Calendar.ATTENDEE_STATUS_ACCEPTED).be.a.Number;
        should(Ti.Calendar.ATTENDEE_STATUS_DECLINED).be.a.Number;
        should(Ti.Calendar.ATTENDEE_STATUS_TENTATIVE).be.a.Number;
        should(Ti.Calendar.ATTENDEE_STATUS_DELEGATED).be.a.Number;
        should(Ti.Calendar.ATTENDEE_STATUS_IN_PROCESS).be.a.Number;

        should(Ti.Calendar.ATTENDEE_TYPE_UNKNOWN).be.a.Number;
        should(Ti.Calendar.ATTENDEE_TYPE_PERSON).be.a.Number;
        should(Ti.Calendar.ATTENDEE_TYPE_GROUP).be.a.Number;
        should(Ti.Calendar.ATTENDEE_TYPE_RESOURCE).be.a.Number;
        should(Ti.Calendar.ATTENDEE_TYPE_ROOM).be.a.Number;        
        
        finish();
    });
    
    it.skip("Titanium.Calendar.defaultCalendar", function() {
        it("Titanium.Calendar.defaultCalendar", function(finish) {

        var date1 = new Date(new Date().getTime() + 3000),
            date2 = new Date(new Date().getTime() + 900000);
            date3 = new Date(new Date().getTime() + 1000000);
            Ti.API.info(date1);

        var defCalendar = Ti.Calendar.defaultCalendar;
        var event1 = defCalendar.createEvent({
                            title: 'Sample Event',
                            notes: 'This is a test event which has some values assigned to it.',
                            location: 'Appcelerator Inc',
                            begin: date1,
                            end: date2,
                            availability: Ti.Calendar.AVAILABILITY_FREE,
                            allDay: false,
                    });
        var event2 = defCalendar.createEvent({
                            title: 'Sample Event',
                            notes: 'This is a test event which has some values assigned to it.',
                            location: 'Appcelerator Inc',
                            begin: date2,
                            end: date3,
                            availability: Ti.Calendar.AVAILABILITY_FREE,
                            allDay: false,
                    });
        event1.save(Ti.Calendar.SPAN_THISEVENT);
        event2.save(Ti.Calendar.SPAN_THISEVENT);

        if (Ti.Calendar.hasCalendarPermissions()) {
            performCalendarReadFunctions();
        } else {
            Ti.Calendar.requestCalendarPermissions(function(e) {
                if (e.success) {
                    Ti.Calendar.createEvent(eventOne);
                    Ti.Calendar.createEvent(eventTwo);
                    performCalendarReadFunctions();
                } else {
                    Ti.API.error(e.error);
                    alert('Access to calendar is not allowed');
                }
            });
        }

        function performCalendarReadFunctions() {
            date2.setHours(date1.getHours() + 24);
             
            var date1ISO = date1.toISOString();
            var date2ISO = date2.toISOString();
             
            date1ISO = date1ISO.replace("Z", "+0000");
            date2ISO = date2ISO.replace("Z", "+0000");
             
            events = defCalendar.getEventsBetweenDates(date1, date2); 
            eventsWithString = defCalendar.getEventsBetweenDates(date1ISO, date2ISO);
            should(events.length).eql(2);
            should(eventsWithString.length).eql(2);
            finish();
        }
        });
    });    
});