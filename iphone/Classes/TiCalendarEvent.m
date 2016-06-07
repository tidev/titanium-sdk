/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CALENDAR

#import "CalendarModule.h"
#import "TiCalendarEvent.h"
#import "TiCalendarAlert.h"
#import "TiCalendarRecurrenceRule.h"

@implementation TiCalendarEvent

#pragma mark - Internals 

-(id)_initWithPageContext:(id<TiEvaluator>)context event:(EKEvent*)event_ calendar:(EKCalendar*)calendar_ module:(CalendarModule*)module_
{
    if (self = [super _initWithPageContext:context]) {
        module= [module_ retain];
        event = [event_ retain];
        event.calendar = calendar_;
    }
    return self;
}

-(void)_destroy
{
	RELEASE_TO_NIL(module);
	RELEASE_TO_NIL(event);
    [super _destroy];
}

-(EKEvent*) event
{
    return event;
}

-(NSString*)apiName
{
    return @"Ti.Calendar.Event";
}


+(NSArray*) convertEvents:(NSArray*)events_ withContext:(id<TiEvaluator>)context_  calendar:(EKCalendar*)calendar_ module:(CalendarModule*)module_
{
    NSMutableArray* events = [NSMutableArray arrayWithCapacity:[events_ count]];
    for (EKEvent* event_ in events_) {
        TiCalendarEvent* event = [[[TiCalendarEvent alloc] _initWithPageContext:context_
                                                                       event:event_
                                                                        calendar:calendar_
                                                                        module:module_] autorelease];
        [events addObject:event];
    }
    return events;
}

#pragma mark - Public API's

-(id)valueForUndefinedKey:(NSString *)key
{
    if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self valueForUndefinedKey:key] retain];}, YES);
		return [result autorelease];
	}
    
    EKEvent* currEvent = [self event];
    
    if (currEvent == NULL) {
        [self throwException:@"Cannot access event from the eventStore."
                   subreason:nil
                    location:CODELOCATION];

		return nil;
    }
    
    if ([key isEqualToString:@"title"]) {
        return currEvent.title;
    }
    else if ([key isEqualToString:@"notes"]) {
        return [TiUtils stringValue:currEvent.notes];
    }
    else if ([key isEqualToString:@"begin"]) {
        return [TiUtils UTCDateForDate:currEvent.startDate];
    }
    else if ([key isEqualToString:@"end"]) {
        return [TiUtils UTCDateForDate:currEvent.endDate];
    }
    else if ([key isEqualToString:@"location"]) {
        return currEvent.location;
    }
    else if ([key isEqualToString:@"availability"]) {
        return NUMINT(currEvent.availability);
    }
    else if ([key isEqualToString:@"status"]) {
        return NUMINT(currEvent.status);
    }
    else if ([key isEqualToString:@"hasAlarm"]) {
        return NUMBOOL(currEvent.hasAlarms);
    }
    else if ([key isEqualToString:@"allDay"]) {
        return NUMBOOL(currEvent.allDay);
    }
    else if ([key isEqualToString:@"id"]) {
        return currEvent.eventIdentifier;
    }
    else if ([key isEqualToString:@"isDetached"]) {
        return NUMBOOL(currEvent.isDetached);
    }
    else if ([key isEqualToString:@"recurrenceRules"])
    {
        NSArray* rules_ = currEvent.recurrenceRules;
        NSMutableArray *rules = [NSMutableArray arrayWithCapacity:[rules_ count]];
        for (EKRecurrenceRule* rule_ in rules_) {
            TiCalendarRecurrenceRule* rule = [[TiCalendarRecurrenceRule alloc] _initWithPageContext:[self executionContext] rule:rule_];
            [rules addObject:rule];
			RELEASE_TO_NIL(rule);
        }
        return rules;
     }
    else if ([key isEqualToString:@"recurrenceRule"])
    {
        DebugLog(@"[ERROR]Ti.Calendar.Event.recurrenceRule is no longer supported. Use Ti.Calendar.Event.recurrenceRules.");
        return nil;
    }
    else if ([key isEqualToString:@"alerts"]) {
        if (currEvent.hasAlarms) {
            NSArray* alarms_ = currEvent.alarms;
            NSMutableArray* alarms = [NSMutableArray arrayWithCapacity:[alarms_ count]];
            for (EKAlarm* alarm_ in alarms_) {
                TiCalendarAlert* alert = [[[TiCalendarAlert alloc] _initWithPageContext:[self executionContext] alert:alarm_ module:module] autorelease];
                [alarms addObject:alert];
            }
            return alarms;
        }
        return NULL;
    }
    // Something else
	else {
		id result = [super valueForUndefinedKey:key];
		return result;
	}
}


