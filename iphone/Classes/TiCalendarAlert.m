/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

#import "TiCalendarAlert.h"
#import "TiCalendarEvent.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiCalendarAlert

- (id)_initWithPageContext:(id<TiEvaluator>)context
                     alert:(EKAlarm *)alert_
                    module:(CalendarModule *)module_
{
  if (self = [super _initWithPageContext:context]) {
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

- (NSNumber *)relativeOffset
{
  return NUMDOUBLE([self alert].relativeOffset * 1000);
}

- (void)setAbsoluteDate:(id)arg
{
  ENSURE_CLASS(arg, [NSDate class]);
  alert.absoluteDate = [TiUtils dateForUTCDate:arg];
}

- (void)setRelavtiveOffset:(id)arg
{
  alert.relativeOffset = [TiUtils doubleValue:arg] / 1000;
}

@end

#endif
