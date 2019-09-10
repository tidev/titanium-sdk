/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

@import EventKit;
@import JavaScriptCore;
@import TitaniumKit.ObjcProxy;

@class TiCalendarCalendar; // forward declare

@protocol CalendarExports <JSExport>

// Constants
CONSTANT(EKParticipantRole, ATTENDEE_ROLE_CHAIR);
CONSTANT(EKParticipantRole, ATTENDEE_ROLE_NON_PARTICIPANT);
CONSTANT(EKParticipantRole, ATTENDEE_ROLE_OPTIONAL);
CONSTANT(EKParticipantRole, ATTENDEE_ROLE_REQUIRED);
CONSTANT(EKParticipantRole, ATTENDEE_ROLE_UNKNOWN);

CONSTANT(EKParticipantStatus, ATTENDEE_STATUS_ACCEPTED);
CONSTANT(EKParticipantStatus, ATTENDEE_STATUS_COMPLETED);
CONSTANT(EKParticipantStatus, ATTENDEE_STATUS_DECLINED);
CONSTANT(EKParticipantStatus, ATTENDEE_STATUS_DELEGATED);
CONSTANT(EKParticipantStatus, ATTENDEE_STATUS_IN_PROCESS);
CONSTANT(EKParticipantStatus, ATTENDEE_STATUS_PENDING);
CONSTANT(EKParticipantStatus, ATTENDEE_STATUS_TENTATIVE);
CONSTANT(EKParticipantStatus, ATTENDEE_STATUS_UNKNOWN);

CONSTANT(EKParticipantType, ATTENDEE_TYPE_GROUP);
CONSTANT(EKParticipantType, ATTENDEE_TYPE_PERSON);
CONSTANT(EKParticipantType, ATTENDEE_TYPE_RESOURCE);
CONSTANT(EKParticipantType, ATTENDEE_TYPE_ROOM);
CONSTANT(EKParticipantType, ATTENDEE_TYPE_UNKNOWN);

CONSTANT(EKAuthorizationStatus, AUTHORIZATION_AUTHORIZED);
CONSTANT(EKAuthorizationStatus, AUTHORIZATION_DENIED);
CONSTANT(EKAuthorizationStatus, AUTHORIZATION_RESTRICTED);
CONSTANT(EKAuthorizationStatus, AUTHORIZATION_UNKNOWN);

CONSTANT(EKEventAvailability, AVAILABILITY_BUSY);
CONSTANT(EKEventAvailability, AVAILABILITY_FREE);
CONSTANT(EKEventAvailability, AVAILABILITY_NOTSUPPORTED);
CONSTANT(EKEventAvailability, AVAILABILITY_TENTATIVE);
CONSTANT(EKEventAvailability, AVAILABILITY_UNAVAILABLE);

CONSTANT(EKRecurrenceFrequency, RECURRENCEFREQUENCY_DAILY);
CONSTANT(EKRecurrenceFrequency, RECURRENCEFREQUENCY_MONTHLY);
CONSTANT(EKRecurrenceFrequency, RECURRENCEFREQUENCY_WEEKLY);
CONSTANT(EKRecurrenceFrequency, RECURRENCEFREQUENCY_YEARLY);

CONSTANT(EKSourceType, SOURCE_TYPE_BIRTHDAYS);
CONSTANT(EKSourceType, SOURCE_TYPE_CALDAV);
CONSTANT(EKSourceType, SOURCE_TYPE_EXCHANGE);
CONSTANT(EKSourceType, SOURCE_TYPE_LOCAL);
CONSTANT(EKSourceType, SOURCE_TYPE_MOBILEME);
CONSTANT(EKSourceType, SOURCE_TYPE_SUBSCRIBED);

CONSTANT(EKSpan, SPAN_FUTUREEVENTS);
CONSTANT(EKSpan, SPAN_THISEVENT);

CONSTANT(EKEventStatus, STATUS_CANCELED);
CONSTANT(EKEventStatus, STATUS_CONFIRMED);
CONSTANT(EKEventStatus, STATUS_NONE);
CONSTANT(EKEventStatus, STATUS_TENTATIVE);

// Properties (and accessors)
READONLY_PROPERTY(NSArray<TiCalendarCalendar *> *, allCalendars, AllCalendars);
READONLY_PROPERTY(NSArray<TiCalendarCalendar *> *, allEditableCalendars, AllEditableCalendars);
READONLY_PROPERTY(EKAuthorizationStatus, calendarAuthorization, CalendarAuthorization);
READONLY_PROPERTY(TiCalendarCalendar *, defaultCalendar, DefaultCalendar);

// Methods
- (TiCalendarCalendar *)getCalendarById:(NSString *)calendarId;
- (BOOL)hasCalendarPermissions;
- (void)requestCalendarPermissions:(JSValue *)callback;

@end

@interface CalendarModule : ObjcProxy <CalendarExports> {
  @private
  EKEventStore *store;
}

- (EKEventStore *)store;
@end

#endif