-(void) setValue:(id)value forUndefinedKey:(NSString*)key
{
	if (![NSThread isMainThread]) {
		TiThreadPerformOnMainThread(^{[self setValue:value forUndefinedKey:key];}, YES);
		return;
	}
    
    EKEvent* currEvent = [self event];
    
    if (currEvent == NULL) {
        DebugLog(@"Cannot access event from the eventStore.");
		return;
    }
    
    if ([key isEqualToString:@"allDay"]) {
        currEvent.allDay = [TiUtils boolValue:value def:NO];
        return;
    }
    else if ([key isEqualToString:@"notes"]) {
        currEvent.notes = [TiUtils stringValue:value];
        return;
	}
    else if ([key isEqualToString:@"begin"]) {
        currEvent.startDate = value;
        return;
    }
    else if ([key isEqualToString:@"end"]) {
        currEvent.endDate = value;
        return;
    }
    else if ([key isEqualToString:@"availability"]) {
        currEvent.availability = [TiUtils intValue:value];
        return;
    }
    else if ([key isEqualToString:@"title"]) {
        currEvent.title = [TiUtils stringValue:value];
        return;
    }
    else if ([key isEqualToString:@"location"]) {
        currEvent.location = [TiUtils stringValue:value];
        return;
    }
    else if ([key isEqualToString:@"recurrenceRule"]) {
        DebugLog(@"[ERROR] Ti.Calendar.Event.recurrenceRule is no longer supported. Use Ti.Calendar.Event.recurrenceRules.")
        return;
    }
    else if ([key isEqualToString:@"recurrenceRules"]) {
        ENSURE_TYPE_OR_NIL(value,NSArray);
        NSMutableArray * rules = [NSMutableArray arrayWithCapacity:[value count]];
        for (TiCalendarRecurrenceRule *recurranceRule_ in value) {
            EKRecurrenceRule * ruleToBeAdded = [recurranceRule_ ruleForRecurrence];
            [rules addObject:ruleToBeAdded];
        }
        currEvent.recurrenceRules = rules;
        return;
    }
    // Array of TiCalendarAlerts
    else if ([key isEqualToString:@"alerts"]) {
        if ([value isKindOfClass:[NSArray class]]) {
            NSMutableArray* alerts = [NSMutableArray arrayWithCapacity:[value count]];
            for (TiCalendarAlert* currAlert_ in value) {
                [alerts addObject:[currAlert_ alert]];
            }
            currEvent.alarms = alerts;
        }
        return;
    }
    // Something else
	else {
		[super setValue:value forUndefinedKey:key];
	}
}

