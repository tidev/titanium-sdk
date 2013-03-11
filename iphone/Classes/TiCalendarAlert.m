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
                   module:(CalendarModule*)module_
{
    if (self = [super _initWithPageContext:context]) {
        module = [module_ retain];
        alert = [alert_ retain];
    }
    return self;
}

-(void)_destroy
{
	RELEASE_TO_NIL(module);
	RELEASE_TO_NIL(alert);
    [super _destroy];
}

-(EKAlarm*)alert
{
    return alert;
}

-(NSString*)absoluteDate
{
    return [TiUtils UTCDateForDate:alert.absoluteDate];
}

-(NSNumber*)relativeOffset
{
    return NUMINT(alert.relativeOffset);
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
