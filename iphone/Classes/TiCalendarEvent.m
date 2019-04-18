/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

#import "TiCalendarEvent.h"
#import "CalendarModule.h"
#import "TiCalendarAlert.h"
#import "TiCalendarAttendee.h"
#import "TiCalendarRecurrenceRule.h"
@import TitaniumKit.TiBase;
@import TitaniumKit.TiUtils;

@implementation TiCalendarEvent

#pragma mark - Internals

- (id)initWithEvent:(EKEvent *)event_ calendar:(EKCalendar *)calendar_ module:(CalendarModule *)module_
{
  if (self = [super init]) {
    module = [module_ retain];
    event = [event_ retain];
    event.calendar = calendar_;
  }
  return self;
}

- (void)_destroy
{
  RELEASE_TO_NIL(module);
  RELEASE_TO_NIL(event);
  [super _destroy];
}

- (EKEvent *)event
{
  return event;
}

- (NSString *)apiName
{
  return @"Ti.Calendar.Event";
}

+ (NSArray<TiCalendarEvent *> *)convertEvents:(NSArray<EKEvent *> *)events_ calendar:(EKCalendar *)calendar_ module:(CalendarModule *)module_
{
  NSMutableArray<TiCalendarEvent *> *events = [NSMutableArray arrayWithCapacity:[events_ count]];
  for (EKEvent *event_ in events_) {
    TiCalendarEvent *event = [[[TiCalendarEvent alloc] initWithEvent:event_
                                                            calendar:calendar_
                                                              module:module_] autorelease];
    [events addObject:event];
  }
  return events;
}

#pragma mark - Public API's

#define ENSURE_EVENT                                                 \
  EKEvent *currEvent = [self event];                                 \
  if (currEvent == NULL) {                                           \
    [self throwException:@"Cannot access event from the eventStore." \
               subreason:nil                                         \
                location:CODELOCATION];                              \
  }

// FIXME: Why do we care if this is done on main thread? API docs don't indicate need to...
#define EVENT_GETTER_PRIMITIVE(TYPE, NAME, PROP_NAME, DEFAULT) \
  -(TYPE)NAME                                                  \
  {                                                            \
    if (![NSThread isMainThread]) {                            \
      __block TYPE result;                                     \
      TiThreadPerformOnMainThread(^{                           \
        result = [self NAME];                                  \
      },                                                       \
          YES);                                                \
      return result;                                           \
    }                                                          \
                                                               \
    ENSURE_EVENT                                               \
    if (currEvent == NULL) {                                   \
      return DEFAULT;                                          \
    }                                                          \
    return currEvent.PROP_NAME;                                \
  }

