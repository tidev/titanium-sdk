/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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

- (NSNumber *)INSET_GROUPED
{
  return NUMINT(UITableViewStyleInsetGrouped);
}

MAKE_SYSTEM_PROP(PLAIN, UITableViewStylePlain);
MAKE_SYSTEM_PROP(GROUPED, UITableViewStyleGrouped);

@end

#endif
