/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiCalendarAlert.h"
#import "TiCalendarEvent.h"
#import "TiUtils.h"
#import "TiBlob.h"

@implementation TiCalendarAlert

-(id)_initWithPageContext:(id<TiEvaluator>)context
                    alert:(EKAlarm*)alert_
                  eventId:(NSString*)eventId_
                   module:(CalendarModule*)module_
{
    module = module_;
    eventId = eventId_;
    alert = alert_;
}

-(NSString*)absoluteDate
{
    return [TiUtils UTCDateForDate:alert.absoluteDate];
}

-(NSNumber*)relativeOffset
{
    return NUMINT(alert.relativeOffset);
}

-(NSString*)eventId
{
    return eventId;
}

-(void)setAbsoluteDate:(id)arg
{
    ENSURE_CLASS(arg, [NSDate class]);
    alert.absoluteDate = [TiUtils dateForUTCDate:arg];
}


-(void)setRelavtiveOffset:(id)arg
{
    ENSURE_TYPE(arg, NSNumber);
    alert.relativeOffset = [arg doubleValue];
}


@end
