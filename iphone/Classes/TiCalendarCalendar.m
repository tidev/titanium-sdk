/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

#import "TiCalendarCalendar.h"
#import "CalendarModule.h"
#import "TiCalendarAlert.h"
#import "TiCalendarEvent.h"
#import "TiCalendarRecurrenceRule.h"
#import "TiUtils.h"
#import "TiBlob.h"

#pragma mark -
@implementation TiCalendarCalendar

#pragma mark - Internals

-(id)_initWithPageContext:(id<TiEvaluator>)context calendar:(EKCalendar*)calendar_ module:(CalendarModule*)module_
{
    if (self = [super _initWithPageContext:context]) {
        module= [module_ retain] ;
        calendar = [calendar_ retain];
        if ([TiUtils isIOS5OrGreater]) {
            calendarId = [calendar calendarIdentifier];
        }
    }
        
    return self;

}

-(void)_destroy
{
	RELEASE_TO_NIL(module);
	RELEASE_TO_NIL(calendar);
    [super _destroy];
}


-(EKCalendar*)calendar
{
    if (![NSThread isMainThread] || (module == NULL)) {
        return NULL;
    }
    
    if(calendar == NULL) {
        EKEventStore* store = [module store];
        if (store != NULL) {
            calendar = [store calendarWithIdentifier:calendarId];
        }
    }
    return calendar;
}

-(EKEventStore*) ourStore
{
    if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self ourStore] retain];}, YES);
		return [result autorelease];
	}
    EKEventStore* store = [module store];
    if (store  == NULL) {
        DebugLog(@"Cannot access the Event Store");
        return nil;
    }
    return store;

}

-(NSArray*) _fetchAllEventsbetweenDate:(NSDate*)date1 andDate:(NSDate*)date2
{
    if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self _fetchAllEventsbetweenDate:date1 andDate:date2] retain];}, YES);
		return [result autorelease];
	}
    EKEventStore* ourStore = [self ourStore];
    if (ourStore != nil) {
        NSPredicate* predicate = [ourStore predicateForEventsWithStartDate:date1
                                                                   endDate:date2
                                                                 calendars:[NSArray arrayWithObject:[self calendar]]];
        return [ourStore eventsMatchingPredicate:predicate];
    }
    return NULL;
}

#pragma mark - Public API's

-(TiCalendarEvent*)createEvent:(id)args
{
    ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
   
    if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self createEvent:args] retain];}, YES);
		return [result autorelease];
	}
    
    EKEventStore* ourStore = [self ourStore];
    
    if (ourStore != nil) {
        EKEvent* newEvent = [EKEvent eventWithEventStore:[module store]];
        if (newEvent == NULL) {
            [self throwException:@"Failed to create event."
                       subreason:nil
                        location:CODELOCATION];
            return nil;
        }
        TiCalendarEvent* event = [[[TiCalendarEvent alloc] _initWithPageContext:[self executionContext]
                                                                        event:newEvent
                                                                       calendar:[self calendar]
                                                                         module:module] autorelease];
        
        [event setValuesForKeysWithDictionary:args];

        return event;
    }
    return NULL;
}

-(TiCalendarEvent*)getEventById:(id)arg
{
    ENSURE_SINGLE_ARG(arg, NSString);
    __block NSString* eventId = [TiUtils stringValue:arg];
    __block id result = NULL;
	dispatch_sync(dispatch_get_main_queue(),^{
        EKEventStore* ourStore = [self ourStore];
        if (ourStore == nil) {
            return ;
        }
        result = [ourStore eventWithIdentifier:[TiUtils stringValue:arg]];
        
    });
    if (result != NULL) {
        EKEvent* event_ = [[self ourStore] eventWithIdentifier:[TiUtils stringValue:arg]];
        TiCalendarEvent* event = [[[TiCalendarEvent alloc] _initWithPageContext:[self executionContext]
                                                                        event:event_
                                                                        calendar:event_.calendar
                                                                         module:module] autorelease];
        return event;
    }
    return NULL;
}

-(NSArray*)getEventsBeteenDates:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    NSString* start, *end;
    
    ENSURE_ARG_AT_INDEX(start, args, 0, NSString);
    ENSURE_ARG_AT_INDEX(end, args, 1, NSString);

    NSArray* events = [self _fetchAllEventsbetweenDate:[TiUtils dateForUTCDate:start]
                                              andDate:[TiUtils dateForUTCDate:end]];
    return [TiCalendarEvent convertEvents:events withContext:[self executionContext]  calendar:[self calendar]  module:module];
}

