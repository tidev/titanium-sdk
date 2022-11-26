/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR
@import JavaScriptCore;
@import TitaniumKit.ObjcProxy;
@import EventKit;

@protocol TiCalendarRecurrenceRuleExports <JSExport>

// properties (and accessors)
READONLY_PROPERTY(NSString *, calendarID, CalendarID);
READONLY_PROPERTY(NSArray<NSNumber *> *, daysOfTheMonth, DaysOfTheMonth);
READONLY_PROPERTY(NSArray<NSDictionary *> *, daysOfTheWeek, DaysOfTheWeek);
READONLY_PROPERTY(NSArray<NSNumber *> *, daysOfTheYear, DaysOfTheYear);
READONLY_PROPERTY(NSDictionary *, end, End);
READONLY_PROPERTY(EKRecurrenceFrequency, frequency, Frequency);
READONLY_PROPERTY(NSUInteger, interval, Interval);
READONLY_PROPERTY(NSArray<NSNumber *> *, monthsOfTheYear, MonthsOfTheYear);
READONLY_PROPERTY(NSArray<NSNumber *> *, setPositions, SetPositions);
READONLY_PROPERTY(NSArray<NSNumber *> *, weeksOfTheYear, WeeksOfTheYear);

@end

@interface TiCalendarRecurrenceRule : ObjcProxy <TiCalendarRecurrenceRuleExports> {
  @private

  EKRecurrenceRule *rule;
}

/**
  @deprecated Only here for backwards compatibility with SDK < 8.1.0. Use `initWithRule:` instead.
  */
- (id)_initWithPageContext:(id<TiEvaluator>)context rule:(EKRecurrenceRule *)rule_ __attribute__((deprecated));
- (id)initWithRule:(EKRecurrenceRule *)rule_;
- (EKRecurrenceRule *)ruleForRecurrence;
@end

#endif
