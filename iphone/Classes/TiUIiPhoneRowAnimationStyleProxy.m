/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEROWANIMATIONSTYLE

#import "TiUIiPhoneRowAnimationStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneRowAnimationStyleProxy

-(NSString*)apiName
{
    return @"Ti.UI.iPhone.RowAnimationStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(NONE,UITableViewRowAnimationNone,@"UI.iPhone.RowAnimationStyle.NONE",@"6.0.0",@"UI.iOS.RowAnimationStyle.NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(LEFT,UITableViewRowAnimationLeft,@"UI.iPhone.RowAnimationStyle.LEFT",@"6.0.0",@"UI.iOS.RowAnimationStyle.LEFT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(RIGHT,UITableViewRowAnimationRight,@"UI.iPhone.RowAnimationStyle.RIGHT",@"6.0.0",@"UI.iOS.RowAnimationStyle.RIGHT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(TOP,UITableViewRowAnimationTop,@"UI.iPhone.RowAnimationStyle.TOP",@"6.0.0",@"UI.iOS.RowAnimationStyle.TOP");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BOTTOM,UITableViewRowAnimationBottom,@"UI.iPhone.RowAnimationStyle.BOTTOM",@"6.0.0",@"UI.iOS.RowAnimationStyle.BOTTOM");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FADE,UITableViewRowAnimationFade,@"UI.iPhone.RowAnimationStyle.FADE",@"6.0.0",@"UI.iOS.RowAnimationStyle.FADE");

// used before 0.9 in KS
MAKE_SYSTEM_PROP(UP,UITableViewRowAnimationTop);
MAKE_SYSTEM_PROP(DOWN,UITableViewRowAnimationBottom);

@end

#endif