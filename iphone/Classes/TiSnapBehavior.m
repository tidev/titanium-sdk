/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSSNAPBEHAVIOR
#import "TiSnapBehavior.h"

@implementation TiSnapBehavior

- (void)_initWithProperties:(NSDictionary *)properties
{
  _damping = 0.5;
  _needsRefresh = NO;
  _snapPoint = CGPointZero;
  [super _initWithProperties:properties];
}

- (void)dealloc
{
  RELEASE_TO_NIL(_snapItem);
  RELEASE_TO_NIL(_snapBehavior);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.iOS.SnapBehavior";
}

#pragma mark - TiBehaviorProtocol
- (UIDynamicBehavior *)behaviorObject
{
  if (_needsRefresh) {
    RELEASE_TO_NIL(_snapBehavior);
  }
  if (_snapBehavior == nil) {
    _snapBehavior = [[UISnapBehavior alloc] initWithItem:[_snapItem view] snapToPoint:_snapPoint];
    void (^update)(void) = ^{
      [self updateItems];
    };
    [_snapBehavior setAction:update];
  }
  _needsRefresh = NO;
  return _snapBehavior;
}

- (void)updateItems
{
  //Nothing to do here
}

- (void)updatePositioning
{
  CGPoint center = [[_snapItem view] center];
#ifndef TI_USE_AUTOLAYOUT

  LayoutConstraint *constraint = [_snapItem layoutProperties];
  constraint->centerX = TiDimensionDip(center.x);
  constraint->centerY = TiDimensionDip(center.y);
#endif
}

#pragma mark - Public API

- (TiViewProxy *)item
{
  return _snapItem;
}

- (void)setItem:(id)args;
{
  ENSURE_SINGLE_ARG(args, TiViewProxy);
  if (args != _snapItem) {
    [self forgetProxy:_snapItem];
    RELEASE_TO_NIL(_snapItem);
    _snapItem = [(TiViewProxy *)args retain];
    [self rememberProxy:_snapItem];
    _needsRefresh = (_snapBehavior != nil);
    if (_needsRefresh) {
      TiThreadPerformOnMainThread(
          ^{
            UIDynamicAnimator *theAnimator = _snapBehavior.dynamicAnimator;
            if (theAnimator != nil) {
              [theAnimator removeBehavior:_snapBehavior];
              [theAnimator addBehavior:[self behaviorObject]];
            }
          },
          YES);
    }
  }
}

- (NSNumber *)damping
{
  return [NSNumber numberWithFloat:_damping];
}

- (void)setDamping:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  CGFloat newVal = [TiUtils floatValue:args def:0.5];
  if (newVal != _damping) {
    if (newVal < 0) {
      _damping = 0.0;
    } else if (_damping > 1) {
      _damping = 1.0;
    } else {
      _damping = newVal;
    }
    TiThreadPerformOnMainThread(
        ^{
          [_snapBehavior setDamping:_damping];
        },
        YES);
  }
}

- (NSDictionary *)snapPoint
{
  return [TiUtils pointToDictionary:_snapPoint];
}

- (void)setSnapPoint:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  CGPoint newPoint = [TiUtils pointValue:args];
  if (!CGPointEqualToPoint(_snapPoint, newPoint)) {
    _snapPoint = newPoint;
    _needsRefresh = (_snapBehavior != nil);
    if (_needsRefresh) {
      TiThreadPerformOnMainThread(
          ^{
            UIDynamicAnimator *theAnimator = _snapBehavior.dynamicAnimator;
            if (theAnimator != nil) {
              [theAnimator removeBehavior:_snapBehavior];
              [theAnimator addBehavior:[self behaviorObject]];
            }
          },
          YES);
    }
  }
}

@end
#endif
#endif