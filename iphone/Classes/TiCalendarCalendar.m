/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

#import "TiCalendarCalendar.h"
#import "CalendarModule.h"
#import "TiCalendarAlert.h"
#import "TiCalendarEvent.h"
#import "TiCalendarRecurrenceRule.h"
@import TitaniumKit.TiUtils;

#pragma mark -
@implementation TiCalendarCalendar

#pragma mark - Internals

- (id)initWithCalendar:(EKCalendar *)calendar_ module:(CalendarModule *)module_
{
  if (self = [super init]) {
    module = [module_ retain];
    calendar = [calendar_ retain];
    calendarId = [calendar calendarIdentifier];
  }

  return self;
}

- (void)_destroy
{
  RELEASE_TO_NIL(module);
  RELEASE_TO_NIL(calendar);
  [super _destroy];
}

- (NSString *)apiName
{
  return @"Ti.Calendar.Calendar";
}

- (EKCalendar *)calendar
{
  if (![NSThread isMainThread] || (module == NULL)) {
    return NULL;
  }

  if (calendar == NULL) {
    EKEventStore *store = [module store];
    if (store != NULL) {
      calendar = [store calendarWithIdentifier:calendarId];
    }
  }
  return calendar;
}

- (EKEventStore *)ourStore
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(^{
      result = [[self ourStore] retain];
    },
        YES);
    return [result autorelease];
  }
  EKEventStore *store = [module store];
  if (store == NULL) {
    DebugLog(@"Cannot access the Event Store");
    return nil;
  }
  return store;
}

- (NSArray<EKEvent *> *)_fetchAllEventsbetweenDate:(NSDate *)date1 andDate:(NSDate *)date2
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(^{
      result = [[self _fetchAllEventsbetweenDate:date1 andDate:date2] retain];
    },
        YES);
    return [result autorelease];
  }
  EKEventStore *ourStore = [self ourStore];
  if (ourStore != nil) {
    NSPredicate *predicate = [ourStore predicateForEventsWithStartDate:date1
                                                               endDate:date2
                                                             calendars:[NSArray arrayWithObject:[self calendar]]];
    return [ourStore eventsMatchingPredicate:predicate];
  }
  return NULL;
}

#pragma mark - Public API's

- (TiCalendarEvent *)createEvent:(NSDictionary *)properties
{
  if (![NSThread isMainThread]) {
    __block id result = nil;
    TiThreadPerformOnMainThread(^{
      result = [[self createEvent:properties] retain];
    },
        YES);
    return [result autorelease];
  }

  EKEventStore *ourStore = [self ourStore];

  if (ourStore != nil) {
    EKEvent *newEvent = [EKEvent eventWithEventStore:[module store]];
    if (newEvent == NULL) {
      [self throwException:@"Failed to create event."
                 subreason:nil
                  location:CODELOCATION];
      return nil;
    }
    TiCalendarEvent *event = [[[TiCalendarEvent alloc] initWithEvent:newEvent
                                                            calendar:[self calendar]
                                                              module:module] autorelease];

    [event setValuesForKeysWithDictionary:properties];

    return event;
  }
  return NULL;
}

- (TiCalendarEvent *)getEventById:(NSString *)eventId
{
  __block id result = NULL;
  TiThreadPerformOnMainThread(^{
    EKEventStore *ourStore = [self ourStore];
    if (ourStore == nil) {
      return;
    }
    result = [ourStore eventWithIdentifier:eventId];
  },
      YES);
  if (result != NULL) {
    EKEvent *event_ = [[self ourStore] eventWithIdentifier:eventId];
    TiCalendarEvent *event = [[[TiCalendarEvent alloc] initWithEvent:event_
                                                            calendar:event_.calendar
                                                              module:module] autorelease];
    return event;
  }
  return NULL;
}

- (NSArray *)getEventsBetweenDates:(NSDate *)start endDate:(NSDate *)end
{
  // FIXME: Handle String args too?
  //  if ([[args objectAtIndex:0] isKindOfClass:[NSDate class]] && [[args objectAtIndex:1] isKindOfClass:[NSDate class]]) {
  //    start = [args objectAtIndex:0];
  //    end = [args objectAtIndex:1];
  //  } else if ([[args objectAtIndex:0] isKindOfClass:[NSString class]] && [[args objectAtIndex:1] isKindOfClass:[NSString class]]) {
  //    start = [TiUtils dateForUTCDate:[args objectAtIndex:0]];
  //    end = [TiUtils dateForUTCDate:[args objectAtIndex:1]];
  //  }
  NSArray *events = [self _fetchAllEventsbetweenDate:start
                                             andDate:end];
  return [TiCalendarEvent convertEvents:events calendar:[self calendar] module:module];
}

- (NSString *)id
{
  return calendarId;
}
GETTER_IMPL(NSString *, id, Id);

- (BOOL)hidden
{
  if (![NSThread isMainThread]) {
    __block BOOL result;
    TiThreadPerformOnMainThread(^{
      result = [self hidden];
    },
        YES);
    return result;
  }

  return [[self calendar] isImmutable];
}
GETTER_IMPL(BOOL, hidden, Hidden);

- (NSString *)name
{
  if (![NSThread isMainThread]) {
    __block id result;
    TiThreadPerformOnMainThread(^{
      result = [[self name] retain];
    },
        YES);
    return [result autorelease];
  }
  return [[self calendar] title];
}
GETTER_IMPL(NSString *, name, Name);

- (NSString *)sourceTitle
{
  __block NSString *result;
  TiThreadPerformOnMainThread(^{
    result = [[[self calendar] source] title];
  },
      YES);

  return result;
}
GETTER_IMPL(NSString *, sourceTitle, SourceTitle);

- (EKSourceType)sourceType
{
  __block EKSourceType result;
  TiThreadPerformOnMainThread(^{
    result = [[[self calendar] source] sourceType];
  },
      YES);

  return result;
}
GETTER_IMPL(EKSourceType, sourceType, SourceType);

- (NSString *)sourceIdentifier
{
  __block NSString *result;
  TiThreadPerformOnMainThread(^{
    result = [[[self calendar] source] sourceIdentifier];
  },
      YES);

  return result;
}
GETTER_IMPL(NSString *, sourceIdentifier, SourceIdentifier);

@end

#endif
