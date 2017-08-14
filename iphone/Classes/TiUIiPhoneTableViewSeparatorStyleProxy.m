/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPHONETABLEVIEWSEPARATORSTYLE) || defined(USE_TI_UIIPHONELISTVIEWSEPARATORSTYLE)

#import "TiUIiPhoneTableViewSeparatorStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneTableViewSeparatorStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.TableViewSeparatorStyle";
}

- (NSNumber *)SINGLE_LINE
{
  DEPRECATED_REPLACED(@"UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE", @"5.2.0", @"UI.TABLE_VIEW_SEPARATOR_STYLE_SINGLE_LINE");
  return [NSNumber numberWithInt:UITableViewCellSeparatorStyleSingleLine];
}

- (NSNumber *)NONE
{
  DEPRECATED_REPLACED(@"UI.iPhone.TableViewSeparatorStyle.NONE", @"5.2.0", @"UI.TABLE_VIEW_SEPARATOR_STYLE_NONE");
  return [NSNumber numberWithInt:UITableViewCellSeparatorStyleNone];
}

@end

#endif