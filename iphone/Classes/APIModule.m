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
#import "TiApp.h"
#import "TiDebugger.h"

@implementation APIModule

-(void)logMessage:(NSString*)message severity:(NSString*)severity
{
    if ([[TiApp app] debugMode]) {
        NSString* lcSeverity = [severity lowercaseString];
        DebuggerLogLevel level = OUT;
        if ([lcSeverity isEqualToString:@"warn"]) {
            level = WARN;
        }
        else if ([lcSeverity isEqualToString:@"error"] ||
                 [lcSeverity isEqualToString:@"critical"] ||
                 [lcSeverity isEqualToString:@"fatal"]) {
            level = ERR;
        }
        else if ([lcSeverity isEqualToString:@"trace"]) {
            level = TRACE;
        }
        else if ([lcSeverity isEqualToString:@"debug"]) {
            level = LOG_DEBUG;
        }
        else if (![lcSeverity isEqualToString:@"info"]) { // Custom severity, or just a badly-formed log; either way, debugger treats it as info
            message = [severity stringByAppendingString:message];
        }
        TiDebuggerLogMessage(level, message);
    }
    else {
        NSLog(@"[%@] %@", [severity uppercaseString], message);
        fflush(stderr);
    }
}

-(id)transform:(id)arg
{
	return [TiUtils exceptionMessage:arg];
}

-(void)debug:(NSArray*)args
{
    [self logMessage:[self transform:[args objectAtIndex:0]] severity:@"debug"];
}

-(void)info:(NSArray*)args
{
    [self logMessage:[self transform:[args objectAtIndex:0]] severity:@"info"];    
}

-(void)warn:(NSArray*)args
{
    [self logMessage:[self transform:[args objectAtIndex:0]] severity:@"warn"];        
}

-(void)error:(NSArray*)args
{
    [self logMessage:[self transform:[args objectAtIndex:0]] severity:@"error"];            
}

-(void)trace:(NSArray*)args
{
    [self logMessage:[self transform:[args objectAtIndex:0]] severity:@"trace"];
}

-(void)timestamp:(NSArray*)args
{
	NSLog(@"[TIMESTAMP] %f %@", [NSDate timeIntervalSinceReferenceDate], [self transform:[args objectAtIndex:0]]);
	fflush(stderr);
}

-(void)notice:(NSArray*)args
{
    [self logMessage:[args objectAtIndex:0] severity:@"info"];
}

-(void)critical:(NSArray*)args
{
    [self logMessage:[args objectAtIndex:0] severity:@"error"];
}

-(void)log:(NSArray*)args
{
	NSString * severityString = [args objectAtIndex:0];
	id loggedObject = [args count] > 1 ? [self transform:[args objectAtIndex:1]] : nil;
	
	if(loggedObject == nil){
		loggedObject = severityString;
		severityString = @"info";
	}
    [self logMessage:loggedObject severity:severityString];
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