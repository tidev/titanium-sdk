/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPHONETABLEVIEWCELLSELECTIONSTYLE) || defined(USE_TI_UIIPHONELISTVIEWCELLSELECTIONSTYLE)

#import "TiUIiPhoneTableViewCellSelectionStyleProxy.h"

#import "TiUtils.h"

@implementation TiUIiPhoneTableViewCellSelectionStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.TableViewCellSelectionStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(NONE, UITableViewCellSelectionStyleNone, @"UI.iPhone.TableViewCellSelectionStyle.NONE", @"5.4.0", @"UI.iOS.TableViewCellSelectionStyle.NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLUE, UITableViewCellSelectionStyleBlue, @"UI.iPhone.TableViewCellSelectionStyle.BLUE", @"5.4.0", @"UI.iOS.TableViewCellSelectionStyle.BLUE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(GRAY, UITableViewCellSelectionStyleGray, @"UI.iPhone.TableViewCellSelectionStyle.GRAY", @"5.4.0", @"UI.iOS.TableViewCellSelectionStyle.GRAY");

@end

#endif