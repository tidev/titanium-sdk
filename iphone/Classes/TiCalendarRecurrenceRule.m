/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_CALENDAR

#import "TiCalendarCalendar.h"
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiUtils.h>

#import "TiCalendarRecurrenceRule.h"

@implementation TiCalendarRecurrenceRule

#pragma mark - Internals

- (id)_initWithPageContext:(id<TiEvaluator>)context rule:(EKRecurrenceRule *)rule_
{
  if (self = [super _initWithPageContext:context]) {
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

- (id)valueForUndefinedKey:(NSString *)key
{
  EKRecurrenceRule *currRule = [self ruleForRecurrence];
  if (currRule == NULL) {
    return NULL;
  }
  if ([key isEqualToString:@"calendarId"]) {
    return currRule.calendarIdentifier;
  } else if ([key isEqualToString:@"end"]) {
    EKRecurrenceEnd *recurrenceEnd = currRule.recurrenceEnd;
    NSMutableDictionary *recurrenceEndDictionary = [NSMutableDictionary dictionaryWithObject:@(recurrenceEnd.occurrenceCount)
                                                                                      forKey:@"occurrenceCount"];
    if ([recurrenceEnd endDate] != nil) {
      [recurrenceEndDictionary setObject:[TiUtils UTCDateForDate:[recurrenceEnd endDate]] forKey:@"endDate"];
    }
    return recurrenceEndDictionary;
  } else if ([key isEqualToString:@"frequency"]) {
    return NUMINT(currRule.frequency);
  } else if ([key isEqualToString:@"interval"]) {
    return NUMINTEGER(currRule.interval);
  } else if ([key isEqualToString:@"firstDayOfTheWeek"]) {
    return NUMINTEGER(currRule.firstDayOfTheWeek);
  } else if ([key isEqualToString:@"daysOfTheWeek"]) {
    NSArray *daysOfTheWeek = currRule.daysOfTheWeek;
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:[daysOfTheWeek count]];
    for (EKRecurrenceDayOfWeek *dayofWeek in daysOfTheWeek) {
      [result addObject:@{
        @"week" : @(dayofWeek.weekNumber),
        @"dayofWeek" : @(dayofWeek.dayOfTheWeek)
      }];
    }
    return result;
  } else if ([key isEqualToString:@"daysOfTheMonth"]) {
    return [NSArray arrayWithArray:currRule.daysOfTheMonth];
  } else if ([key isEqualToString:@"daysOfTheYear"]) {
    return [NSArray arrayWithArray:currRule.daysOfTheYear];
  } else if ([key isEqualToString:@"weeksOfTheYear"]) {
    return [NSArray arrayWithArray:currRule.weeksOfTheYear];
  } else if ([key isEqualToString:@"monthsOfTheYear"]) {
    return [NSArray arrayWithArray:currRule.monthsOfTheYear];
  } else if ([key isEqualToString:@"setPositions"]) {
    return [NSArray arrayWithArray:currRule.setPositions];
  } else {
    return [super valueForUndefinedKey:key];
  }
}

@end

#endif
