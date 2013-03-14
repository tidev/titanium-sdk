/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_CALENDAR

#import <EventKit/EventKit.h>
@class CalendarModule;

@interface TiCalendarEvent : TiProxy {
@private
    
    CalendarModule* module;
    EKEvent* event;
}
-(id)_initWithPageContext:(id<TiEvaluator>)context event:(EKEvent*)event_ calendar:(EKCalendar*)calendar_ module:(CalendarModule*)module_;
-(EKEvent*)event;
+(NSArray*) convertEvents:(NSArray*)events_ withContext:(id<TiEvaluator>)context_  calendar:(EKCalendar*)calendar_ module:(CalendarModule*)module_;


@end

#endif