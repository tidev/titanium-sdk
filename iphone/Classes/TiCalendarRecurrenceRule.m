/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_CALENDAR

#import "TiCalendarCalendar.h"
#import "TiUtils.h"
#import "TiBlob.h"

#import "TiCalendarRecurrenceRule.h"


@implementation TiCalendarRecurrenceRule

-(id)_initWithPageContext:(id<TiEvaluator>)context rule:(EKRecurrenceRule*)rule_ {
    if (self= [super _initWithPageContext:context]) {
       rule = rule_;
    }
}

-(EKRecurrenceRule*)rule
{
    return rule;
}


-(id)valueForUndefinedKey:(NSString *)key
{
    if (rule == NULL) {
        return NULL;
    }
    if ([key isEqualToString:@"calendarId"]) {
        return rule.calendarIdentifier;
    }
    else if ([key isEqualToString:@"recurrenceEnd"]) {
        EKRecurrenceEnd  *end = rule.recurrenceEnd;
        NSDictionary *recurranceEnd = [NSDictionary dictionaryWithObjectsAndKeys:[TiUtils UTCDateForDate:end.endDate], @"endDate",
                                       NUMINT(end.occurrenceCount), @"occuranceCount", nil];
        return recurranceEnd;
    }
    else if ([key isEqualToString:@"frequency"]) {
        return NUMINT(rule.frequency);
    }
    else if ([key isEqualToString:@"interval"]) {
        return NUMINT(rule.interval);
    }
    else if ([key isEqualToString:@"firstDayOfTheWeek"]) {
        return NUMINT(rule.firstDayOfTheWeek);
    }
    else if ([key isEqualToString:@"daysOfTheWeek"]) {
        return rule.daysOfTheWeek;
    }
    else if ([key isEqualToString:@"daysOfTheMonth"]) {
        return rule.daysOfTheMonth;
    }
    else if ([key isEqualToString:@"daysOfTheYear"]) {
        return rule.daysOfTheYear;
    }
    else if ([key isEqualToString:@"weeksOfTheYear"]) {
        return rule.weeksOfTheYear;
    }
    else if ([key isEqualToString:@"monthsOfTheYear"]) {
        return rule.monthsOfTheYear;
    }
    else if ([key isEqualToString:@"setPositions"]) {
        return rule.setPositions;
    }
    else {
        return [super valueForUndefinedKey:key];
    }
    
    
}

-(void)dealloc
{
	[super dealloc];
    [rule release];
}



@end

#endif