-(TiCalendarAlert*) createAlert:(id) args
{
    if (![NSThread isMainThread]) {
        __block id result;
		TiThreadPerformOnMainThread(^{result = [[self createAlert:args] retain];}, YES);
		return [result autorelease];
	}
    
    ENSURE_ARRAY(args);
    NSDictionary *props = [args objectAtIndex:0];
    
    NSArray* keys = [props allKeys];
    if ([keys count] > 0) {
        NSString *key = [keys objectAtIndex:0];
        id value = [props objectForKey:key];
        
        EKAlarm* alarm = NULL;
        if ([key isEqualToString:@"absoluteDate"]) {
            alarm = [EKAlarm alarmWithAbsoluteDate:value];
        }
        else if ([key isEqualToString:@"relativeOffset"]) {
            alarm = [EKAlarm alarmWithRelativeOffset:([TiUtils doubleValue:value] / 1000)];
        }
        else {
            DebugLog(@"Invalid arg passed during creation of alert. Valid args type are `absoluteDate` or `relativeOffset`.");
            return NULL;
        }
        TiCalendarAlert *newalert = [[[TiCalendarAlert alloc] _initWithPageContext:[self pageContext]
                                                                             alert:alarm
                                                                            module:module] autorelease];
        return newalert;

    }
    return NULL;
}

-(TiCalendarRecurrenceRule*) createRecurenceRule:(id)arg
{
    DEPRECATED_REPLACED(@"Calendar.createRecurenceRule()", @"5.0.0",@"Calendar.createRecurrenceRule()");
    return [self createRecurrenceRule:arg];
}

