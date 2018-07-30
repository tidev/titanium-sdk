/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiWindowProxy+Addons.h"

@implementation TiWindowProxy (Addons)

#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
- (TiUIiOSNavWindowProxy *)navigationWindow
{
  if (parentController != nil && [parentController isKindOfClass:[TiUIiOSNavWindowProxy class]]) {
    return (TiUIiOSNavWindowProxy *)parentController;
  }

  NSLog(@"[ERROR] Trying to receive a Ti.UI.NavigationWindow instance that does not exist in this context!");
  return nil;
}
#endif

@end