#define EVENT_SETTER(TYPE, UPPER_PROP_NAME, EVENT_PROP_NAME) \
  -(void)set##UPPER_PROP_NAME : (TYPE)value                  \
  {                                                          \
    if (![NSThread isMainThread]) {                          \
      TiThreadPerformOnMainThread(^{                         \
        [self set##UPPER_PROP_NAME:value];                   \
      },                                                     \
          YES);                                              \
      return;                                                \
    }                                                        \
                                                             \
    ENSURE_EVENT                                             \
    if (currEvent == NULL) {                                 \
      return;                                                \
    }                                                        \
                                                             \
    currEvent.EVENT_PROP_NAME = value;                       \
  }

#define EVENT_GETTER(TYPE, NAME, PROP_NAME) \
  -(TYPE)NAME                               \
  {                                         \
    if (![NSThread isMainThread]) {         \
      __block TYPE result;                  \
      TiThreadPerformOnMainThread(^{        \
        result = [[self NAME] retain];      \
      },                                    \
          YES);                             \
      return [result autorelease];          \
    }                                       \
                                            \
    ENSURE_EVENT                            \
    if (currEvent == NULL) {                \
      return nil;                           \
    }                                       \
    return currEvent.PROP_NAME;             \
  }

EVENT_GETTER_PRIMITIVE(BOOL, allDay, allDay, NO);
EVENT_SETTER(BOOL, AllDay, allDay);
READWRITE_IMPL(BOOL, allDay, AllDay);

EVENT_GETTER_PRIMITIVE(EKEventAvailability, availability, availability, EKEventAvailabilityUnavailable);
EVENT_SETTER(EKEventAvailability, Availability, availability);
READWRITE_IMPL(EKEventAvailability, availability, Availability);

EVENT_GETTER(NSDate *, begin, startDate);
EVENT_SETTER(NSDate *, Begin, startDate);
READWRITE_IMPL(NSDate *, begin, Begin);

EVENT_GETTER(NSDate *, end, endDate);
EVENT_SETTER(NSDate *, End, endDate);
READWRITE_IMPL(NSDate *, end, End);

EVENT_GETTER_PRIMITIVE(BOOL, hasAlarm, hasAlarms, NO);
GETTER_IMPL(BOOL, hasAlarm, HasAlarm);

EVENT_GETTER(NSString *, id, eventIdentifier);
GETTER_IMPL(NSString *, id, Id);

EVENT_GETTER_PRIMITIVE(BOOL, isDetached, isDetached, NO);
GETTER_IMPL(BOOL, isDetached, IsDetached);

EVENT_GETTER(NSString *, location, location);
EVENT_SETTER(NSString *, Location, location);
READWRITE_IMPL(NSString *, location, Location);

EVENT_GETTER(NSString *, notes, notes);
EVENT_SETTER(NSString *, Notes, notes);
READWRITE_IMPL(NSString *, notes, Notes);

EVENT_GETTER_PRIMITIVE(EKEventStatus, status, status, EKEventStatusNone);
GETTER_IMPL(EKEventStatus, status, Status);

EVENT_GETTER(NSString *, title, title);
EVENT_SETTER(NSString *, Title, title);
READWRITE_IMPL(NSString *, title, Title);

- (NSArray<TiCalendarAlert *> *)alerts
{
  ENSURE_EVENT
  if (currEvent.hasAlarms) {
    NSArray *alarms_ = currEvent.alarms;
    NSMutableArray<TiCalendarAlert *> *alarms = [NSMutableArray arrayWithCapacity:[alarms_ count]];
    for (EKAlarm *alarm_ in alarms_) {
      TiCalendarAlert *alert = [[[TiCalendarAlert alloc] initWithAlert:alarm_ module:module] autorelease];
      [alarms addObject:alert];
    }
    return alarms;
  }
  return NULL;
}

- (void)setAlerts:(NSArray<TiCalendarAlert *> *)alerts
{
  ENSURE_EVENT
  NSMutableArray *alarms = [NSMutableArray arrayWithCapacity:[alerts count]];
  for (TiCalendarAlert *currAlert_ in alerts) {
    [alarms addObject:[currAlert_ alert]];
  }
  currEvent.alarms = alarms;
}
READWRITE_IMPL(NSArray<TiCalendarAlert *> *, alerts, Alerts);

- (NSArray<TiCalendarRecurrenceRule *> *)recurrenceRules
{
  ENSURE_EVENT
  NSArray *rules_ = currEvent.recurrenceRules;
  NSMutableArray *rules = [NSMutableArray arrayWithCapacity:[rules_ count]];
  for (EKRecurrenceRule *rule_ in rules_) {
    TiCalendarRecurrenceRule *rule = [[TiCalendarRecurrenceRule alloc] initWithRule:rule_];
    [rules addObject:rule];
    RELEASE_TO_NIL(rule);
  }
  return rules;
}

- (void)setRecurrenceRules:(NSArray<TiCalendarRecurrenceRule *> *)recurrenceRules
{
  if (![NSThread isMainThread]) {
    TiThreadPerformOnMainThread(^{
      [self setRecurrenceRules:recurrenceRules];
    },
        YES);
    return;
  }

  ENSURE_EVENT
  if (currEvent == NULL) {
    return;
  }

  NSMutableArray *rules = [NSMutableArray arrayWithCapacity:[recurrenceRules count]];
  for (TiCalendarRecurrenceRule *recurrenceRule_ in recurrenceRules) {
    EKRecurrenceRule *ruleToBeAdded = [recurrenceRule_ ruleForRecurrence];
    [rules addObject:ruleToBeAdded];
  }
  currEvent.recurrenceRules = rules;
}
READWRITE_IMPL(NSArray<TiCalendarRecurrenceRule *> *, recurrenceRules, RecurrenceRules);

- (TiCalendarAlert *)createAlert:(NSDictionary *)props
{
  if (![NSThread isMainThread]) {
    __block id result;
    TiThreadPerformOnMainThread(^{
      result = [[self createAlert:props] retain];
    },
        YES);
    return [result autorelease];
  }

  NSArray *keys = [props allKeys];
  if ([keys count] > 0) {
    NSString *key = [keys objectAtIndex:0];
    id value = [props objectForKey:key];

    EKAlarm *alarm = NULL;
    if ([key isEqualToString:@"absoluteDate"]) {
      alarm = [EKAlarm alarmWithAbsoluteDate:value];
    } else if ([key isEqualToString:@"relativeOffset"]) {
      alarm = [EKAlarm alarmWithRelativeOffset:([TiUtils doubleValue:value] / 1000)];
    } else {
      DebugLog(@"Invalid arg passed during creation of alert. Valid args type are `absoluteDate` or `relativeOffset`.");
      return NULL;
    }
    TiCalendarAlert *newalert = [[[TiCalendarAlert alloc] initWithAlert:alarm
                                                                 module:module] autorelease];
    return newalert;
  }
  return NULL;
}

- (TiCalendarRecurrenceRule *)createRecurrenceRule:(NSDictionary *)args
{
  EKRecurrenceFrequency frequency = EKRecurrenceFrequencyDaily;
  NSInteger interval = 0;
  NSMutableArray *daysOfTheWeek = [[[NSMutableArray alloc] init] autorelease],
                 *daysOfTheMonth = [[[NSMutableArray alloc] init] autorelease],
                 *monthsOfTheYear = [[[NSMutableArray alloc] init] autorelease],
                 *weeksOfTheYear = [[[NSMutableArray alloc] init] autorelease],
                 *daysOfTheYear = [[[NSMutableArray alloc] init] autorelease],
                 *setPositions = [[[NSMutableArray alloc] init] autorelease];
  EKRecurrenceEnd *end = nil;

  if ([args objectForKey:@"frequency"]) {
    frequency = [TiUtils intValue:[args objectForKey:@"frequency"]];
  }
  if ([args objectForKey:@"interval"]) {
    interval = [TiUtils intValue:[args objectForKey:@"interval"] def:1];
  }
  if ([args objectForKey:@"end"]) {
    id value = [args objectForKey:@"end"];
    ENSURE_TYPE_OR_NIL(value, NSDictionary);
    if ([value objectForKey:@"endDate"]) {
      end = [EKRecurrenceEnd recurrenceEndWithEndDate:[TiUtils dateForUTCDate:[value objectForKey:@"endDate"]]];
    } else if ([value objectForKey:@"occurrenceCount"]) {
      end = [EKRecurrenceEnd recurrenceEndWithOccurrenceCount:[TiUtils intValue:[value objectForKey:@"occurrenceCount"]]];
    } else {
      DebugLog(@"Key type not supported. Expected key types are `endDate` or `occurrenceCount`. Check documentation for more details");
    }
  }

  if (frequency != EKRecurrenceFrequencyDaily) {

    if ([args objectForKey:@"daysOfTheWeek"]) {
      id value = [args objectForKey:@"daysOfTheWeek"];
      ENSURE_TYPE_OR_NIL(value, NSArray);
      daysOfTheWeek = [NSMutableArray arrayWithCapacity:[value count]];
      for (NSDictionary *eachDay in value) {
        id dayofWeek = [eachDay objectForKey:@"dayOfWeek"];
        if (dayofWeek != NULL) {
          id week = [eachDay objectForKey:@"week"];
          if (week != NULL) {
            EKRecurrenceDayOfWeek *day = [EKRecurrenceDayOfWeek dayOfWeek:[TiUtils intValue:dayofWeek]
                                                               weekNumber:[TiUtils intValue:week]];
            [daysOfTheWeek addObject:day];
          } else {
            EKRecurrenceDayOfWeek *day = [EKRecurrenceDayOfWeek dayOfWeek:[TiUtils intValue:dayofWeek] weekNumber:0];
            [daysOfTheWeek addObject:day];
          }
        }
      }
    }
    if ([args objectForKey:@"setPositions"]) {
      id value = [args objectForKey:@"setPositions"];
      ENSURE_TYPE_OR_NIL(value, NSArray);
      setPositions = value;
    }

    if (frequency == EKRecurrenceFrequencyMonthly) {
      id value = [args objectForKey:@"daysOfTheMonth"];
      ENSURE_TYPE_OR_NIL(value, NSArray);
      if (value) {
        for (NSNumber *num in value) {
          int day = [num intValue];
          if ((day < -31) || (day > 31) || (day == 0)) {
            continue;
          } else {
            [daysOfTheMonth addObject:num];
          }
        }
      }
    } else if (frequency == EKRecurrenceFrequencyYearly) {
      if ([args objectForKey:@"monthsOfTheYear"]) {
        id value = [args objectForKey:@"monthsOfTheYear"];
        ENSURE_TYPE_OR_NIL(value, NSArray);
        for (NSNumber *month in value) {
          int month_ = [month intValue];
          if (month_ < 1 || month_ > 12) {
            continue;
          } else {
            [monthsOfTheYear addObject:month];
          }
        }
      }

      if ([args objectForKey:@"weeksOfTheYear"]) {
        id value = [args objectForKey:@"weeksOfTheYear"];
        ENSURE_TYPE_OR_NIL(value, NSArray);
        for (NSNumber *week in value) {
          int week_ = [week intValue];
          if (week_ < -53 || week_ > 53 || week_ == 0) {
            continue;
          } else {
            [weeksOfTheYear addObject:week];
          }
        }
      }

      if ([args objectForKey:@"daysOfTheYear"]) {
        id value = [args objectForKey:@"daysOfTheYear"];
        ENSURE_TYPE_OR_NIL(value, NSArray);
        for (NSNumber *days in value) {
          int days_ = [days intValue];
          if (days_ < -366 || days_ > 366 || days_ == 0) {
            continue;
          } else {
            [daysOfTheYear addObject:days];
          }
        }
      }
    }

    EKRecurrenceRule *rule = [[[EKRecurrenceRule alloc] initRecurrenceWithFrequency:frequency
                                                                           interval:interval
                                                                      daysOfTheWeek:daysOfTheWeek
                                                                     daysOfTheMonth:daysOfTheMonth
                                                                    monthsOfTheYear:monthsOfTheYear
                                                                     weeksOfTheYear:weeksOfTheYear
                                                                      daysOfTheYear:daysOfTheYear
                                                                       setPositions:setPositions
                                                                                end:end] autorelease];
    if (rule == NULL) {
      [self throwException:@"Error while trying to create recurrence rule."
                 subreason:nil
                  location:CODELOCATION];

      return NULL;
    }
    TiCalendarRecurrenceRule *recurrenceRule = [[[TiCalendarRecurrenceRule alloc] initWithRule:rule] autorelease];
    return recurrenceRule;
  } /*endof if (frequency != EKRecurrenceFrequencyDaily)*/
  else {
    EKRecurrenceRule *rule = [[[EKRecurrenceRule alloc] initRecurrenceWithFrequency:frequency interval:interval end:end] autorelease];
    if (rule == NULL) {
      [self throwException:@"Error while trying to create recurrence rule."
                 subreason:nil
                  location:CODELOCATION];

      return NULL;
    }
    TiCalendarRecurrenceRule *recurrenceRule = [[[TiCalendarRecurrenceRule alloc] initWithRule:rule] autorelease];
    return recurrenceRule;
  }
}

- (void)addRecurrenceRule:(TiCalendarRecurrenceRule *)ruleProxy
{
  if (![NSThread isMainThread]) {
    TiThreadPerformOnMainThread(^{
      [self addRecurrenceRule:ruleProxy];
    },
        YES);
    return;
  }

  EKEvent *currEvent = [self event];

  if (currEvent == NULL) {
    DebugLog(@"Cannot access event from the eventStore.");
    return;
  }

  EKRecurrenceRule *rule = [ruleProxy ruleForRecurrence];
  [currEvent addRecurrenceRule:rule];
}

- (void)removeRecurrenceRule:(TiCalendarRecurrenceRule *)ruleProxy
{
  if (![NSThread isMainThread]) {
    TiThreadPerformOnMainThread(^{
      [self removeRecurrenceRule:ruleProxy];
    },
        YES);
    return;
  }

  EKEvent *currEvent = [self event];

  if (currEvent == NULL) {
    DebugLog(@"Cannot access event from the eventStore.");
    return;
  }

  EKRecurrenceRule *rule = [ruleProxy ruleForRecurrence];
  [currEvent removeRecurrenceRule:rule];
}

- (BOOL)save:(EKSpan)span
{
  if ([[JSContext currentArguments] count] < 1) {
    span = EKSpanThisEvent;
  }
  EKEventStore *ourStore = [module store];
  if (ourStore == NULL) {
    DebugLog(@"Could not save event, missing Event Store");
    return NO;
  }
  EKEvent *currEvent = [self event];
  if (currEvent == NULL) {
    DebugLog(@"event is missing");
    return NO;
  }
  __block NSError *error = nil;
  __block BOOL result;
  TiThreadPerformOnMainThread(^{
    result = [ourStore saveEvent:currEvent span:span error:&error];
  },
      YES);

  if (!result || error != nil) {
    [self throwException:[NSString stringWithFormat:@"Failed to save event : %@", [TiUtils messageFromError:error]]
               subreason:nil
                location:CODELOCATION];
  }
  return result;
}

- (BOOL)remove:(EKSpan)span
{
  if ([[JSContext currentArguments] count] < 1) {
    span = EKSpanThisEvent;
  }
  EKEventStore *ourStore = [module store];
  __block NSError *error = nil;
  __block BOOL result;
  TiThreadPerformOnMainThread(^{
    result = [ourStore removeEvent:[self event] span:span error:&error];
  },
      YES);

  if (!result || error != nil) {
    [self throwException:[NSString stringWithFormat:@"Failed to remove event : %@", [TiUtils messageFromError:error]]
               subreason:nil
                location:CODELOCATION];
  }
  return result;
}

- (BOOL)refresh
{
  __block BOOL result;
  TiThreadPerformOnMainThread(^{
    result = [[self event] refresh];
  },
      YES);
  return result;
}

- (NSArray<TiCalendarAttendee *> *)attendees
{
  NSArray *participants = [[self event] attendees];
  NSMutableArray<TiCalendarAttendee *> *result = [NSMutableArray arrayWithCapacity:[participants count]];

  for (EKParticipant *participant in participants) {
    [result addObject:[[[TiCalendarAttendee alloc] initWithParticipant:participant] autorelease]];
  }

  return result;
}
GETTER_IMPL(NSArray<TiCalendarAttendee *> *, attendees, Attendees);

@end

#endif
