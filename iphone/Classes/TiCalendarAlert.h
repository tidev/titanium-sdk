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

@interface TiCalendarAlert : TiProxy {

@private
    CalendarModule* module;
    EKAlarm* alert;
}

-(id)_initWithPageContext:(id<TiEvaluator>)context
                    alert:(EKAlarm*)alert_
                   module:(CalendarModule*)module_;

-(EKAlarm*)alert;
@end
    
#endif
