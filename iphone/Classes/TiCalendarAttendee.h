/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_CALENDAR
#import "CalendarModule.h"
@import JavaScriptCore;
@import TitaniumKit.TiProxy;

@class EKParticipant; // forward declare

@protocol TiCalendarAttendeeExports <JSExport>

READONLY_PROPERTY(NSString *, email, Email);
READONLY_PROPERTY(BOOL, isOrganizer, IsOrganizer);
READONLY_PROPERTY(NSString *, name, Name);
READONLY_PROPERTY(EKParticipantRole, role, Role);
READONLY_PROPERTY(EKParticipantStatus, status, Status);
READONLY_PROPERTY(EKParticipantType, type, Type);

@end

@interface TiCalendarAttendee : ObjcProxy <TiCalendarAttendeeExports> {
  EKParticipant *participant;
}

- (id)initWithParticipant:(EKParticipant *)participant_;

@end

#endif