-(TiCalendarRecurrenceRule*) createRecurrenceRule:(id)arg
{
    ENSURE_ARRAY(arg);
    NSDictionary *args = [arg objectAtIndex:0];
    EKRecurrenceFrequency frequency = EKRecurrenceFrequencyDaily;
    NSInteger interval = 0;
    NSMutableArray *daysOfTheWeek = [[[NSMutableArray alloc] init] autorelease],
                    *daysOfTheMonth = [[[NSMutableArray alloc] init] autorelease],
                    *monthsOfTheYear = [[[NSMutableArray alloc] init] autorelease],
                    *weeksOfTheYear = [[[NSMutableArray alloc] init] autorelease],
                    *daysOfTheYear = [[[NSMutableArray alloc] init] autorelease],
                    *setPositions = [[[NSMutableArray alloc] init] autorelease];
                    EKRecurrenceEnd* end = nil;
    
    if ([args objectForKey:@"frequency"]) {
        frequency = [TiUtils intValue:[args objectForKey:@"frequency"]];
    }
    if ([args objectForKey:@"interval"]) {
        interval = [TiUtils intValue:[args objectForKey:@"interval"] def:1];
    }
    if ([args objectForKey:@"end"]) {
        id value = [args objectForKey:@"end"];
        ENSURE_TYPE_OR_NIL(value, NSDictionary);
        if ([value objectForKey:@"endDate"]) {
            end = [EKRecurrenceEnd recurrenceEndWithEndDate:[TiUtils dateForUTCDate:[value objectForKey:@"endDate"]]];
        }
        else if ([value objectForKey:@"occurrenceCount"]) {
            end = [EKRecurrenceEnd recurrenceEndWithOccurrenceCount:[TiUtils intValue:[value objectForKey:@"occurrenceCount"]]];
        }
        else {
            DebugLog(@"Key type not supported. Expected key types are `endDate` or `occurrenceCount`. Check documentation for more details");
        }
        
    }
    
    if (frequency != EKRecurrenceFrequencyDaily) {
        
        if ([args objectForKey:@"daysOfTheWeek"]) {
            id value = [args objectForKey:@"daysOfTheWeek"];
            ENSURE_TYPE_OR_NIL(value,NSArray);
            daysOfTheWeek = [NSMutableArray arrayWithCapacity:[value count]];
            for (NSDictionary* eachDay in value) {
                id dayofWeek = [eachDay objectForKey:@"dayOfWeek"];
                if (dayofWeek != NULL) {
                    id week = [eachDay objectForKey:@"week"];
                    if (week != NULL) {
                        EKRecurrenceDayOfWeek* day = [EKRecurrenceDayOfWeek dayOfWeek:[TiUtils  intValue:dayofWeek]
                                                                           weekNumber:[TiUtils intValue:week]];
                        [daysOfTheWeek addObject:day];
                    }
                    else {
                        EKRecurrenceDayOfWeek* day = [EKRecurrenceDayOfWeek dayOfWeek:[TiUtils  intValue:dayofWeek] weekNumber:0];
                        [daysOfTheWeek addObject:day];
                    }
                }
            }
        }
        if ([args objectForKey:@"setPositions"]) {
            id value = [args objectForKey:@"setPositions"];
            ENSURE_TYPE_OR_NIL(value, NSArray);
            setPositions = value;
        }
        
        if (frequency == EKRecurrenceFrequencyMonthly) {
            id value = [args objectForKey:@"daysOfTheMonth"];
            ENSURE_TYPE_OR_NIL(value, NSArray);
            if (value) {
                for (NSNumber* num in value) {
                    int day = [num intValue];
                    if ((day < -31) || (day > 31) || (day == 0)) {
                        continue;
                    }
                    else {
                        [daysOfTheMonth addObject:num];
                    }
                }
            }
        }
        else if (frequency == EKRecurrenceFrequencyYearly)
        {
            if ([args objectForKey:@"monthsOfTheYear"]) {
                id value = [args objectForKey:@"monthsOfTheYear"];
                ENSURE_TYPE_OR_NIL(value,NSArray);
                for (NSNumber* month in value) {
                    int month_ = [month intValue];
                    if (month_ < 1 || month_ > 12) {
                        continue;
                    }
                    else {
                        [monthsOfTheYear addObject:month];
                    }
                }
            }
            
            if ([args objectForKey:@"weeksOfTheYear"]) {
                id value = [args objectForKey:@"weeksOfTheYear"];
                ENSURE_TYPE_OR_NIL(value,NSArray);
                for (NSNumber* week in value) {
                    int week_ = [week intValue];
                    if (week_ < -53 || week_ > 53 || week_ == 0) {
                        continue;
                    }
                    else {
                        [weeksOfTheYear addObject:week];
                    }
                }
            }
            
            if ([args objectForKey:@"daysOfTheYear"]) {
                id value = [args objectForKey:@"daysOfTheYear"];
                ENSURE_TYPE_OR_NIL(value,NSArray);
                for (NSNumber* days in value) {
                    int days_ = [days intValue];
                    if (days_ < -366 || days_ > 366 || days_ == 0) {
                        continue;
                    }
                    else {
                        [daysOfTheYear addObject:days];
                    }
                }
            }
        }
        
        EKRecurrenceRule* rule = [[[EKRecurrenceRule alloc] initRecurrenceWithFrequency:frequency
                                                                               interval:interval
                                                                          daysOfTheWeek:daysOfTheWeek
                                                                         daysOfTheMonth:daysOfTheMonth
                                                                        monthsOfTheYear:monthsOfTheYear
                                                                         weeksOfTheYear:weeksOfTheYear
                                                                          daysOfTheYear:daysOfTheYear
                                                                           setPositions:setPositions
                                                                                    end:end] autorelease];
        if (rule == NULL) {
            [self throwException:@"Error while trying to create recurrance rule."
                       subreason:nil
                        location:CODELOCATION];
            
            return NULL;
        }
        TiCalendarRecurrenceRule* recurranceRule = [[[TiCalendarRecurrenceRule alloc] _initWithPageContext:[self executionContext]
                                                                                                      rule:rule] autorelease];
        return recurranceRule;
    } /*endof if (frequency != EKRecurrenceFrequencyDaily)*/
    else {
        EKRecurrenceRule* rule = [[[EKRecurrenceRule alloc] initRecurrenceWithFrequency:frequency interval:interval end:end] autorelease];
        if (rule == NULL) {
            [self throwException:@"Error while trying to create recurrance rule."
                       subreason:nil
                        location:CODELOCATION];
            
            return NULL;
        }
        TiCalendarRecurrenceRule* recurranceRule = [[[TiCalendarRecurrenceRule alloc] _initWithPageContext:[self executionContext]
                                                                                                      rule:rule] autorelease];
        return recurranceRule;
    }
}

