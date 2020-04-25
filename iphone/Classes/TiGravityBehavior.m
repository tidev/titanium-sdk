/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSGRAVITYBEHAVIOR
#import "TiGravityBehavior.h"

@implementation TiGravityBehavior

- (void)_initWithProperties:(NSDictionary *)properties
{
  _items = [[NSMutableArray alloc] init];
  _angle = 0;
  _magnitude = 0;
  _vector = CGVectorMake(0, 0);
  [super _initWithProperties:properties];
}

- (void)dealloc
{
  RELEASE_TO_NIL(_items);
  RELEASE_TO_NIL(_gravityBehavior);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.iOS.GravityBehavior";
}

#pragma mark - TiBehaviorProtocol
- (UIDynamicBehavior *)behaviorObject
{
  if (_needsRefresh) {
    RELEASE_TO_NIL(_gravityBehavior);
  }
  if (_gravityBehavior == nil) {
    NSMutableArray *viewItems = [[NSMutableArray alloc] initWithCapacity:_items.count];
    for (TiViewProxy *theArg in _items) {
      [viewItems addObject:[theArg view]];
    }
    _gravityBehavior = [[UIGravityBehavior alloc] initWithItems:viewItems];
    if (_vectorDefined) {
      [_gravityBehavior setGravityDirection:_vector];
    } else {
      [_gravityBehavior setAngle:_angle];
      [_gravityBehavior setMagnitude:_magnitude];
    }
    [viewItems release];
    void (^update)(void) = ^{
      [self updateItems];
    };
    [_gravityBehavior setAction:update];
  }
  _needsRefresh = NO;
  return _gravityBehavior;
}

- (void)updateItems
{
  //Update params for reinitialization
  _angle = [_gravityBehavior angle];
  _magnitude = [_gravityBehavior magnitude];
  _vector = [_gravityBehavior gravityDirection];
}

- (void)updatePositioning
{
  for (TiViewProxy *theItem in _items) {
    CGPoint center = [[theItem view] center];

#ifndef TI_USE_AUTOLAYOUT
    LayoutConstraint *constraint = [theItem layoutProperties];
    constraint->centerX = TiDimensionDip(center.x);
    constraint->centerY = TiDimensionDip(center.y);
#endif
  }
}

#pragma mark - Public API
- (void)addItem:(id)args
{
  ENSURE_SINGLE_ARG(args, TiViewProxy);
  if (![_items containsObject:args]) {
    [self rememberProxy:args];
    [_items addObject:args];
    if (_gravityBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_gravityBehavior addItem:[(TiViewProxy *)args view]];
          },
          YES);
    }
  }
}

- (void)removeItem:(id)args
{
  ENSURE_SINGLE_ARG(args, TiViewProxy);
  if ([_items containsObject:args]) {
    if (_gravityBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_gravityBehavior removeItem:[(TiViewProxy *)args view]];
          },
          YES);
    }
    [_items removeObject:args];
    [self forgetProxy:args];
  }
}

- (NSArray *)items
{
  return [NSArray arrayWithArray:_items];
}

- (void)setAngle:(id)args
{
  ENSURE_SINGLE_ARG(args, NSNumber);
  _angle = [TiUtils floatValue:args def:0];
  if (_gravityBehavior != nil) {
    TiThreadPerformOnMainThread(
        ^{
          [_gravityBehavior setAngle:_angle];
        },
        YES);
  }
}

- (NSNumber *)angle
{
  if (_gravityBehavior != nil) {
    TiThreadPerformOnMainThread(
        ^{
          _angle = [_gravityBehavior angle];
        },
        YES);
  }
  return NUMFLOAT(_angle);
}

- (void)setMagnitude:(id)args
{
  ENSURE_SINGLE_ARG(args, NSNumber);
  _magnitude = [TiUtils floatValue:args def:0];
  if (_gravityBehavior != nil) {
    TiThreadPerformOnMainThread(
        ^{
          [_gravityBehavior setMagnitude:_magnitude];
        },
        YES);
  }
}

- (NSNumber *)magnitude
{
  if (_gravityBehavior != nil) {
    TiThreadPerformOnMainThread(
        ^{
          _magnitude = [_gravityBehavior magnitude];
        },
        YES);
  }
  return NUMFLOAT(_magnitude);
}

- (void)setGravityDirection:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  CGPoint newPoint = [TiUtils pointValue:args];
  _vectorDefined = YES;
  if (newPoint.x != _vector.dx || newPoint.y != _vector.dy) {
    _vector.dx = newPoint.x;
    _vector.dy = newPoint.y;
    if (_gravityBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_gravityBehavior setGravityDirection:_vector];
          },
          YES);
    }
  }
}

- (NSDictionary *)gravityDirection
{
  if (_gravityBehavior != nil) {
    TiThreadPerformOnMainThread(
        ^{
          _vector = [_gravityBehavior gravityDirection];
        },
        YES);
  }
  return [TiUtils pointToDictionary:CGPointMake(_vector.dx, _vector.dy)];
}

@end
#endif
#endif