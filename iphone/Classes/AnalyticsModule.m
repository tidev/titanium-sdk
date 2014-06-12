/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "AnalyticsModule.h"
#import "APSAnalytics/APSAnalytics.h"
#import "SBJSON.h"

@implementation AnalyticsModule

-(NSString*)apiName
{
    return @"Ti.Analytics";
}

-(NSString*)lastEvent
{
    return [APSAnalytics getLastEvent];
}

-(void)navEvent:(id)args
{
    if ([args count] < 2)
	{
		[self throwException:@"invalid number of arguments, expected at least 2" subreason:nil location:CODELOCATION];
		return;
	}
	NSString *from = [args objectAtIndex:0] ;
	NSString *to = [args objectAtIndex:1];
	NSString *event = [args count] > 2 ? [args objectAtIndex:2] : @"";
	id data = [args count] > 3 ? [args objectAtIndex:3] : [NSDictionary dictionary];
    [APSAnalytics sendAppNavEventFrom:from to:to withName:event withPayload:data];
}


-(void)featureEvent:(id)args
{
    if ([args count] < 1)
	{
		[self throwException:@"invalid number of arguments, expected at least 1" subreason:nil location:CODELOCATION];
		return;
	}
	NSString *event = [args objectAtIndex:0];
	id data = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
	if (data!=nil && ([data isKindOfClass:[NSDictionary class]]== NO))
	{
		id value = nil;
		if ([data isKindOfClass:[NSString class]] == YES) {
			value = [TiUtils jsonParse:data];
			if (value == nil)
				value = [NSDictionary dictionaryWithObject:data forKey:@"data"];
		} else {
			//if all else fails fall back old behavior
			value = [SBJSON stringify:data];
			value = [NSDictionary dictionaryWithObject:value forKey:@"data"];
		}
		data = value;
	}
	[APSAnalytics sendFeatureEvent:event withPayload:data];
}

@end
