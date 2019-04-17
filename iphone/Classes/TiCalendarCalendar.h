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

@class CalendarModule;
@class TiCalendarEvent;

@protocol TiCalendarCalendarExports <JSExport>
// properties (and accessors)
READONLY_PROPERTY(BOOL, hidden, Hidden);
READONLY_PROPERTY(NSString *, id, Id);
READONLY_PROPERTY(NSString *, name, Name);
//READONLY_PROPERTY(BOOL, selected, Selected); // not implemented on iOS
READONLY_PROPERTY(NSString *, sourceIdentifier, SourceIdentifier);
READONLY_PROPERTY(NSString *, sourceTitle, SourceTitle);
READONLY_PROPERTY(EKSourceType, sourceType, SourceType);

// methods
- (TiCalendarEvent *)createEvent:(NSDictionary *)properties;
- (TiCalendarEvent *)getEventById:(NSString *)eventId;
JSExportAs(getEventsBetweenDates,
           -(NSArray *)getEventsBetweenDates
           : (NSDate *)date1 endDate
           : (NSDate *)date2);
@end

@interface TiCalendarCalendar : ObjcProxy <TiCalendarCalendarExports> {
  @private
  EKCalendar *calendar;
  NSString *calendarId;

  CalendarModule *module;
}

@property (readonly, nonatomic) EKCalendar *calendar;
- (id)initWithCalendar:(EKCalendar *)calendar_ module:(CalendarModule *)module_;

@end

#endif