-(TiCalendarRecurrenceRule*) createRecurrenceRuleFromString:(id)arg
{
    ENSURE_SINGLE_ARG(arg, NSString);
    NSString* rfc2445String = arg;

    // The following code is copied from: https://github.com/jochenschoellig/RRULE-to-EKRecurrenceRule
    // Thanks to @jochenschoellig
    
    // If the date formatter isn't already set up, create it and cache it for reuse.
    NSDateFormatter* dateFormatter = [[NSDateFormatter alloc] init];
    NSLocale *enUSPOSIXLocale = [[NSLocale alloc] initWithLocaleIdentifier:@"en_US_POSIX"];
        
    [dateFormatter setLocale:enUSPOSIXLocale];
    [dateFormatter setDateFormat:@"yyyyMMdd'T'HHmmss'Z'"];
    [dateFormatter setTimeZone:[NSTimeZone timeZoneForSecondsFromGMT:0]];
    
    // Begin parsing
    NSArray *components = [rfc2445String.uppercaseString componentsSeparatedByCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@";="]];

    EKRecurrenceFrequency frequency = EKRecurrenceFrequencyDaily;
    NSInteger interval              = 1;
    NSMutableArray *daysOfTheWeek   = nil;
    NSMutableArray *daysOfTheMonth  = nil;
    NSMutableArray *monthsOfTheYear = nil;
    NSMutableArray *daysOfTheYear   = nil;
    NSMutableArray *weeksOfTheYear  = nil;
    NSMutableArray *setPositions    = nil;
    EKRecurrenceEnd *recurrenceEnd  = nil;
    
    for (int i = 0; i < components.count; i++)
    {
        NSString *component = [components objectAtIndex:i];
        
        // Frequency
        if ([component isEqualToString:@"FREQ"])
        {
            NSString *frequencyString = [components objectAtIndex:++i];
            
            if      ([frequencyString isEqualToString:@"DAILY"])   frequency = EKRecurrenceFrequencyDaily;
            else if ([frequencyString isEqualToString:@"WEEKLY"])  frequency = EKRecurrenceFrequencyWeekly;
            else if ([frequencyString isEqualToString:@"MONTHLY"]) frequency = EKRecurrenceFrequencyMonthly;
            else if ([frequencyString isEqualToString:@"YEARLY"])  frequency = EKRecurrenceFrequencyYearly;
        }
    
        // Interval
        if ([component isEqualToString:@"INTERVAL"])
        {
            interval = [[components objectAtIndex:++i] intValue];
        }
        
        // Days of the week
        if ([component isEqualToString:@"BYDAY"])
        {
            daysOfTheWeek = [NSMutableArray array];
            NSArray *dayStrings = [[components objectAtIndex:++i] componentsSeparatedByString:@","];
            for (NSString *dayString in dayStrings)
            {
                int dayOfWeek = 0;
                int weekNumber = 0;
                
                // Parse the day of the week
                if ([dayString rangeOfString:@"SU"].location != NSNotFound)      dayOfWeek = EKSunday;
                else if ([dayString rangeOfString:@"MO"].location != NSNotFound) dayOfWeek = EKMonday;
                else if ([dayString rangeOfString:@"TU"].location != NSNotFound) dayOfWeek = EKTuesday;
                else if ([dayString rangeOfString:@"WE"].location != NSNotFound) dayOfWeek = EKWednesday;
                else if ([dayString rangeOfString:@"TH"].location != NSNotFound) dayOfWeek = EKThursday;
                else if ([dayString rangeOfString:@"FR"].location != NSNotFound) dayOfWeek = EKFriday;
                else if ([dayString rangeOfString:@"SA"].location != NSNotFound) dayOfWeek = EKSaturday;
                
                // Parse the week number
                weekNumber = [[dayString substringToIndex:dayString.length-2] intValue];
  
                [daysOfTheWeek addObject:[EKRecurrenceDayOfWeek dayOfWeek:dayOfWeek weekNumber:weekNumber]];
            }
        }
        
        // Days of the month
        if ([component isEqualToString:@"BYMONTHDAY"])
        {
            daysOfTheMonth = [NSMutableArray array];
            NSArray *dayStrings = [[components objectAtIndex:++i] componentsSeparatedByString:@","];
            for (NSString *dayString in dayStrings)
            {
                [daysOfTheMonth addObject:[NSNumber numberWithInt:dayString.intValue]];
            }
        }
        
        // Months of the year
        if ([component isEqualToString:@"BYMONTH"])
        {
            monthsOfTheYear = [NSMutableArray array];
            NSArray *monthStrings = [[components objectAtIndex:++i] componentsSeparatedByString:@","];
            for (NSString *monthString in monthStrings)
            {
                [monthsOfTheYear addObject:[NSNumber numberWithInt:monthString.intValue]];
            }
        }
        
        // Weeks of the year
        if ([component isEqualToString:@"BYWEEKNO"])
        {
            weeksOfTheYear = [NSMutableArray array];
            NSArray *weekStrings = [[components objectAtIndex:++i] componentsSeparatedByString:@","];
            for (NSString *weekString in weekStrings)
            {
                [weeksOfTheYear addObject:[NSNumber numberWithInt:weekString.intValue]];
            }
        }
        
        // Days of the year
        if ([component isEqualToString:@"BYYEARDAY"])
        {
            daysOfTheYear = [NSMutableArray array];
            NSArray *dayStrings = [[components objectAtIndex:++i] componentsSeparatedByString:@","];
            for (NSString *dayString in dayStrings)
            {
                [daysOfTheYear addObject:[NSNumber numberWithInt:dayString.intValue]];
            }
        }
        
        // Set positions
        if ([component isEqualToString:@"BYSETPOS"])
        {
            setPositions = [NSMutableArray array];
            NSArray *positionStrings = [[components objectAtIndex:++i] componentsSeparatedByString:@","];
            for (NSString *potitionString in positionStrings)
            {
                [setPositions addObject:[NSNumber numberWithInt:potitionString.intValue]];
            }
        }
        
        // RecurrenceEnd
        if ([component isEqualToString:@"COUNT"])
        {
            NSUInteger occurenceCount = [[components objectAtIndex:++i] intValue];
            recurrenceEnd = [EKRecurrenceEnd recurrenceEndWithOccurrenceCount:occurenceCount];
            
        } else if ([component isEqualToString:@"UNTIL"])
        {
            NSDate *endDate =  [dateFormatter dateFromString:[components objectAtIndex:++i]];
            recurrenceEnd = [EKRecurrenceEnd recurrenceEndWithEndDate:endDate];
        }
    }
    
    EKRecurrenceRule* rule = [[EKRecurrenceRule alloc] initRecurrenceWithFrequency:frequency
                                                        interval:interval
                                                   daysOfTheWeek:daysOfTheWeek
                                                  daysOfTheMonth:daysOfTheMonth
                                                 monthsOfTheYear:monthsOfTheYear
                                                  weeksOfTheYear:weeksOfTheYear
                                                   daysOfTheYear:daysOfTheYear
                                                    setPositions:setPositions
                                                             end:recurrenceEnd];
    if (rule == nil) {
        [self throwException:@"Error while trying to create recurrance rule from RRULE string."
            subreason: nil
            location: CODELOCATION];
        return nil;
    }
    
    TiCalendarRecurrenceRule* recurranceRule = [[[TiCalendarRecurrenceRule alloc] _initWithPageContext:[self executionContext] rule:rule] autorelease];
    return recurranceRule;
}

