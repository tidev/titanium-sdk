/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

#import "CalendarModule.h"
#import "TiCalendarAttendee.h"

@implementation TiCalendarAttendee

#pragma mark - Internals

-(id)_initWithPageContext:(id<TiEvaluator>)context participant:(EKParticipant*)participant_ isOrganiser:(BOOL)_isOrganiser module:(CalendarModule*)module_
{
	if (self = [super _initWithPageContext:context]) {
		module = [module_ retain];
		participant = [participant_ retain];
        isOrganiser = _isOrganiser;
	}
	return self;
}

-(void)_destroy
{
	RELEASE_TO_NIL(module);
	RELEASE_TO_NIL(participant);
	[super _destroy];
}

-(EKParticipant*) participant
{
	return participant;
}

-(NSString*)apiName
{
	return @"Ti.Calendar.Attendee";
}


#pragma mark - Public API's

-(id)valueForUndefinedKey:(NSString *)key
{
	if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self valueForUndefinedKey:key] retain];}, YES);
		return [result autorelease];
	}
	
	if ([key isEqualToString:@"name"]) {
		return participant.name;
	}
	
	else if ([key isEqualToString:@"email"]) {
		// Apple dont give out device account email since it is a privacy concern.
        // We can query through non-documented methods but that is not advisable.
		if (participant.isCurrentUser) {
			return @"";
		}
		NSURL* url = participant.URL;
		NSString* email = url.resourceSpecifier;
		return email;
	}
	
	else if ([key isEqualToString:@"role"]) {
		EKParticipantRole role = participant.participantRole;
		EKParticipantRole mappedRole;
		if (role == EKParticipantRoleUnknown ||
			role == EKParticipantRoleOptional ||
			role == EKParticipantRoleNonParticipant) {
			mappedRole = EKParticipantRoleOptional;
		} else {
			mappedRole = EKParticipantRoleRequired;
		}
		return NUMINT(mappedRole);
	}
	
	else if ([key isEqualToString:@"status"]) {
		EKParticipantStatus status = participant.participantStatus;
		EKParticipantStatus mappedStatus;
		if (status == EKParticipantStatusTentative ||
			status == EKParticipantStatusDelegated) {
			mappedStatus = EKParticipantStatusTentative;
		} else if(status == EKParticipantStatusAccepted) {
			mappedStatus = EKParticipantStatusAccepted;
		} else if (status == EKParticipantStatusDeclined) {
			mappedStatus = EKParticipantStatusDeclined;
		} else {
			mappedStatus = EKParticipantStatusUnknown;
		}
		return NUMINT(mappedStatus);
	}
	
	else {
		id result = [super valueForUndefinedKey:key];
		return result;
	}
}

#pragma mark - Public API

- (NSNumber*)isOrganiser {
    return (NUMBOOL(isOrganiser));
}

@end

#endif