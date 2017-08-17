/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPHONETABLEVIEWSCROLLPOSITION) || defined(USE_TI_UIIPHONELISTVIEWSCROLLPOSITION)

#import "TiUIiPhoneTableViewScrollPositionProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneTableViewScrollPositionProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.TableViewScrollPosition";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(NONE, UITableViewScrollPositionNone, @"UI.iPhone.TableViewScrollPosition.NONE", @"5.4.0", @"UI.iOS.TableViewScrollPosition.NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(TOP, UITableViewScrollPositionTop, @"UI.iPhone.TableViewScrollPosition.TOP", @"5.4.0", @"UI.iOS.TableViewScrollPosition.TOP");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MIDDLE, UITableViewScrollPositionMiddle, @"UI.iPhone.TableViewScrollPosition.MIDDLE", @"5.4.0", @"UI.iOS.TableViewScrollPosition.MIDDLE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BOTTOM, UITableViewScrollPositionBottom, @"UI.iPhone.TableViewScrollPosition.BOTTOM", @"5.4.0", @"UI.iOS.TableViewScrollPosition.BOTTOM");

@end

#endif