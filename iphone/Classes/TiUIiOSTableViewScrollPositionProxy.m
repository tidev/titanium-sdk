/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSTABLEVIEWSCROLLPOSITION) || defined(USE_TI_UIIOSLISTVIEWSCROLLPOSITION)

#import "TiUIiOSTableViewScrollPositionProxy.h"
#import <TitaniumKit/TiBase.h>

@implementation TiUIiOSTableViewScrollPositionProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.TableViewScrollPosition";
}

MAKE_SYSTEM_PROP(NONE, UITableViewScrollPositionNone);
MAKE_SYSTEM_PROP(TOP, UITableViewScrollPositionTop);
MAKE_SYSTEM_PROP(MIDDLE, UITableViewScrollPositionMiddle);
MAKE_SYSTEM_PROP(BOTTOM, UITableViewScrollPositionBottom);

@end

#endif
