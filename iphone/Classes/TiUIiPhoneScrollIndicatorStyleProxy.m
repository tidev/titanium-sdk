/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESCROLLINDICATORSTYLE

#import "TiUIiPhoneScrollIndicatorStyleProxy.h"

#import "TiUtils.h"

@implementation TiUIiPhoneScrollIndicatorStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.ScrollIndicatorStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DEFAULT, UIScrollViewIndicatorStyleDefault, @"UI.iPhone.ScrollIndicatorStyle.DEFAULT", @"5.4.0", @"UI.iOS.ScrollIndicatorStyle.DEFAULT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLACK, UIScrollViewIndicatorStyleBlack, @"UI.iPhone.ScrollIndicatorStyle.BLACK", @"5.4.0", @"UI.iOS.ScrollIndicatorStyle.BLACK");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(WHITE, UIScrollViewIndicatorStyleWhite, @"UI.iPhone.ScrollIndicatorStyle.WHITE", @"5.4.0", @"UI.iOS.ScrollIndicatorStyle.WHITE");

@end

#endif