/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAnimation.h"
#import "TiProxy.h"

@interface TiUIiOSTransitionAnimationProxy : TiProxy <UIViewControllerAnimatedTransitioning, TiAnimationDelegate> {
  id<UIViewControllerContextTransitioning> _transitionContext;
  TiAnimation *_transitionTo;
  TiAnimation *_transitionFrom;
  BOOL _endedTo;
  BOOL _endedFrom;
  NSNumber *_duration;
}

@end
