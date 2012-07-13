/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FACEBOOK

#import "TiFacebookRequest.h"
#import "SBJSON.h"

@implementation TiFacebookRequest

-(id)initWithPath:(NSString*)path_ callback:(KrollCallback*)callback_ module:(FacebookModule*)module_ graph:(BOOL)graph_
{
	if (self = [super init])
	{
		path = [path_ retain];
		callback = [callback_ retain];
		module = [module_ retain];
		graph = graph_;
		[self retain]; // since we're a delegate, we retain and release on callback
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(path);
	RELEASE_TO_NIL(callback);
	RELEASE_TO_NIL(module);
	[super dealloc];
}

-(NSMutableDictionary*)eventParameters:(BOOL)yn
{
	if (graph)
	{
		return [NSMutableDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES),@"graph",path,@"path",NUMBOOL(yn),@"success",nil];
	}
	else
	{
		return [NSMutableDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO),@"graph",path,@"method",NUMBOOL(yn),@"success",nil];
	}
}

#pragma mark Delegates

/**
 * Called when an error prevents the request from completing successfully.
 */
- (void)request:(FBRequest*)request didFailWithError:(NSError*)error
{
	VerboseLog(@"[DEBUG] facebook didFailWithError = %@",error);
    VerboseLog(@"[DEBUG] Facebook Error description : %@ ", [error userInfo]);
    
	NSMutableDictionary *event = [self eventParameters:NO];
	[event setObject:[error localizedDescription] forKey:@"error"];
	[module _fireEventToListener:@"result" withObject:event listener:callback thisObject:nil];
	[self autorelease];
}

/**
 * Called when a request returns and its response has been parsed into an object.
 *
 * The resulting object may be a dictionary, an array, a string, or a number, depending
 * on thee format of the API response.
 */
- (void)request:(FBRequest*)request didLoad:(id)result
{
	VerboseLog(@"[DEBUG] facebook didLoad");
	NSMutableDictionary *event = [self eventParameters:YES];
	
	// On Android, Facebook is a little braindead and so it returns the stringified result without parsing the JSON.
	// But here, we do the opposite.  So... we re-stringify and ship as a JSON string.
	
	NSString* resultString = [SBJSON stringify:result];
	
	[event setObject:resultString forKey:@"result"];
	[module _fireEventToListener:@"result" withObject:event listener:callback thisObject:nil];
	[self autorelease];
}

@end

#endif