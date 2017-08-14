/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONELISTVIEWCELLSELECTIONSTYLE

#import "TiUIiPhoneListViewCellSelectionStyleProxy.h"
#import "TiUtils.h"

@implementation TiUIiPhoneListViewCellSelectionStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.ListViewCellSelectionStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(NONE, UITableViewCellSelectionStyleNone, @"UI.iPhone.ListViewCellSelectionStyle.NONE", @"5.4.0", @"UI.iOS.ListViewCellSelectionStyle.NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLUE, UITableViewCellSelectionStyleBlue, @"UI.iPhone.ListViewCellSelectionStyle.BLUE", @"5.4.0", @"UI.iOS.ListViewCellSelectionStyle.BLUE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(GRAY, UITableViewCellSelectionStyleGray, @"UI.iPhone.ListViewCellSelectionStyle.GRAY", @"5.4.0", @"UI.iOS.ListViewCellSelectionStyle.GRAY");

@end

#endif