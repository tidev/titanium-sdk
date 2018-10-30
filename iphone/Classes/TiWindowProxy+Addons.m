/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiWindowProxy+Addons.h"

@implementation TiWindowProxy (Addons)

#if defined(USE_TI_UIIOSNAVIGATIONWINDOW) || defined(USE_TI_UINAVIGATIONWINDOW)
- (TiUINavigationWindowProxy *)navigationWindow
{
  if (parentController != nil && [parentController isKindOfClass:[TiUINavigationWindowProxy class]]) {
    return (TiUINavigationWindowProxy *)parentController;
  }

  NSLog(@"[ERROR] Trying to receive a Ti.UI.NavigationWindow instance that does not exist in this context!");
  return nil;
}
#endif

@end
