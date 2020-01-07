/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiConsole.h"
#import "TiBase.h"

@implementation TiConsole

- (void)log:(id)unused
{
  NSArray *currentArgs = [JSContext currentArguments];
  [self logMessage:currentArgs severity:@"info"];
}

- (void)dealloc
{
  RELEASE_TO_NIL(_times);
  [super dealloc];
}
@end
