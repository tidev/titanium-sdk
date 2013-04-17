/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_CALENDAR

#import "CalendarModule.h"
#import "TiCalendarCalendar.h"

#pragma mark - Backwards compatibility for pre-iOS 6.0

#if __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_6_0
//TODO: Should we warn that they need to update to the latest XCode if this is happening?
#define EKAuthorizationStatusNotDetermined 0
#define EKAuthorizationStatusRestricted 1
#define EKAuthorizationStatusDenied 2
#define EKAuthorizationStatusAuthorized 3

enum {
    EKEntityTypeEvent,
    EKEntityTypeReminder
};
typedef NSUInteger EKEntityType;

#endif

@implementation CalendarModule

#pragma mark - internal methods

-(EKEventStore*)store
{
    if (store == nil) {
        store = [[EKEventStore alloc] init];
    }
  if (store == NULL) {
    DebugLog(@"[WARN] Could not access EventStore. ");
  } else {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(eventStoreChanged:) name:EKEventStoreChangedNotification object:nil];
  }
    return store;
}

-(NSArray*)allEventKitCalendars
{
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

-(void)startup
{
    [super startup];
    store = NULL;
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_6_0
    if ([EKEventStore respondsToSelector:@selector(authorizationStatusForEntityType:)]) {
         iOS6API = YES;
    }
#endif

}

-(void) eventStoreChanged:(NSNotification*)notification
{
    if([self _hasListeners:@"change"]) {
        [self fireEvent:@"change" withObject:nil];
    }
}


#pragma mark - Internal Memory Management

-(void)dealloc
{
	[super dealloc];
    [store release];
    [[NSNotificationCenter defaultCenter] removeObserver:self];
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
        TiCalendarCalendar* calendar = [[[TiCalendarCalendar alloc] _initWithPageContext:[self executionContext] calendar:calendar_ module:self] autorelease];
        [calendars addObject:calendar];
    }
    
    return calendars;
}

-(NSArray*)allEditableCalendars
{
    if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self allEditableCalendars] retain];}, YES);
		return [result autorelease];
	}
    
    NSArray* calendars_ = [self allEventKitCalendars];
    
    NSMutableArray* editableCalendars = [NSMutableArray array];
    for (EKCalendar* calendar_ in calendars_) {
        if ([calendar_ allowsContentModifications]) {
            TiCalendarCalendar* calendar = [[TiCalendarCalendar alloc] _initWithPageContext:[self executionContext] calendar:calendar_ module:self];
            [editableCalendars addObject:calendar];
        }
    }
    return editableCalendars;
}


-(TiCalendarCalendar*)getCalendarById:(id)arg
{
    if ([TiUtils isIOS5OrGreater]) {
        ENSURE_SINGLE_ARG(arg, NSString);
        
        if (![NSThread isMainThread]) {
            __block id result = nil;
            TiThreadPerformOnMainThread(^{result = [[self getCalendarById:arg] retain];}, YES);
            return [result autorelease];
        }
        
        EKEventStore* ourStore = [self store];
        if (ourStore  == NULL) {
            DebugLog(@"Could not instantiate an event of the event store.");
            return nil;
            
        }
        EKCalendar* calendar_ = [ourStore calendarWithIdentifier:arg];
        if (calendar_ == NULL) {
            return NULL;
        }
        TiCalendarCalendar* calendar = [[[TiCalendarCalendar alloc] _initWithPageContext:[self executionContext] calendar:calendar_ module:self] autorelease];
        return calendar;
    }
    else {
        DebugLog(@"Ti.Calendar.getCalendarById is only supported in iOS 5.0 and above.");
        return nil;
    }

}


-(TiCalendarCalendar*)defaultCalendar
{
    if (![NSThread isMainThread]) {
		__block id result = nil;
		TiThreadPerformOnMainThread(^{result = [[self defaultCalendar] retain];}, YES);
		return [result autorelease];
	}
    
    EKEventStore* ourStore = [self store];
    if (ourStore  == NULL) {
        DebugLog(@"Could not instantiate an event of the event store.");
        return nil;
        
    }
    EKCalendar* calendar_ = [ourStore defaultCalendarForNewEvents];
    if (calendar_ == NULL) {
        return nil;
    }
    TiCalendarCalendar* calendar = [[[TiCalendarCalendar alloc] _initWithPageContext:[self executionContext] calendar:calendar_ module:self] autorelease];    return calendar;
}

-(void) requestAuthorization:(id)args forEntityType:(EKEntityType)entityType
{
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
		
        EKEventStore* ourstore = [self store];
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

MAKE_SYSTEM_PROP(AUTHORIZATION_UNKNOWN, EKAuthorizationStatusNotDetermined);
MAKE_SYSTEM_PROP(AUTHORIZATION_RESTRICTED, EKAuthorizationStatusRestricted);
MAKE_SYSTEM_PROP(AUTHORIZATION_DENIED, EKAuthorizationStatusDenied);
MAKE_SYSTEM_PROP(AUTHORIZATION_AUTHORIZED, EKAuthorizationStatusAuthorized);

@end

#endif
