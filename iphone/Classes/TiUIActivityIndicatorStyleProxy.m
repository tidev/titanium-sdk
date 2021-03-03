/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIACTIVITYINDICATORSTYLE

#import "TiUIActivityIndicatorStyleProxy.h"
#import <TitaniumKit/TiBase.h>

@implementation TiUIActivityIndicatorStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.ActivityIndicatorStyle";
}

MAKE_SYSTEM_PROP(PLAIN, UIActivityIndicatorViewStyleWhite);
MAKE_SYSTEM_PROP(BIG, UIActivityIndicatorViewStyleWhiteLarge);
MAKE_SYSTEM_PROP(DARK, UIActivityIndicatorViewStyleGray);

@end

#endif
