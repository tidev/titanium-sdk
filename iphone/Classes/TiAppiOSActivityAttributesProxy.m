/**
 * Axway Titanium
 * Copyright (c) 2009-present by Axway Appcelerator. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSActivityAttributesProxy.h"

@implementation TiAppiOSActivityAttributesProxy

- (void)startActivity:(id)args
{
  ENSURE_SINGLE_ARG(args, NSDictionary);
  [TiAppiOSActivityAttributesProxy _startActivity:args];
}

@end
