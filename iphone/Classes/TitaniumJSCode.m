/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumJSCode.h"
#import "TitaniumHost.h"

@implementation TitaniumJSCode
@synthesize valueCode, preludeCode, context, epilogueCode;

+ (TitaniumJSCode *) functionReturning: (id) returnedValue;
{
	TitaniumJSCode * result = [[self alloc] init];

	SBJSON * parser = [[SBJSON alloc] init];
	NSString * cleanedString = [parser stringWithFragment:returnedValue error:nil];
	[result setValueCode:[NSString stringWithFormat:@"function(){return %@;}",cleanedString]];
	[parser release];
	return [result autorelease];
}

+ (TitaniumJSCode *) codeWithString: (NSString *) newValue;
{
	TitaniumJSCode * result = [[self alloc] init];
	[result setValueCode:newValue];
	return [result autorelease];
}

- (void) invoke;
{
	[[TitaniumHost sharedHost] sendJavascript:valueCode toPageWithToken:context];
}

- (void) dealloc;
{
	[preludeCode release];
	[epilogueCode release];
	[valueCode release];
	[context release];
	[super dealloc];
}

- (NSString *) description;
{
	NSMutableString * result = [NSMutableString stringWithFormat:@"<TitaniumJSCode: 0x%x",self];
	if ([context length]>0){
		[result appendString:@", context:"];
		[result appendString:context];
	}

	if ([preludeCode length]>0){
		[result appendString:@", preludeCode:"];
		[result appendString:preludeCode];
	}

	
	if ([epilogueCode length]>0){
		[result appendString:@", epilogueCode:"];
		[result appendString:epilogueCode];
	}
	
	if ([valueCode length]>0){
		[result appendString:@", valueCode:"];
		[result appendString:valueCode];
	}

	[result appendString:@">"];

	return result;
}

@end
