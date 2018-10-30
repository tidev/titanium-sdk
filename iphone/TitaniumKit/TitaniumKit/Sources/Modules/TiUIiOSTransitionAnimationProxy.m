/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSTransitionAnimationProxy.h"
#import "TiViewController.h"
#import "TiViewProxy.h"

@implementation TiUIiOSTransitionAnimationProxy

- (id)init
{
  self = [super init];
  if (self) {
  }
  return self;
}

- (void)dealloc
{
  if (_transitionFrom != nil) {
    [self forgetProxy:_transitionFrom];
    RELEASE_TO_NIL(_transitionFrom)
  }
  if (_transitionTo != nil) {
    [self forgetProxy:_transitionTo];
    RELEASE_TO_NIL(_transitionTo)
  }
  RELEASE_TO_NIL(_duration)
  RELEASE_TO_NIL(_transitionContext)
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.iOS.TransitionAnimation";
}

- (id)duration
{
  return _duration;
}

- (void)setDuration:(id)arg
{
  ENSURE_SINGLE_ARG(arg, NSNumber)
  RELEASE_TO_NIL(_duration)
  _duration = [arg retain];
}

- (void)setTransitionTo:(id)args
{
  RELEASE_TO_NIL(_transitionTo)
  _transitionTo = [TiAnimation animationFromArg:args context:[self executionContext] create:NO];
  if ([_transitionTo isTransitionAnimation]) {
    DebugLog(@"[ERROR] Transition animations are not supported yet");
    _transitionTo = nil;
    return;
  }
  [_transitionTo setDelegate:self];
  [_transitionTo retain];
  [self rememberProxy:_transitionTo];
}

- (void)setTransitionFrom:(id)args
{
  RELEASE_TO_NIL(_transitionFrom)
  _transitionFrom = [TiAnimation animationFromArg:args context:[self executionContext] create:NO];
  if ([_transitionFrom isTransitionAnimation]) {
    DebugLog(@"[ERROR] Transition animations are not supported yet");
    _transitionFrom = nil;
    return;
  }
  [_transitionFrom setDelegate:self];
  [_transitionFrom retain];
  [self rememberProxy:_transitionFrom];
}

- (TiAnimation *)transitionTo
{
  return _transitionTo;
}

- (TiAnimation *)transitionFrom
{
  return _transitionFrom;
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{

  UIViewController *fromViewController = [transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
  UIViewController *toViewController = [transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];

  TiViewProxy *fromProxy = nil;
  TiViewProxy *toProxy = nil;
  if ([fromViewController isKindOfClass:[TiViewController class]]) {

    fromProxy = [(TiViewController *)fromViewController proxy];
  }
  if ([toViewController isKindOfClass:[TiViewController class]]) {

    toProxy = [(TiViewController *)toViewController proxy];
  }

  if ([self _hasListeners:@"start"]) {
    NSMutableDictionary *dict = [NSMutableDictionary dictionary];
    if (toProxy != nil) {
      [dict setObject:toProxy forKey:@"toWindow"];
    }
    if (fromProxy != nil) {
      [dict setObject:fromProxy forKey:@"fromWindow"];
    }
    [self fireEvent:@"start" withObject:dict propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }

  _endedFrom = (_transitionFrom == nil) || (fromProxy == nil);
  _endedTo = (_transitionTo == nil) || (toProxy == nil);

  _transitionContext = [transitionContext retain];

  [fromProxy setParentVisible:YES];
  [toProxy setParentVisible:YES];

  UIView *container = [transitionContext containerView];
  [container setUserInteractionEnabled:NO];

  [container addSubview:[fromViewController view]];
  [container addSubview:[toViewController view]];

  if (_transitionFrom != nil && fromProxy != nil) {
    [fromProxy animate:_transitionFrom];
  }
  if (_transitionTo != nil && toProxy != nil) {
    [toProxy animate:_transitionTo];
  }

  if (_endedFrom && _endedTo) {
    [_transitionContext completeTransition:YES];
  }
}

- (void)animationDidComplete:(TiAnimation *)animation;
{
  if (animation == _transitionFrom) {
    _endedFrom = YES;
  }
  if (animation == _transitionTo) {
    _endedTo = YES;
  }
  if (_endedTo && _endedFrom) {
    [_transitionContext completeTransition:YES];
  }
}

- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext
{
  if (_transitionTo == nil && _transitionFrom == nil) {
    return 0;
  }
  if (_duration == nil) {
    return MAX(
               [TiUtils floatValue:[_transitionTo duration]
                               def:0],
               [TiUtils floatValue:[_transitionFrom duration]
                               def:0])
        / 1000;
  }
  return [TiUtils floatValue:_duration def:0] / 1000;
}

- (void)animationEnded:(BOOL)transitionCompleted;
{
  if ([self _hasListeners:@"end"]) {

    UIViewController *fromViewController = [_transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    UIViewController *toViewController = [_transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];

    TiViewProxy *fromProxy = nil;
    TiViewProxy *toProxy = nil;

    if ([fromViewController isKindOfClass:[TiViewController class]]) {
      fromProxy = [(TiViewController *)fromViewController proxy];
    }
    if ([toViewController isKindOfClass:[TiViewController class]]) {
      toProxy = [(TiViewController *)toViewController proxy];
    }

    NSMutableDictionary *dict = [NSMutableDictionary dictionary];
    if (toProxy != nil) {
      [dict setObject:toProxy forKey:@"toWindow"];
    }
    if (fromProxy != nil) {
      [dict setObject:fromProxy forKey:@"fromWindow"];
    }
    [self fireEvent:@"end" withObject:dict propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
  RELEASE_TO_NIL(_transitionContext)
}

@end