-(void) addRecurrenceRule:(id)arg
{
    TiCalendarRecurrenceRule* ruleProxy = nil;
    ENSURE_ARG_AT_INDEX(ruleProxy, arg, 0, TiCalendarRecurrenceRule);
        
    if (![NSThread isMainThread]) {
        TiThreadPerformOnMainThread(^{[self addRecurrenceRule:arg];}, YES);
        return;
    }
        
    EKEvent* currEvent = [self event];
        
    if (currEvent == NULL) {
        DebugLog(@"Cannot access event from the eventStore.");
        return;
    }
        
    EKRecurrenceRule *rule = [ruleProxy ruleForRecurrence];
        
    [currEvent addRecurrenceRule:rule];
}

-(void) removeRecurenceRule:(id)arg
{
    DEPRECATED_REPLACED(@"Calendar.removeRecurenceRule()", @"5.0.0",@"Calendar.removeRecurrenceRule()");
    [self removeRecurrenceRule:arg];
}

-(void) removeRecurrenceRule:(id)arg
{
    TiCalendarRecurrenceRule* ruleProxy = nil;
    ENSURE_ARG_AT_INDEX(ruleProxy, arg, 0, TiCalendarRecurrenceRule);
        
    if (![NSThread isMainThread]) {
        TiThreadPerformOnMainThread(^{[self removeRecurrenceRule:arg];}, YES);
        return;
    }
        
    EKEvent* currEvent = [self event];
        
    if (currEvent == NULL) {
        DebugLog(@"Cannot access event from the eventStore.");
        return;
    }
        
    EKRecurrenceRule *rule = [ruleProxy ruleForRecurrence];
    [currEvent  removeRecurrenceRule:rule];
}

