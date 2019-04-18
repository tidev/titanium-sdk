/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

#import "TiCalendarAlert.h"
@import TitaniumKit.TiUtils;
@import EventKit;

@implementation TiCalendarAlert

- (id)initWithAlert:(EKAlarm *)alert_
             module:(CalendarModule *)module_
{
  if (self = [super init]) {
    module = [module_ retain];
    alert = [alert_ retain];
  }
  return self;
}

- (void)_destroy
{
  RELEASE_TO_NIL(module);
  RELEASE_TO_NIL(alert);
  [super _destroy];
}

- (NSString *)apiName
{
  return @"Ti.Calendar.Alert";
}

- (EKAlarm *)alert
{
  return alert;
}

- (NSDate *)absoluteDate
{
  return [self alert].absoluteDate;
}
READWRITE_IMPL(NSDate *, absoluteDate, AbsoluteDate);

- (double)relativeOffset
{
  return [self alert].relativeOffset * 1000;
}
READWRITE_IMPL(double, relativeOffset, RelativeOffset);

- (void)setAbsoluteDate:(NSDate *)absoluteDate
{
  alert.absoluteDate = absoluteDate;
}

- (void)setRelativeOffset:(double)relativeOffset
{
  alert.relativeOffset = relativeOffset / 1000;
}

@end

#endif
