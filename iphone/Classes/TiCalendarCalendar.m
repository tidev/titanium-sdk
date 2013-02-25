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

#pragma mark - Backwards compatibility for pre-iOS 6.0

#if __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_6_0
//TODO: Should we warn that they need to update to the latest XCode if this is happening?
#define EKAuthorizationStatusNotDetermined 0
#define EKAuthorizationStatusRestricted 1
#define EKAuthorizationStatusDenied 2
#define EKAuthorizationStatusAuthorized 3
#endif

#pragma mark -
@implementation TiCalendarCalendar

#pragma mark - Internals

-(id)_initWithPageContext:(id<TiEvaluator>)context calendarId:(NSString*)id_ module:(CalendarModule*)module_
{
    if (self = [super _initWithPageContext:context]) {
        module= module_;
        calendarId = id_;
        calendar = NULL;
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_6_0
        if ([EKEventStore respondsToSelector:@selector(authorizationStatusForEntityType:)]) {
            iOS6API = YES;
        }
#endif
    }
}

-(void)dealloc
{
	[super dealloc];
    [calendar release];
    [module release];
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
        [self throwException:@"Cannot access the Event Store"
                   subreason:nil
                    location:CODELOCATION];
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

-(void) requestAuthorization:(id)args forEntityType:(EKEntityType)entityType {
    ENSURE_SINGLE_ARG(args, KrollCallback);
	KrollCallback * callback = args;
	NSString * errorStr = nil;
	int code = 0;
	bool doPrompt = NO;
    
    
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_6_0
    if (iOS6API) {
        
        long int permissions = [EKEventStore authorizationStatusForEntityType:entityType];
		switch (permissions) {
			case EKAuthorizationStatusNotDetermined:
				doPrompt = YES;
				break;
			case EKAuthorizationStatusAuthorized:
				break;
			case EKAuthorizationStatusDenied:
				code = EKAuthorizationStatusDenied;
				errorStr = @"The user has denied access to events in Calendar.";
			case EKAuthorizationStatusRestricted:
				code = EKAuthorizationStatusRestricted;
				errorStr = @"The user is unable to allow access to events in Calendar.";
			default:
				break;
		}
	}
#endif
    
	if (!doPrompt) {
		NSDictionary * propertiesDict = [TiUtils dictionaryWithCode:code message:errorStr];
		NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
        
		[callback call:invocationArray thisObject:self];
		[invocationArray release];
		return;
	}
    
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_6_0
	TiThreadPerformOnMainThread(^(){
		
        EKEventStore* ourstore = [module store];
        [ourstore requestAccessToEntityType:EKEntityTypeEvent
                                 completion:^(BOOL granted, NSError *error){
                                     NSDictionary *propertiesDict = [TiUtils dictionaryWithCode:[error code]
                                                                                        message:[TiUtils messageFromError:error]];
                                     KrollEvent * invocationEvent = [[KrollEvent alloc] initWithCallback:callback eventObject:propertiesDict thisObject:self];
                                     [[callback context] enqueue:invocationEvent];
                                     
                                     
                                 }];
	}, NO);
#endif
}


#pragma mark - Public API

-(void) requestEventsAuthorization:(id)args
{
    ENSURE_SINGLE_ARG(args, KrollCallback);
    [self requestAuthorization:args forEntityType:EKEntityTypeEvent];
}

-(void) requestRemindersAuthorization:(id)args
{
    ENSURE_SINGLE_ARG(args, KrollCallback);
    [self requestAuthorization:args forEntityType:EKEntityTypeReminder];
}

-(NSNumber*) eventsAuthorization
{
    long int result = EKAuthorizationStatusAuthorized;
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_6_0
    if (iOS6API) { //in iOS 5.1 and below: no need to check for authorization.
        result = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
    }
#endif
    return [NSNumber numberWithLong:result];
}

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
                                                                         module:module] autorelease];
        
        [event setValuesForKeysWithDictionary:args];
        if (args != nil) {
            //[self save:nil];
        }
        return event;
    }
    return NULL;
}

