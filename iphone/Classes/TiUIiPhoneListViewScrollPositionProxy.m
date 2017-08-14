/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONELISTVIEWSCROLLPOSITION

#import "TiUIiPhoneListViewScrollPositionProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneListViewScrollPositionProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.ListViewScrollPosition";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(NONE, UITableViewScrollPositionNone, @"UI.iPhone.ListViewScrollPosition.NONE", @"5.4.0", @"UI.iOS.ListViewScrollPosition.NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(TOP, UITableViewScrollPositionTop, @"UI.iPhone.ListViewScrollPosition.TOP", @"5.4.0", @"UI.iOS.ListViewScrollPosition.TOP");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MIDDLE, UITableViewScrollPositionMiddle, @"UI.iPhone.ListViewScrollPosition.MIDDLE", @"5.4.0", @"UI.iOS.ListViewScrollPosition.MIDDLE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BOTTOM, UITableViewScrollPositionBottom, @"UI.iPhone.ListViewScrollPosition.BOTTOM", @"5.4.0", @"UI.iOS.ListViewScrollPosition.BOTTOM");

@end

#endif