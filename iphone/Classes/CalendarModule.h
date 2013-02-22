/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_CALENDAR

#import <EventKit/EventKit.h>

#import "TiCalendarCalendar.h"
#import "TiCalendarAlert.h"
#import "TiCalendarEvent.h"
#import "TiCalendarReminder.h"


@interface CalendarModule : TiModule {
@private
    EKEventStore * store;
    
    //BOOL need boolean to support refresh option from Calendar module
    
    BOOL iOS6API;
  
}

-(EKEventStore*)store;

@property (nonatomic, readonly)NSNumber* STATUS_NONE;
@property (nonatomic, readonly)NSNumber* STATUS_CONFIRMED;
@property (nonatomic, readonly)NSNumber* STATUS_TENTATIVE;
@property (nonatomic, readonly)NSNumber* STATUS_CANCELED;

@property (nonatomic, readonly)NSNumber* AVAILABILITY_NOTSUPPORTED;
@property (nonatomic, readonly)NSNumber* AVAILABILITY_BUSY;
@property (nonatomic, readonly)NSNumber* AVAILABILITY_FREE;
@property (nonatomic, readonly)NSNumber* AVAILABILITY_TENTATIVE;
@property (nonatomic, readonly)NSNumber* AVAILABILITY_UNAVAILABLE;

@end

#endif