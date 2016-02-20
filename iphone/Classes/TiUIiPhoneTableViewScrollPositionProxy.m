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

-(NSString*)apiName
{
    return @"Ti.UI.iPhone.TableViewScrollPosition";
}


MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(NONE,  UITableViewScrollPositionNone,@"UI.iPhone.ListViewScrollPosition.NONE",@"6.0.0",@"UI.iOS.ListViewScrollPosition.NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(TOP,   UITableViewScrollPositionTop,@"UI.iPhone.ListViewScrollPosition.TOP",@"6.0.0",@"UI.iOS.ListViewScrollPosition.TOP");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(MIDDLE,UITableViewScrollPositionMiddle,@"UI.iPhone.ListViewScrollPosition.MIDDLE",@"6.0.0",@"UI.iOS.ListViewScrollPosition.MIDDLE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BOTTOM,UITableViewScrollPositionBottom,@"UI.iPhone.ListViewScrollPosition.BOTTOM",@"6.0.0",@"UI.iOS.ListViewScrollPosition.BOTTOM");


@end

#endif