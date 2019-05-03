/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

#import "TiCalendarRecurrenceRule.h"
#import "TiCalendarCalendar.h"
@import TitaniumKit.TiUtils;
@import EventKit;

@implementation TiCalendarRecurrenceRule

#pragma mark - Internals

- (id)initWithRule:(EKRecurrenceRule *)rule_
{
  if (self = [super init]) {
    rule = [rule_ retain];
  }
  return self;
}

- (void)_destroy
{
  RELEASE_TO_NIL(rule);
  [super _destroy];
}

- (EKRecurrenceRule *)ruleForRecurrence
{
  return rule;
}

- (NSString *)apiName
{
  return @"Ti.Calendar.RecurrenceRule";
}

#pragma mark - Public API's

#define ENSURE_RULE(DEFAULT)                             \
  EKRecurrenceRule *currRule = [self ruleForRecurrence]; \
  if (currRule == NULL) {                                \
    return DEFAULT;                                      \
  }

- (NSString *)calendarID
{
  ENSURE_RULE(NULL);
  return currRule.calendarIdentifier;
}
GETTER_IMPL(NSString *, calendarID, CalendarID);

- (NSArray<NSNumber *> *)daysOfTheMonth
{
  ENSURE_RULE(NULL);
  return [NSArray arrayWithArray:currRule.daysOfTheMonth];
}
GETTER_IMPL(NSArray<NSNumber *> *, daysOfTheMonth, DaysOfTheMonth);

- (NSArray<NSDictionary *> *)daysOfTheWeek
{
  ENSURE_RULE(NULL);
  NSArray *value = currRule.daysOfTheWeek;
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:[value count]];
  for (EKRecurrenceDayOfWeek *dayofWeek in value) {
    NSDictionary *props = @{
      @"dayOfWeek" : NUMINTEGER(dayofWeek.dayOfTheWeek),
      @"week" : NUMINTEGER(dayofWeek.weekNumber)
    };
    [result addObject:props];
  }
  return result;
}
GETTER_IMPL(NSArray<NSDictionary *> *, daysOfTheWeek, DaysOfTheWeek);

- (NSArray<NSNumber *> *)daysOfTheYear
{
  ENSURE_RULE(NULL);
  return [NSArray arrayWithArray:currRule.daysOfTheYear];
}
GETTER_IMPL(NSArray<NSNumber *> *, daysOfTheYear, DaysOfTheYear);

- (NSDictionary *)end
{
  ENSURE_RULE(NULL);
  EKRecurrenceEnd *end = currRule.recurrenceEnd;
  NSDictionary *recurrenceEnd = @{
    @"endDate" : end.endDate,
    @"occurrenceCount" : NUMUINTEGER(end.occurrenceCount)
  };
  return recurrenceEnd;
}
GETTER_IMPL(NSDictionary *, end, End);

- (EKRecurrenceFrequency)frequency
{
  ENSURE_RULE(EKRecurrenceFrequencyDaily);
  return currRule.frequency;
}
GETTER_IMPL(EKRecurrenceFrequency, frequency, Frequency);

- (NSUInteger)interval
{
  ENSURE_RULE(1);
  return currRule.interval;
}
GETTER_IMPL(NSUInteger, interval, Interval);

- (NSArray<NSNumber *> *)monthsOfTheYear
{
  ENSURE_RULE(NULL);
  return [NSArray arrayWithArray:currRule.monthsOfTheYear];
}
GETTER_IMPL(NSArray<NSNumber *> *, monthsOfTheYear, MonthsOfTheYear);

- (NSArray<NSNumber *> *)setPositions
{
  ENSURE_RULE(NULL);
  return [NSArray arrayWithArray:currRule.setPositions];
}
GETTER_IMPL(NSArray<NSNumber *> *, setPositions, SetPositions);

- (NSArray<NSNumber *> *)weeksOfTheYear
{
  ENSURE_RULE(NULL);
  return [NSArray arrayWithArray:currRule.weeksOfTheYear];
}
GETTER_IMPL(NSArray<NSNumber *> *, weeksOfTheYear, WeeksOfTheYear);

@end

#endif
