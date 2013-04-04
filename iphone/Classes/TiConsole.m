/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiConsole.h"


@implementation TiConsole

-(void)log:(NSArray*)args
{
    [self logMessage:args severity:@"info"];
}
-(void)time:(NSArray*)args
{
    if(!self->startTimes) {
        self->startTimes = [[NSMutableDictionary alloc] init];
    }
    [self->startTimes setObject: [NSDate date] forKey: [args componentsJoinedByString:@" "]];
    NSLog(@"[%@] %@: timer started", @"info", [args componentsJoinedByString:@" "]);
    
    [self logMessage:args severity:@"info"];
}

-(void)timeEnd:(NSArray*)args
{
    NSLog(@"[%@] %@: %f ms", @"info", [args componentsJoinedByString:@" "], [[self->startTimes objectForKey: [args componentsJoinedByString:@" "]] timeIntervalSinceNow] * -1000.0);
}
@end
