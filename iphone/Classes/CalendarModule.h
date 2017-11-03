/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_CALENDAR

#import <EventKit/EventKit.h>

#import "TiCalendarAlert.h"
#import "TiCalendarCalendar.h"
#import "TiCalendarEvent.h"
#import "TiCalendarReminder.h"

@interface CalendarModule : TiModule {
  @private
  EKEventStore *store;
}

- (EKEventStore *)store;

@property (nonatomic, readonly) NSNumber *STATUS_NONE;
@property (nonatomic, readonly) NSNumber *STATUS_CONFIRMED;
@property (nonatomic, readonly) NSNumber *STATUS_TENTATIVE;
@property (nonatomic, readonly) NSNumber *STATUS_CANCELLED;

@property (nonatomic, readonly) NSNumber *AVAILABILITY_NOTSUPPORTED;
@property (nonatomic, readonly) NSNumber *AVAILABILITY_BUSY;
@property (nonatomic, readonly) NSNumber *AVAILABILITY_FREE;
@property (nonatomic, readonly) NSNumber *AVAILABILITY_TENTATIVE;
@property (nonatomic, readonly) NSNumber *AVAILABILITY_UNAVAILABLE;

@property (nonatomic, readonly) NSNumber *SPAN_THISEVENT;
@property (nonatomic, readonly) NSNumber *SPAN_FUTUREEVENTS;

@property (nonatomic, readonly) NSNumber *RECURRENCEFREQUENCY_DAILY;
@property (nonatomic, readonly) NSNumber *RECURRENCEFREQUENCY_WEEKLY;
@property (nonatomic, readonly) NSNumber *RECURRENCEFREQUENCY_MONTHLY;
@property (nonatomic, readonly) NSNumber *RECURRENCEFREQUENCY_YEARLY;

@property (nonatomic, readonly) NSNumber *AUTHORIZATION_UNKNOWN;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_RESTRICTED;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_DENIED;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_AUTHORIZED;

@property (nonatomic, readonly) NSNumber *ATTENDEE_STATUS_UNKNOWN;
@property (nonatomic, readonly) NSNumber *ATTENDEE_STATUS_PENDING;
@property (nonatomic, readonly) NSNumber *ATTENDEE_STATUS_ACCEPTED;
@property (nonatomic, readonly) NSNumber *ATTENDEE_STATUS_DECLINED;
@property (nonatomic, readonly) NSNumber *ATTENDEE_STATUS_TENTATIVE;
@property (nonatomic, readonly) NSNumber *ATTENDEE_STATUS_DELEGATED;
@property (nonatomic, readonly) NSNumber *ATTENDEE_STATUS_COMPLETED;
@property (nonatomic, readonly) NSNumber *ATTENDEE_STATUS_IN_PROCESS;

@property (nonatomic, readonly) NSNumber *ATTENDEE_ROLE_UNKNOWN;
@property (nonatomic, readonly) NSNumber *ATTENDEE_ROLE_REQUIRED;
@property (nonatomic, readonly) NSNumber *ATTENDEE_ROLE_OPTIONAL;
@property (nonatomic, readonly) NSNumber *ATTENDEE_ROLE_CHAIR;
@property (nonatomic, readonly) NSNumber *ATTENDEE_ROLE_NON_PARTICIPANT;

@property (nonatomic, readonly) NSNumber *ATTENDEE_TYPE_UNKNOWN;
@property (nonatomic, readonly) NSNumber *ATTENDEE_TYPE_PERSON;
@property (nonatomic, readonly) NSNumber *ATTENDEE_TYPE_ROOM;
@property (nonatomic, readonly) NSNumber *ATTENDEE_TYPE_RESOURCE;
@property (nonatomic, readonly) NSNumber *ATTENDEE_TYPE_GROUP;

@property (nonatomic, readonly) NSNumber *SOURCE_TYPE_LOCAL;
@property (nonatomic, readonly) NSNumber *SOURCE_TYPE_EXCHANGE;
@property (nonatomic, readonly) NSNumber *SOURCE_TYPE_CALDAV;
@property (nonatomic, readonly) NSNumber *SOURCE_TYPE_MOBILEME;
@property (nonatomic, readonly) NSNumber *SOURCE_TYPE_SUBSCRIBED;
@property (nonatomic, readonly) NSNumber *SOURCE_TYPE_BIRTHDAYS;

@end

#endif
