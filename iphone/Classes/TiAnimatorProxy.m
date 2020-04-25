/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR

#import "TiAnimatorProxy.h"

@implementation TiAnimatorProxy

- (void)_initWithProperties:(NSDictionary *)properties
{
  _behaviors = [[NSMutableArray alloc] init];
  [super _initWithProperties:properties];
}

- (void)dealloc
{
  [self removeAllBehaviors:nil];
  RELEASE_TO_NIL(_behaviors);
  RELEASE_TO_NIL(_referenceView);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.iOS.Animator";
}

#pragma mark - Public API
- (NSNumber *)running
{
  if (theAnimator != nil) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[NSNumber numberWithBool:[theAnimator isRunning]] retain];
        },
        YES);
    return [result autorelease];
  } else {
    return NUMBOOL(NO);
  }
}

- (TiViewProxy *)referenceView
{
  return _referenceView;
}

- (void)setReferenceView:(id)args
{
  if (theAnimator == nil) {
    ENSURE_SINGLE_ARG(args, TiViewProxy);
    TiViewProxy *theView = args;
    if (theView != _referenceView) {
      RELEASE_TO_NIL(_referenceView);
      _referenceView = [theView retain];
    }

  } else {
    DebugLog(@"Can not change referenceView after animator is started. Ignoring.");
  }
}

- (NSArray *)behaviors
{
  return [NSArray arrayWithArray:_behaviors];
}

- (void)setBehaviors:(id)args
{
  ENSURE_TYPE(args, NSArray);
  NSArray *curBehaviors = [self behaviors];
  //Remove the old behaviors that no longer exist
  for (id<TiBehaviorProtocol> theArg in curBehaviors) {
    if (![args containsObject:theArg]) {
      [self removeBehavior:theArg];
    }
  }
  //Add the new behaviors
  for (id theArg in args) {
    if (![_behaviors containsObject:theArg]) {
      [self addBehavior:theArg];
    }
  }
}

- (void)addBehavior:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  id theArg = args;
  if ([theArg conformsToProtocol:@protocol(TiBehaviorProtocol)]) {
    [self rememberProxy:(TiProxy *)theArg];
    TiThreadPerformOnMainThread(
        ^{
          UIDynamicBehavior *theBehavior = [theArg behaviorObject];
          if (theBehavior != nil) {
            [_behaviors addObject:theArg];
            [theAnimator addBehavior:theBehavior];
          } else {
            DebugLog(@"[ERROR] Could not instantiate the behavior object. Ignoring");
            [self forgetProxy:(TiProxy *)theArg];
          }
        },
        YES);

  } else {
    DebugLog(@"[ERROR] Invalid type passed to addBehavior. Ignoring.");
  }
}

- (void)removeBehavior:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  id theArg = args;
  if ([theArg conformsToProtocol:@protocol(TiBehaviorProtocol)]) {
    if ([_behaviors containsObject:theArg]) {
      TiThreadPerformOnMainThread(
          ^{
            [theAnimator removeBehavior:(UIDynamicBehavior *)[(id<TiBehaviorProtocol>)theArg behaviorObject]];
            [theArg updatePositioning];
          },
          YES);
      [self forgetProxy:(TiProxy *)theArg];
      [_behaviors removeObject:theArg];
      if ([_behaviors count] == 0) {
        [self stopAnimator:nil];
      }
    }
  } else {
    DebugLog(@"[ERROR] Invalid type passed to removeBehavior. Ignoring.");
  }
}

- (void)removeAllBehaviors:(id)unused
{
  [self stopAnimator:nil];
  for (id<TiBehaviorProtocol> theArg in _behaviors) {
    [self forgetProxy:(TiProxy *)theArg];
  }
  [_behaviors removeAllObjects];
}

- (void)startAnimator:(id)unused
{
  if ([_behaviors count] > 0) {
    TiThreadPerformOnMainThread(
        ^{
          if (theAnimator != nil) {
            DebugLog(@"[INFO] Animator is already started");
            return;
          }
          //Need to get the parent view for children since this is the view that provides the animation context.
          //Right now scrollable View will not work.
          UIView *refView = [_referenceView parentViewForChild:nil];
          if (refView == nil) {
            refView = [_referenceView view];
          }
          theAnimator = [[UIDynamicAnimator alloc] initWithReferenceView:refView];
          theAnimator.delegate = self;
          NSArray *behaviorCopy = [_behaviors copy];
          for (id<TiBehaviorProtocol> theArg in behaviorCopy) {
            UIDynamicBehavior *theBehavior = [theArg behaviorObject];
            if (theBehavior != nil) {
              [theAnimator addBehavior:theBehavior];
            } else {
              DebugLog(@"[ERROR] Could not instantiate the behavior object. Removing.");
              [self forgetProxy:(TiProxy *)theArg];
              [_behaviors removeObject:theArg];
            }
          }
          [behaviorCopy release];
        },
        YES);
  }
}

- (void)stopAnimator:(id)unused
{
  TiThreadPerformOnMainThread(
      ^{
        [theAnimator removeAllBehaviors];
        RELEASE_TO_NIL(theAnimator);
        for (id<TiBehaviorProtocol> theArg in _behaviors) {
          [theArg updatePositioning];
        }
      },
      YES);
}

- (void)updateItemUsingCurrentState:(id)args
{
  ENSURE_SINGLE_ARG(args, TiViewProxy);
  TiThreadPerformOnMainThread(
      ^{
        [theAnimator updateItemUsingCurrentState:[(TiViewProxy *)args view]];
      },
      YES);
}

#pragma mark - UIDynamicAnimatorDelegate methods
- (void)dynamicAnimatorWillResume:(UIDynamicAnimator *)animator
{
  if ([self _hasListeners:@"resume"]) {
    [self fireEvent:@"resume" withObject:nil propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}
- (void)dynamicAnimatorDidPause:(UIDynamicAnimator *)animator
{
  for (id<TiBehaviorProtocol> theArg in _behaviors) {
    [theArg updatePositioning];
  }
  if ([self _hasListeners:@"pause"]) {
    [self fireEvent:@"pause" withObject:nil propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}

@end

#endif