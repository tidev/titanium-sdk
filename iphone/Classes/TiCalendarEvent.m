/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

#import "CalendarModule.h"
#import "TiCalendarEvent.h"
#import "TiCalendarAlert.h"

@implementation TiCalendarEvent

-(id)_initWithPageContext:(id<TiEvaluator>)context eventID:(NSString*)eventid_ module:(CalendarModule*)module_
{
    if (self = [super _initWithPageContext:context]) {
        module= module_;
        eventId = eventId;
        event = NULL;
    }
}

-(EKEvent*)event
{
    // Force us to be on the main thread
	if (![NSThread isMainThread]) {
		return NULL;
	}
    
    if (event == NULL) {
        EKEventStore* store = [module store];
        if (store != NULL) {
            event = [[module store] eventWithIdentifier:eventId];
        }
    }
    return event;
}

-(NSArray*)alerts
{
    
}

-(id)valueForUndefinedKey:(NSString *)key
{
    if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self valueForUndefinedKey:key] retain];}, YES);
		return [result autorelease];
	}
    
    EKEvent* currEvent = [self event];
    
    if (currEvent == NULL) {
        DebugLog(@"Cannot access event from the eventStore.");
		return;
    }
    
    if ([key isEqualToString:@"title"]) {
        return currEvent.title;
    }
    else if ([key isEqualToString:@"description"]) {
        return currEvent.notes;
    }
    else if ([key isEqualToString:@"begin"]) {
        return [TiUtils UTCDateForDate:currEvent.startDate];
    }
    else if ([key isEqualToString:@"end"]) {
        return [TiUtils UTCDateForDate:currEvent.endDate];
    }
    else if ([key isEqualToString:@"location"]) {
        return currEvent.location;
    }
    else if ([key isEqualToString:@"availability"]) {
        return NUMINT(currEvent.availability);
    }
    else if ([key isEqualToString:@"status"]) {
        return NUMINT(currEvent.status);
    }
    else if ([key isEqualToString:@"hasAlarms"]) {
        return NUMBOOL(currEvent.hasAlarms);
    }
    else if ([key isEqualToString:@"allDay"]) {
        return NUMBOOL(currEvent.allDay);
    }
    else if ([key isEqualToString:@"id"]) {
        return currEvent.eventIdentifier;
    }
    else if ([key isEqualToString:@"reminders"]) {
        return currEvent.eventIdentifier;
    }
    // Something else
	else {
		id result = [super valueForUndefinedKey:key];
		return result;
	}
    
}

-(void)setValue:(id)value forUndefinedKey:(NSString*)key
{
	if (![NSThread isMainThread]) {
		TiThreadPerformOnMainThread(^{[self setValue:value forUndefinedKey:key];}, YES);
		return;
	}
    
    EKEvent* currEvent = [self event];
    
    if (currEvent == NULL) {
        DebugLog(@"Cannot access event from the eventStore.");
		return;
    }
    
    if ([key isEqualToString:@"allDay"]) {
        currEvent.allDay = [TiUtils boolValue:value def:NO];
    }
    else if ([key isEqualToString:@"description"]) {
        DebugLog(@"Setting value for `description` for events in iOS is not supported.");
		return;
    }
    else if ([key isEqualToString:@"begin"]) {
        currEvent.startDate = [TiUtils dateForUTCDate:value];
    }
    else if ([key isEqualToString:@"end"]) {
        currEvent.endDate = [TiUtils dateForUTCDate:value];
    }
    else if ([key isEqualToString:@"availability"]) {
        currEvent.availability = [TiUtils intValue:value];
    }
    else if ([key isEqualToString:@"title"]) {
        currEvent.title = [TiUtils stringValue:value];
    }
    else if ([key isEqualToString:@"description"]) {
        currEvent.notes = [TiUtils stringValue:value];
    }
    else if ([key isEqualToString:@"location"]) {
        currEvent.location = [TiUtils stringValue:value];
    }
    else if ([key isEqualToString:@"reminders"]) {
        //logic for TIReminders
    }
    // Something else
	else {
		[super setValue:value forUndefinedKey:key];
	}
}

-(TiCalendarAlert*)createAlert:(id)args
{
    if (![NSThread isMainThread]) {
        __block id result;
		TiThreadPerformOnMainThread(^{result = [[self createAlert:args] retain];}, YES);
		return [result autorelease];
	}
    
    ENSURE_DICT(args);
    
    NSString *key = [args objectForKey:@"absoluteDate"] == nil ? @"relativeOffset" : @"absoluteDate";
    id value = [args objectForKey:key];
    EKAlarm* alarm = NULL;
    if ([key isEqualToString:@"absoluteDate"]) {
        alarm = [EKAlarm alarmWithAbsoluteDate:[TiUtils dateForUTCDate:value]];
    }
    else if ([key isEqualToString:@"relativeOffset"]) {
        alarm = [EKAlarm alarmWithRelativeOffset:[value doubleValue]];
    }
    else {
        DebugLog(@"Invalid arg passed during creation of alert. Valid args type are `absoluteDate` or `relativeOffset`.");
        return NULL;
    }
    TiCalendarAlert *newalert = [[[TiCalendarAlert alloc] _initWithPageContext:[self pageContext]
                                                                         alert:alarm
                                                                       eventId:eventId
                                                                        module:module] autorelease];
    return newalert;
}

-(void)save:(id)unused
{

}

-(void)remove:(id)unused
{

}

@end

#endif