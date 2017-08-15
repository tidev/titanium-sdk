/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPHONETABLEVIEWSTYLE) || defined(USE_TI_UIIPHONELISTVIEWSTYLE)
#import "TiUIiPhoneTableViewStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneTableViewStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.TableViewStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(PLAIN, UITableViewStylePlain, @"UI.iPhone.TableViewStyle.PLAIN", @"5.4.0", @"UI.iOS.TableViewStyle.PLAIN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(GROUPED, UITableViewStyleGrouped, @"UI.iPhone.TableViewStyle.GROUPED", @"5.4.0", @"UI.iOS.TableViewStyle.GROUPED");

@end

#endif