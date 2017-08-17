/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONELISTVIEWSEPARATORSTYLE

#import "TiUIiPhoneListViewSeparatorStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneListViewSeparatorStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.ListViewSeparatorStyle";
}

- (NSNumber *)SINGLE_LINE
{
  DEPRECATED_REPLACED(@"UI.iPhone.ListViewSeparatorStyle.SINGLE_LINE", @"5.2.0", @"UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE");
  return [NSNumber numberWithInt:UITableViewCellSeparatorStyleSingleLine];
}

- (NSNumber *)NONE
{
  DEPRECATED_REPLACED(@"UI.iPhone.ListViewSeparatorStyle.NONE", @"5.2.0", @"UI.TABLE_VIEW_SEPARATOR_STYLE_NONE");
  return [NSNumber numberWithInt:UITableViewCellSeparatorStyleNone];
}

@end

#endif