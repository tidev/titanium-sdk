/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSTABLEVIEWCELLSELECTIONSTYLE) || defined(USE_TI_UIIOSLISTVIEWCELLSELECTIONSTYLE)

#import "TiUIiOSTableViewCellSelectionStyleProxy.h"

#import <TitaniumKit/TiUtils.h>

@implementation TiUIiOSTableViewCellSelectionStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.TableViewCellSelectionStyle";
}

MAKE_SYSTEM_PROP(NONE, UITableViewCellSelectionStyleNone);
MAKE_SYSTEM_PROP(BLUE, UITableViewCellSelectionStyleBlue);
MAKE_SYSTEM_PROP(GRAY, UITableViewCellSelectionStyleGray);

@end

#endif
