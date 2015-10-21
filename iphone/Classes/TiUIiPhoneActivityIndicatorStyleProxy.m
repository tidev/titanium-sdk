/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEACTIVITYINDICATORSTYLE

#import "TiUIiPhoneActivityIndicatorStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneActivityIndicatorStyleProxy

-(NSString*)apiName
{
    return @"Ti.UI.iPhone.ActivityIndicatorStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(PLAIN, UIActivityIndicatorViewStyleWhite, @"UI.iPhone.ActivityIndicatorStyle.PLAIN", @"5.1.0", @"Titanium.UI.ActivityIndicatorStyle.PLAIN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BIG, UIActivityIndicatorViewStyleWhiteLarge, @"UI.iPhone.ActivityIndicatorStyle.BIG", @"5.1.0", @"Titanium.UI.ActivityIndicatorStyle.BIG");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DARK, UIActivityIndicatorViewStyleGray, @"UI.iPhone.ActivityIndicatorStyle.DARK", @"5.1.0", @"Titanium.UI.ActivityIndicatorStyle.DARK");

@end

#endif