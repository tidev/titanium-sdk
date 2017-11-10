/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSTABLEVIEWSTYLE) || defined(USE_TI_UIIOSLISTVIEWSTYLE)
#import "TiUIiOSTableViewStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiOSTableViewStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.TableViewStyle";
}

MAKE_SYSTEM_PROP(PLAIN, UITableViewStylePlain);
MAKE_SYSTEM_PROP(GROUPED, UITableViewStyleGrouped);

@end

#endif