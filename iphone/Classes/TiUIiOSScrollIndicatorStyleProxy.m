/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSCROLLINDICATORSTYLE

#import "TiUIiOSScrollIndicatorStyleProxy.h"

#import <TitaniumKit/TiUtils.h>

@implementation TiUIiOSScrollIndicatorStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.ScrollIndicatorStyle";
}

MAKE_SYSTEM_PROP(DEFAULT, UIScrollViewIndicatorStyleDefault);
MAKE_SYSTEM_PROP(BLACK, UIScrollViewIndicatorStyleBlack);
MAKE_SYSTEM_PROP(WHITE, UIScrollViewIndicatorStyleWhite);

@end

#endif
