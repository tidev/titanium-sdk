/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR
#import "TiCalendarAttendee.h"
@import EventKit;
@import TitaniumKit.TiUtils;

@implementation TiCalendarAttendee

#pragma mark - Internals

- (id)initWithParticipant:(EKParticipant *)participant_
{
  if (self = [super init]) {
    participant = [participant_ retain];
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(participant);
  [super dealloc];
}

- (EKParticipant *)participant
{
  return participant;
}

- (NSString *)apiName
{
  return @"Ti.Calendar.Attendee";
}

#pragma mark - Public API's

- (NSString *)name
{
  return [[self participant] name];
}
GETTER_IMPL(NSString *, name, Name);

- (NSString *)email
{
  if ([[self participant] isCurrentUser]) {
    return @"";
  }

  return [[[self participant] URL] resourceSpecifier];
}
GETTER_IMPL(NSString *, email, Email);

- (EKParticipantRole)role
{
  return [[self participant] participantRole];
}
GETTER_IMPL(EKParticipantRole, role, Role);

- (EKParticipantType)type
{
  return [[self participant] participantType];
}
GETTER_IMPL(EKParticipantType, type, Type);

- (EKParticipantStatus)status
{
  return [[self participant] participantStatus];
}
GETTER_IMPL(EKParticipantStatus, status, Status);

- (BOOL)isOrganizer
{
  return [[self participant] isCurrentUser];
}
GETTER_IMPL(BOOL, isOrganizer, IsOrganizer);

@end

#endif
