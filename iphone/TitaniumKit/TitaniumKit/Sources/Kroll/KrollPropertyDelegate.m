/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollPropertyDelegate.h"

@implementation KrollPropertyDelegate

- (id)initWithTarget:(id)target_ selector:(SEL)selector_
{
  if (self = [super init]) {
    target = [target_ retain];
    selector = selector_;
  }
  return self;
}

- (void)dealloc
{
  [target release];
  [super dealloc];
}

- (id)target
{
  return target;
}

- (SEL)selector
{
  return selector;
}

@end