-(NSArray*)getEventsInDate:(id)arg
{
    ENSURE_ARG_COUNT(arg, 3);
    
    NSDateComponents *comps = [[NSDateComponents alloc] init];
    NSTimeInterval secondsPerDay = 24 * 60 * 60;

    [comps setDay:[TiUtils intValue:[arg objectAtIndex:2]]];
    [comps setMonth:[TiUtils intValue:[arg objectAtIndex:1]]];
    [comps setYear:[TiUtils intValue:[arg objectAtIndex:0]]];
    [comps setHour:0];
    [comps setMinute:0];
    [comps setSecond:0];

    NSCalendar *cal = [[NSCalendar alloc] initWithCalendarIdentifier:NSGregorianCalendar];

    NSDate *date1, *date2;
    date1 = [cal dateFromComponents:comps];
    date2 = [date1 dateByAddingTimeInterval:secondsPerDay];

    [comps release];
    [cal release];
    
    NSArray* events = [self _fetchAllEventsbetweenDate:date1 andDate:date2];
    return [TiCalendarEvent convertEvents:events withContext:[self executionContext] calendar:[self calendar] module:module];
}

-(NSArray*)getEventsInMonth:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    
    NSDateComponents *comps = [[NSDateComponents alloc] init];
        
    
    [comps setDay:1];
    [comps setMonth:[TiUtils intValue:[args objectAtIndex:1]]];
    [comps setYear:[TiUtils intValue:[args objectAtIndex:0]]];
    [comps setHour:0];
    [comps setMinute:0];
    [comps setSecond:0];
    
    NSCalendar *cal = [[NSCalendar alloc] initWithCalendarIdentifier:NSGregorianCalendar];
    
    NSDate *date1, *date2;
    date1 = [cal dateFromComponents:comps];
    
    NSTimeInterval secondsPerDay = 24 * 60 * 60;
    NSRange days = [cal rangeOfUnit:NSDayCalendarUnit
                             inUnit:NSMonthCalendarUnit
                            forDate:date1];
    
    date2 = [date1 dateByAddingTimeInterval:(secondsPerDay * days.length)];
    
    [comps release];
    [cal release];
    
    NSArray* events = [self _fetchAllEventsbetweenDate:date1 andDate:date2];
    return [TiCalendarEvent convertEvents:events withContext:[self executionContext] calendar:[self calendar] module:module];
}

-(NSArray*)getEventsInYear:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
    
    NSDateComponents *comps = [[NSDateComponents alloc] init];
    int year = [TiUtils intValue:[args objectAtIndex:0]];
    
    [comps setDay:1];
    [comps setMonth:1];
    [comps setYear:year];
    [comps setHour:0];
    [comps setMinute:0];
    [comps setSecond:0];
    
    NSCalendar *cal = [[NSCalendar alloc] initWithCalendarIdentifier:NSGregorianCalendar];
    
    NSDate *date1, *date2;
    date1 = [cal dateFromComponents:comps];
    
    NSTimeInterval secondsPerDay = 24 * 60 * 60;
    NSRange days = [cal rangeOfUnit:NSDayCalendarUnit
                             inUnit:NSMonthCalendarUnit
                            forDate:date1];
    [comps setYear:year+1];
    date2 = [cal dateFromComponents:comps];
    
    [comps release];
    [cal release];
    
    NSArray* events = [self _fetchAllEventsbetweenDate:date1 andDate:date2];
    return [TiCalendarEvent convertEvents:events withContext:[self executionContext] calendar:[self calendar] module:module];

}

-(id)valueForUndefinedKey:(NSString *)key
{
    if ([key isEqualToString:@"id"]) {
        return calendarId;
    }
    else {
        [super valueForUndefinedKey:key];
    }
}

-(NSNumber*)hidden
{
    if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self hidden] retain];}, YES);
		return [result autorelease];
	}
    
    return NUMBOOL([[self calendar] isImmutable]);
    
}

-(NSString*)name
{
    if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self name] retain];}, YES);
		return [result autorelease];
	}
    return [[self calendar] title];
}


@end

#endif
