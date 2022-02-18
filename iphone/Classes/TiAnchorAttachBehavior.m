/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSANCHORATTACHMENTBEHAVIOR

#import "TiAnchorAttachBehavior.h"

@implementation TiAnchorAttachBehavior

- (void)_initWithProperties:(NSDictionary *)properties
{
  _frequency = 0;
  _damping = 0;
  _length = 0;
  _anchor = CGPointZero;
  _offset = CGPointZero;
  [super _initWithProperties:properties];
}

- (void)dealloc
{
  RELEASE_TO_NIL(_attachBehavior);
  RELEASE_TO_NIL(_item);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.iOS.AnchorAttachmentBehavior";
}

#pragma mark - TiBehaviorProtocol
- (UIDynamicBehavior *)behaviorObject
{
  if (_needsRefresh) {
    RELEASE_TO_NIL(_attachBehavior);
  }
  if (_attachBehavior == nil) {
    _attachBehavior = [[UIAttachmentBehavior alloc] initWithItem:[_item view] offsetFromCenter:UIOffsetMake(_offset.x, _offset.y) attachedToAnchor:_anchor];
    if (_frequency > 0) {
      [_attachBehavior setFrequency:_frequency];
    }
    if (_damping > 0) {
      [_attachBehavior setDamping:_damping];
    }
    if (_length > 0) {
      [_attachBehavior setLength:_length];
    }
    void (^update)(void) = ^{
      [self updateItems];
    };
    [_attachBehavior setAction:update];
  }
  _needsRefresh = NO;
  return _attachBehavior;
}

- (void)updateItems
{
  //Nothing to do here
}

- (void)updatePositioning
{
  CGPoint center = [[_item view] center];
#ifndef TI_USE_AUTOLAYOUT
  LayoutConstraint *constraint = [_item layoutProperties];
  constraint->centerX = TiDimensionDip(center.x);
  constraint->centerY = TiDimensionDip(center.y);
#endif
}

#pragma mark - Public API
- (void)setItem:(id)args
{
  ENSURE_SINGLE_ARG(args, TiViewProxy);
  if (args != _item) {
    [self forgetProxy:_item];
    RELEASE_TO_NIL(_item);
    _item = [args retain];
    [self rememberProxy:_item];
    _needsRefresh = (_attachBehavior != nil);
    if (_needsRefresh) {
      TiThreadPerformOnMainThread(
          ^{
            UIDynamicAnimator *theAnimator = _attachBehavior.dynamicAnimator;
            if (theAnimator != nil) {
              [theAnimator removeBehavior:_attachBehavior];
              [theAnimator addBehavior:[self behaviorObject]];
            }
          },
          YES);
    }
  }
}

- (TiViewProxy *)item
{
  return _item;
}

- (void)setDamping:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject)
  CGFloat newVal = [TiUtils floatValue:args def:_damping];
  if (newVal != _damping && newVal > 0) {
    _damping = newVal;
    if (_attachBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_attachBehavior setDamping:_damping];
          },
          YES);
    }
  }
}

- (NSNumber *)damping
{
  return NUMFLOAT(_damping);
}

- (void)setFrequency:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  CGFloat newVal = [TiUtils floatValue:args def:_frequency];
  if (newVal != _frequency && newVal > 0) {
    _frequency = newVal;
    if (_attachBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_attachBehavior setFrequency:_frequency];
          },
          YES);
    }
  }
}

- (NSNumber *)frequency
{
  return NUMFLOAT(_frequency);
}

- (void)setDistance:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  CGFloat newVal = [TiUtils floatValue:args def:_length];
  if (newVal != _length && newVal > 0) {
    _length = newVal;
    if (_attachBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_attachBehavior setLength:_length];
          },
          YES);
    }
  }
}

- (NSNumber *)distance
{
  if (_attachBehavior != nil) {
    TiThreadPerformOnMainThread(
        ^{
          _length = [_attachBehavior length];
        },
        YES);
  }
  return NUMFLOAT(_length);
}

- (void)setAnchor:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  CGPoint newPoint = [TiUtils pointValue:args];
  if (!CGPointEqualToPoint(_anchor, newPoint)) {
    _anchor = newPoint;
    if (_attachBehavior != nil) {
      TiThreadPerformOnMainThread(
          ^{
            [_attachBehavior setAnchorPoint:_anchor];
          },
          YES);
    }
  }
}

- (NSDictionary *)anchor
{
  return [TiUtils pointToDictionary:_anchor];
}

- (void)setOffset:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  CGPoint newPoint = [TiUtils pointValue:args];
  if (!CGPointEqualToPoint(_offset, newPoint)) {
    _offset = newPoint;
    _needsRefresh = (_attachBehavior != nil);
    if (_needsRefresh) {
      TiThreadPerformOnMainThread(
          ^{
            UIDynamicAnimator *theAnimator = _attachBehavior.dynamicAnimator;
            if (theAnimator != nil) {
              [theAnimator removeBehavior:_attachBehavior];
              [theAnimator addBehavior:[self behaviorObject]];
            }
          },
          YES);
    }
  }
}

- (NSDictionary *)offset
{
  return [TiUtils pointToDictionary:_offset];
}
@end
#endif
#endif