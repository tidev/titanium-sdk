//
//  TitaniumJSEvent.m
//  Titanium
//
//  Created by Blain Hamon on 10/2/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "TitaniumJSEvent.h"
#import "SBJSON.h"

@implementation TitaniumJSEvent
@synthesize eventName;

- (NSString *) eventString;
{
	if((eventString == nil) && (eventDict != nil)){
		eventString = [[SBJSON stringify:eventDict] retain];
	}
	return eventString;
}

- (NSDictionary *) eventDict;
{
	if((eventDict == nil) && (eventString != nil)){
		NSError * error = nil;
		SBJSON * parser = [[SBJSON alloc] init];
		eventDict = [[parser fragmentWithString:eventString error:&error] retain];
		[parser release];
		if (error != nil) {
			NSLog(@"[ERROR] Error in Fragment(%@): %@",eventString,error);
		}
	}
	return eventDict;
}

- (void) setEventString: (NSString *) newString;
{
	if((newString == eventString) || [eventString isEqualToString:newString])return;
	[eventString release];
	eventString = [newString copy];
	[eventDict release];
	eventDict = nil;
}

- (void) setEventDict: (NSDictionary *) newDict;
{
	if((eventDict == newDict) || [eventDict isEqual:newDict])return;
	[eventString release];
	eventString = nil;
	[eventDict release];
	eventDict = [newDict copy];
}


@end
