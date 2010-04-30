/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_API

#import "APIModule.h"
#import "TiUtils.h"
#import "TiBase.h"

@implementation APIModule

-(id)transform:(id)arg
{
	return [TiUtils exceptionMessage:arg];
}

-(void)debug:(NSArray*)args
{
	NSLog(@"[DEBUG] %@", [self transform:[args objectAtIndex:0]]);
	fflush(stderr);
}

-(void)info:(NSArray*)args
{
	NSLog(@"[INFO] %@", [self transform:[args objectAtIndex:0]]);
	fflush(stderr);
}

-(void)warn:(NSArray*)args
{
	NSLog(@"[WARN] %@", [self transform:[args objectAtIndex:0]]);
	fflush(stderr);
}

-(void)error:(NSArray*)args
{
	NSLog(@"[ERROR] %@", [self transform:[args objectAtIndex:0]]);
	fflush(stderr);
}

-(void)trace:(NSArray*)args
{
	NSLog(@"[TRACE] %@", [self transform:[args objectAtIndex:0]]);
	fflush(stderr);
}

-(void)timestamp:(NSArray*)args
{
	NSLog(@"[TIMESTAMP] %f %@", [NSDate timeIntervalSinceReferenceDate], [self transform:[args objectAtIndex:0]]);
	fflush(stderr);
}

-(void)notice:(NSArray*)args
{
	NSLog(@"[INFO] %@", [args objectAtIndex:0]);
	fflush(stderr);
}

-(void)critical:(NSArray*)args
{
	NSLog(@"[ERROR] %@", [args objectAtIndex:0]);
	fflush(stderr);
}

-(void)log:(NSArray*)args
{
	NSString * severityString = [args objectAtIndex:0];
	id loggedObject = [args count] > 1 ? [self transform:[args objectAtIndex:1]] : nil;
	
	if(loggedObject == nil){
		loggedObject = severityString;
		severityString = @"info";
	}
	NSLog(@"[%@] %@",[severityString uppercaseString],loggedObject);
	fflush(stderr);
}

-(void)reportUnhandledException:(NSArray*)args
{
	id lineNumber = [args objectAtIndex:0];
	id source = [args objectAtIndex:1];
	id message = [args objectAtIndex:2];
	
	NSLog(@"[ERROR] %@:%@ %@",source,lineNumber,message);
	fflush(stderr);
}


@end

#endif