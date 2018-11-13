/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSNAVIGATIONWINDOW

#import "TiUIiOSNavigationWindowProxy.h"

@implementation TiUIiOSNavigationWindowProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.NavigationWindow";
}

- (void)_configure
{
  DEPRECATED_REPLACED(@"UI.iOS.NavigationWindow", @"8.0.0", @"UI.NavigationWindow");
  [super _configure];
}

@end

#endif
