/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
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

typedef void(^EKEventStoreRequestAccessCompletionHandler)(BOOL granted, NSError *error);


@protocol EKEventStoreIOS6Support <NSObject>
@optional
+ (NSInteger)authorizationStatusForEntityType:(EKEntityType)entityType;
- (void)requestAccessToEntityType:(EKEntityType)entityType completion:(EKEventStoreRequestAccessCompletionHandler)completion;
@end

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
    return [ourStore calendarsForEntityType:EKEntityTypeEvent];
}

-(NSString*)apiName
{
    return @"Ti.Calendar";
}

-(void)startup
{
    [super startup];
    store = NULL;
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
    EKCalendar* calendar_ = NULL;
    if ([TiUtils isIOS8OrGreater]) {
        //Instead of getting calendar by identifier, have to get all and check for match
        //not optimal but best way to fix non existing shared calendar error
        NSArray *allCalendars = [ourStore calendarsForEntityType:EKEntityTypeEvent];
        for (EKCalendar *cal in allCalendars) {
            if ([cal.calendarIdentifier isEqualToString:arg]) {
                calendar_ = cal;
                break;
            }
        }
    }
    else {
        calendar_ = [ourStore calendarWithIdentifier:arg];
    }
    if (calendar_ == NULL) {
        return NULL;
    }
    TiCalendarCalendar* calendar = [[[TiCalendarCalendar alloc] _initWithPageContext:[self executionContext] calendar:calendar_ module:self] autorelease];
    return calendar;
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
    BOOL doPrompt = NO;
    
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
			break;
        case EKAuthorizationStatusRestricted:
            code = EKAuthorizationStatusRestricted;
            errorStr = @"The user is unable to allow access to events in Calendar.";
        default:
            break;
    }
	
    if (!doPrompt) {
        NSDictionary * propertiesDict = [TiUtils dictionaryWithCode:code message:errorStr];
        NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
        
        [callback call:invocationArray thisObject:self];
        [invocationArray release];
        return;
    }
    TiThreadPerformOnMainThread(^(){
		
        EKEventStore* ourstore = [self store];
        [ourstore requestAccessToEntityType:EKEntityTypeEvent
                                 completion:^(BOOL granted, NSError *error){
                                     NSDictionary* propertiesDict;
                                     if (error == nil) {
                                         propertiesDict = [TiUtils dictionaryWithCode:(granted ? 0 : 1) message:nil];
                                     } else {
                                         propertiesDict = [TiUtils dictionaryWithCode:[error code]
                                                                              message:[TiUtils messageFromError:error]];
                                     }
                                     KrollEvent * invocationEvent = [[KrollEvent alloc] initWithCallback:callback eventObject:propertiesDict thisObject:self];
                                     [[callback context] enqueue:invocationEvent];
									 RELEASE_TO_NIL(invocationEvent);
                                 }];
    }, NO);
}

#pragma mark - Public API

-(NSNumber*) hasCalendarPermissions:(id)unused
{
    return NUMBOOL([EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent] == EKAuthorizationStatusAuthorized);
}

-(void) requestEventsAuthorization:(id)args
{
    DEPRECATED_REPLACED(@"Calendar.requestEventsAuthorization", @"5.1.0", @"Calendar.requestCalendarPermissions");
    [self requestCalendarPermissions:args];
}

-(void) requestCalendarPermissions:(id)args
{
    ENSURE_SINGLE_ARG(args, KrollCallback);
    [self requestAuthorization:args forEntityType:EKEntityTypeEvent];
}

// Not documented + used, yet. Part of the 5.2.0 release.
-(void) requestRemindersPermissions:(id)args
{
    ENSURE_SINGLE_ARG(args, KrollCallback);
    [self requestAuthorization:args forEntityType:EKEntityTypeReminder];
}

-(NSNumber*) eventsAuthorization
{
    EKAuthorizationStatus result = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
    return [NSNumber numberWithInteger:result];
}
#pragma mark - Properties

MAKE_SYSTEM_PROP(STATUS_NONE,EKEventStatusNone);
MAKE_SYSTEM_PROP(STATUS_CONFIRMED,EKEventStatusConfirmed);
MAKE_SYSTEM_PROP(STATUS_TENTATIVE,EKEventStatusTentative);
MAKE_SYSTEM_PROP(STATUS_CANCELLED,EKEventStatusCanceled);

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
