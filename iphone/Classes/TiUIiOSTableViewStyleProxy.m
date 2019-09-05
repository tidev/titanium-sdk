/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSTABLEVIEWSTYLE) || defined(USE_TI_UIIOSLISTVIEWSTYLE)
#import "TiUIiOSTableViewStyleProxy.h"
#import <TitaniumKit/TiBase.h>
#import <TitaniumKit/TiUtils.h>

@implementation TiUIiOSTableViewStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.TableViewStyle";
}

#if IS_SDK_IOS_13
- (NSNumber *)INSET_GROUPED
{
  if ([TiUtils isIOSVersionOrGreater:@"13.0"]) {
    return NUMINT(UITableViewStyleInsetGrouped);
  }
  return NUMINT(0);
}
#endif

MAKE_SYSTEM_PROP(PLAIN, UITableViewStylePlain);
MAKE_SYSTEM_PROP(GROUPED, UITableViewStyleGrouped);

@end

#endif
