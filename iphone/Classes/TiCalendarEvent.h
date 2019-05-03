/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

@import JavaScriptCore;
@import TitaniumKit.ObjcProxy;
@import EventKit;

@class CalendarModule; // forward declare
@class TiCalendarAlert;
@class TiCalendarAttendee;
@class TiCalendarRecurrenceRule;

@protocol TiCalendarEventExports <JSExport>
// properties (and accessors)
PROPERTY(NSArray<TiCalendarAlert *> *, alerts, Alerts);
PROPERTY(BOOL, allDay, AllDay);
READONLY_PROPERTY(NSArray<TiCalendarAttendee *> *, attendees, Attendees);
PROPERTY(EKEventAvailability, availability, Availability);
PROPERTY(NSDate *, begin, Begin);
PROPERTY(NSDate *, end, End);
READONLY_PROPERTY(BOOL, hasAlarm, HasAlarm);
READONLY_PROPERTY(NSString *, id, Id);
READONLY_PROPERTY(BOOL, isDetached, IsDetached);
PROPERTY(NSString *, location, Location);
PROPERTY(NSString *, notes, Notes);
PROPERTY(NSArray<TiCalendarRecurrenceRule *> *, recurrenceRules, RecurrenceRules);
READONLY_PROPERTY(EKEventStatus, status, Status);
PROPERTY(NSString *, title, Title);

// methods
- (void)addRecurrenceRule:(TiCalendarRecurrenceRule *)rule;
- (TiCalendarAlert *)createAlert:(NSDictionary *)properties;
- (TiCalendarRecurrenceRule *)createRecurrenceRule:(NSDictionary *)properties;
- (BOOL)refresh;
- (BOOL)remove:(EKSpan)span;
- (void)removeRecurrenceRule:(TiCalendarRecurrenceRule *)rule;
- (BOOL)save:(EKSpan)span;

@end

@interface TiCalendarEvent : ObjcProxy <TiCalendarEventExports> {
  @private

  CalendarModule *module;
  EKEvent *event;
}
- (id)initWithEvent:(EKEvent *)event_ calendar:(EKCalendar *)calendar_ module:(CalendarModule *)module_;
- (EKEvent *)event;
+ (NSArray<TiCalendarEvent *> *)convertEvents:(NSArray<EKEvent *> *)events_ calendar:(EKCalendar *)calendar_ module:(CalendarModule *)module_;

@end

#endif