-(NSNumber*) save:(id)arg
{
    id val = nil;
    ENSURE_ARG_OR_NIL_AT_INDEX(val, arg, 0, NSNumber);
    EKSpan span = EKSpanThisEvent;
    if (val != nil) {
        span = [TiUtils intValue:val def:EKSpanThisEvent];
    }
    EKEventStore* ourStore = [module store];
    if (ourStore == NULL) {
        DebugLog(@"Could not save event, missing Event Store");
        return NUMBOOL(NO);
    }
    EKEvent* currEvent = [self event];
    if (currEvent == NULL) {
        DebugLog(@"event is missing");
        return NUMBOOL(NO);
    }
    __block NSError * error = nil;
    __block BOOL result;
    TiThreadPerformOnMainThread(^{
        result = [ourStore saveEvent:currEvent span:span error:&error];
    }, YES);
    if (result == NO || error != nil) {
        [self throwException:[NSString stringWithFormat:@"Failed to save event : %@",[TiUtils messageFromError:error]]
				   subreason:nil
					location:CODELOCATION];
    }
    return NUMBOOL(result);
}

-(NSNumber*) remove:(id)arg
{
    id val = nil;
    ENSURE_ARG_OR_NIL_AT_INDEX(val, arg, 0, NSNumber);
    EKSpan span = EKSpanThisEvent;
    if (val != nil) {
        span = [TiUtils intValue:val def:EKSpanThisEvent];
    }
    EKEventStore* ourStore = [module store];
    __block NSError * error = nil;
    __block BOOL result;
    TiThreadPerformOnMainThread(^{
        result = [ourStore removeEvent:[self event] span:span error:&error];
    }, YES);
    if (result == NO || error != nil) {
        [self throwException:[NSString stringWithFormat:@"Failed to remove event : %@",[TiUtils messageFromError:error]]
				   subreason:nil
					location:CODELOCATION];
    }
    return NUMBOOL(result);
}

-(NSNumber*) refresh:(id)unused
{
    __block BOOL result;
    TiThreadPerformOnMainThread(^{
        result = [[self event] refresh];
    }, YES);
    return NUMBOOL(result);
}

@end

#endif