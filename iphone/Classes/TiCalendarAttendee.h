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
READONLY_PROPERTY(bool, isOrganizer, IsOrganizer);
READONLY_PROPERTY(NSString *, name, Name);
READONLY_PROPERTY(EKParticipantRole, role, Role);
READONLY_PROPERTY(EKParticipantStatus, status, Status);
READONLY_PROPERTY(EKParticipantType, type, Type);

@end

@interface TiCalendarAttendee : ObjcProxy <TiCalendarAttendeeExports> {
  EKParticipant *participant;
}

/**
  @deprecated Only here for backwards compatibility with SDK < 8.1.0. Use `initWithParticipant:` instead.
  */
- (id)_initWithPageContext:(id<TiEvaluator>)context participant:(EKParticipant *)participant_ __attribute__((deprecated));
- (id)initWithParticipant:(EKParticipant *)participant_;

@end

#endif
