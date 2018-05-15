/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiConsole.h"

@implementation TiConsole

- (void)log:(id)level withMessage:(id)args
{
  [self logMessage:level severity:@"info"];
}

@end