-(TiCalendarRecurrenceRule*)createReccurenceRule:(id)args
{
    ENSURE_DICT(args);
    EKRecurrenceFrequency frequency = EKRecurrenceFrequencyDaily;
    NSInteger interval = 0;
    NSArray *days, *monthDays, *daysOfTheWeek, *daysOfTheMonth, *monthsOfTheYear, *weeksOfTheYear, *daysOfTheYear, *setPositions;
    EKRecurrenceEnd* end = nil;
    for (NSString* key in args) {
        id value = [args objectForKey:key];
        
        if ([key isEqualToString:@"frequency"] ) {
            frequency = [TiUtils intValue:value];
        }
        else if ([key isEqualToString:@"interval"]) {
            interval = [TiUtils intValue:value];
        }
        else if ([key isEqualToString:@"days"]) {
            ENSURE_TYPE_OR_NIL(value,NSArray);
            days = value;
        }
        else if ([key isEqualToString:@"monthDays"]) {
            ENSURE_TYPE_OR_NIL(value,NSArray);
            monthDays = value;
        }
        else if ([key isEqualToString:@"daysOfTheWeek"]) {
            ENSURE_TYPE_OR_NIL(value,NSArray);
            daysOfTheWeek = value;
        }
        else if ([key isEqualToString:@"daysOfTheMonth"]) {
            ENSURE_TYPE_OR_NIL(value,NSArray);
            daysOfTheMonth = value;
        }
        else if ([key isEqualToString:@"monthsOfTheYear"]) {
            ENSURE_TYPE_OR_NIL(value,NSArray);
            monthsOfTheYear = value;
        }
        else if ([key isEqualToString:@"weeksOfTheYear"]) {
            ENSURE_TYPE_OR_NIL(value,NSArray);
            weeksOfTheYear = value;
        }
        else if ([key isEqualToString:@"daysOfTheYear"]) {
            ENSURE_TYPE_OR_NIL(value,NSArray);
            daysOfTheYear = value;
        }
        else if ([key isEqualToString:@"setPositions"]) {
            ENSURE_TYPE_OR_NIL(value,NSArray);
            setPositions = value;
        }
        else if ([key isEqualToString:@"end"]) {
            ENSURE_TYPE_OR_NIL(value, NSDictionary);
            if ([value objectForKey:@"endDate"]) {
                end = [EKRecurrenceEnd recurrenceEndWithEndDate:[TiUtils dateForUTCDate:[value objectForKey:@"endDate"]]];
            }
            else if ([value objectForKey:@"occurrenceCount"]) {
                end = [EKRecurrenceEnd recurrenceEndWithOccurrenceCount:[TiUtils intValue:[value objectForKey:@"occurrenceCount"]]];
            }
            else {
                DebugLog(@"Key type not supported. Expected key types are `endDate` or `occurrenceCount`. Check documentation for more details");
            }
        }
        else {
            DebugLog(@"Key type:%s is not supported. Please check documentation for supported key types.", key);
        }
        
        EKRecurrenceRule* rule = [[[EKRecurrenceRule alloc] initRecurrenceWithFrequency:frequency
                                                                               interval:interval
                                                                          daysOfTheWeek:daysOfTheWeek
                                                                         daysOfTheMonth:daysOfTheMonth
                                                                        monthsOfTheYear:monthsOfTheYear
                                                                         weeksOfTheYear:weeksOfTheYear
                                                                          daysOfTheYear:daysOfTheYear
                                                                           setPositions:setPositions
                                                                                    end:end] autorelease];
        if (rule == NULL) {
            [self throwException:@"Error while trying to create recurrance rule."
                       subreason:nil
                        location:CODELOCATION];
            
            return NULL;
        }
        TiCalendarRecurrenceRule* recurranceRule = [[[TiCalendarRecurrenceRule alloc] _initWithPageContext:[self executionContext]
                                                                                                      rule:rule] autorelease];
        return recurranceRule;
    }
}


-(TiCalendarEvent*)getEventById:(id)arg
{
    ENSURE_SINGLE_ARG(arg, NSString);
    __block NSString* eventId = [TiUtils stringValue:arg];
	__block BOOL validId = NO;
    __block id result = NULL;
	dispatch_sync(dispatch_get_main_queue(),^{
        EKEventStore* ourStore = [self ourStore];
        if (ourStore == nil) {
            return ;
        }
        result = [ourStore eventWithIdentifier:[TiUtils stringValue:arg]];
        if (result != NULL){
            validId = YES;
        }
        
    });
    if (validId == YES) {
        TiCalendarEvent* event = [[[TiCalendarEvent alloc] _initWithPageContext:[self executionContext]
                                                                        event:(EKEvent*)result
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
    return [TiCalendarEvent convertEvents:events withContext:[self executionContext] module:module];
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
    
    NSArray* events = [self _fetchAllEventsbetweenDate:date1 andDate:date2];
    return [TiCalendarEvent convertEvents:events withContext:[self executionContext] module:module];
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
    
    NSArray* events = [self _fetchAllEventsbetweenDate:date1 andDate:date2];
    return [TiCalendarEvent convertEvents:events withContext:[self executionContext] module:module];
}

-(NSArray*)getEventsInYear:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
    
    NSDateComponents *comps = [[NSDateComponents alloc] init];
    
    
    [comps setDay:1];
    [comps setMonth:1];
    [comps setYear:[TiUtils intValue:[args objectAtIndex:0]]];
    [comps setHour:0];
    [comps setMinute:0];
    [comps setSecond:0];
    
    NSCalendar *cal = [[NSCalendar alloc] initWithCalendarIdentifier:NSGregorianCalendar];
    
    NSDate *date1, *date2;
    date1 = [cal dateFromComponents:comps];
    
    NSTimeInterval secondsPerDay = 24 * 60 * 60;
    NSRange days = [cal rangeOfUnit:NSDayCalendarUnit
                             inUnit:NSYearCalendarUnit
                            forDate:date1];
    
    date2 = [date1 dateByAddingTimeInterval:(secondsPerDay * days.length)];
    
    [comps release];
    
    NSArray* events = [self _fetchAllEventsbetweenDate:date1 andDate:date2];
    return [TiCalendarEvent convertEvents:events withContext:[self executionContext] module:module];

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

-(NSString*)calendarid
{
    return calendarId;
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
