/**
 * Titanium SDK
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

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(NONE, UITableViewScrollPositionNone, @"UI.iOS.TableViewScrollPosition.NONE", @"10.2.0", @"UI.TableViewScrollPosition.NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(TOP, UITableViewScrollPositionTop, @"UI.iOS.TableViewScrollPosition.NONE", @"10.2.0", @"UI.TableViewScrollPosition.TOP");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MIDDLE, UITableViewScrollPositionMiddle, @"UI.iOS.TableViewScrollPosition.NONE", @"10.2.0", @"UI.TableViewScrollPosition.MIDDLE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BOTTOM, UITableViewScrollPositionBottom, @"UI.iOS.TableViewScrollPosition.NONE", @"10.2.0", @"UI.TableViewScrollPosition.BOTTOM");

@end

#endif
