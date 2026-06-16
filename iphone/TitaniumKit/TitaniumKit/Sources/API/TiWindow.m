/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiWindow.h"

static UIWindow *_lastActiveWindow = nil;

@implementation TiWindow

+ (UIWindow *)lastActiveWindow
{
  return _lastActiveWindow;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  _lastActiveWindow = self;
  return [super hitTest:point withEvent:event];
}

@end