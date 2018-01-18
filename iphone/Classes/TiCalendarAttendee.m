/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR
#import "TiCalendarAttendee.h"

@implementation TiCalendarAttendee

#pragma mark - Internals

- (id)_initWithPageContext:(id<TiEvaluator>)context participant:(EKParticipant *)participant_
{
  if (self = [super _initWithPageContext:context]) {
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

- (NSString *)email
{
  if ([[self participant] isCurrentUser]) {
    return @"";
  }

  return [[[self participant] URL] resourceSpecifier];
}

- (NSNumber *)role
{
  return NUMUINT([[self participant] participantRole]);
}

- (NSNumber *)type
{
  return NUMUINT([[self participant] participantType]);
}

- (NSNumber *)status
{
  return NUMUINT([[self participant] participantStatus]);
}

- (NSNumber *)isOrganizer
{
  return NUMBOOL([[self participant] isCurrentUser]);
}

@end

#endif
