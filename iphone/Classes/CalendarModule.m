/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_CALENDAR

#import "CalendarModule.h"
#import "TiCalendarCalendar.h"

@implementation CalendarModule

#pragma mark - internal methods

-(EKEventStore*)store {
    if (store == NULL) {
        store = [[EKEventStore alloc] init];
    }
    return store;
}

-(NSArray*)allEventKitCalendars{
    if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self allEventKitCalendars] retain];}, YES);
		return [result autorelease];
	}
    EKEventStore* ourStore = [self store];
    if (ourStore  == NULL) {
        DebugLog(@"Could not instantiate an event of the event store.");
        return nil;
        
    }
    return [ourStore calendars];
}

#pragma mark - Internal Memory Management

-(void)dealloc
{
	[super dealloc];
    [store release];
}

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	[super didReceiveMemoryWarning:notification];
}

#pragma mark - Public API's

-(NSArray*)allCalendars
{
    if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self allCalendars] retain];}, YES);
		return [result autorelease];
	}

    NSArray* calendars_ = [self allEventKitCalendars];
    
    NSMutableArray* calendars = [NSMutableArray arrayWithCapacity:[calendars_ count]];
    for (EKCalendar* calendar_ in calendars_) {
        TiCalendarCalendar* calendar = [[[TiCalendarCalendar alloc] _initWithPageContext:[self executionContext] calendarId:[calendar_ calendarIdentifier] module:self] autorelease];
        [calendars addObject:calendar];
    }
    
    return calendars;
}

-(NSArray*)editableCalendars
{
    if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self editableCalendars] retain];}, YES);
		return [result autorelease];
	}
    
    NSArray* calendars_ = [self allEventKitCalendars];
    
    NSMutableArray* editableCalendars = [NSMutableArray array];
    for (EKCalendar* calendar_ in calendars_) {
        if ([calendar_ allowsContentModifications]) {
            TiCalendarCalendar* calendar = [[[TiCalendarCalendar alloc] _initWithPageContext:[self executionContext] calendarId:[calendar_ calendarIdentifier] module:self] autorelease];
            [editableCalendars addObject:calendar];
        }
    }
    return editableCalendars;
}

-(TiCalendarCalendar*)getCalenderById:(id)arg
{
    ENSURE_SINGLE_ARG(arg, NSString);
    
    if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self getCalenderById:arg] retain];}, YES);
		return [result autorelease];
	}
    
    EKEventStore* ourStore = [self store];
    if (ourStore  == NULL) {
        DebugLog(@"Could not instantiate an event of the event store.");
        return nil;
        
    }
    EKCalendar* calendar_ = [ourStore calendarWithIdentifier:arg];
    if (calendar_ == NULL) {
        return nil;
    }
    TiCalendarCalendar* calendar = [[[TiCalendarCalendar alloc] _initWithPageContext:[self executionContext] calendarId:arg module:self] autorelease];
    return calendar;
}



#pragma mark - Properties

MAKE_SYSTEM_PROP(STATUS_NONE,EKEventStatusNone);
MAKE_SYSTEM_PROP(STATUS_CONFIRMED,EKEventStatusConfirmed);
MAKE_SYSTEM_PROP(STATUS_TENTATIVE,EKEventStatusNone);
MAKE_SYSTEM_PROP(STATUS_CANCELED,EKEventStatusNone);

MAKE_SYSTEM_PROP(AVAILABILITY_NOTSUPPORTED, EKEventAvailabilityNotSupported);
MAKE_SYSTEM_PROP(AVAILABILITY_BUSY, EKEventAvailabilityBusy);
MAKE_SYSTEM_PROP(AVAILABILITY_FREE, EKEventAvailabilityFree);
MAKE_SYSTEM_PROP(AVAILABILITY_TENTATIVE, EKEventAvailabilityTentative);
MAKE_SYSTEM_PROP(AVAILABILITY_UNAVAILABLE, EKEventAvailabilityUnavailable);

MAKE_SYSTEM_PROP(SPAN_THISEVENT, EKSpanThisEvent);
MAKE_SYSTEM_PROP(SPAN_FUTUREEVENTS, EKSpanFutureEvents);

MAKE_SYSTEM_PROP(RECURRENCEFREQUENCY_DAILY, EKRecurrenceFrequencyDaily);
MAKE_SYSTEM_PROP(RECURRENCEFREQUENCY_WEEKLY, EKRecurrenceFrequencyWeekly);
MAKE_SYSTEM_PROP(RECURRENCEFREQUENCY_MONTHLY, EKRecurrenceFrequencyMonthly);
MAKE_SYSTEM_PROP(RECURRENCEFREQUENCY_YEARLY, EKRecurrenceFrequencyYearly);

@end

#endif
