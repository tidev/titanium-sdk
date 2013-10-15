/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSTRANSITIONANIMATION

#import "TiUIiOSTransitionAnimationProxy.h"
#import "TiViewController.h"
#import "TiViewProxy.h"


@implementation TiUIiOSTransitionAnimationProxy
@synthesize duration = _duration;

- (id)init
{
    self = [super init];
    if (self) {
        [self setDuration:[NSNumber numberWithFloat:300]];
    }
    return self;
}

- (void)dealloc
{
    [self forgetProxy:_transitionFrom];
    [self forgetProxy:_transitionTo];
    RELEASE_TO_NIL(_duration)
    RELEASE_TO_NIL(_transitionContext)
    [super dealloc];
}

-(void)startEvent
{
    TiThreadPerformOnMainThread(^{
        [self fireEvent:@"start" withObject:nil];
    }, NO);
}
-(void)setDuration:(NSNumber *)duration
{
    RELEASE_TO_NIL(_duration)
    _duration = [duration retain];
    [self replaceValue:duration forKey:@"duration" notification:NO];
}

-(void)setTransitionTo:(id)args
{
    RELEASE_TO_NIL(_transitionTo)
    _transitionTo = [TiAnimation animationFromArg:args context:[self executionContext] create:YES];
    [self rememberProxy:_transitionTo];
    [_transitionTo setDelegate:self];
}

-(void)setTransitionFrom:(id)args
{
    RELEASE_TO_NIL(_transitionFrom)
    _transitionFrom = [TiAnimation animationFromArg:args context:[self executionContext] create:YES];
    [self rememberProxy:_transitionFrom];
    [_transitionFrom setDelegate:self];
}

-(TiAnimation*)transitionTo
{
    if(_transitionTo == nil)
    {
        [self setTransitionTo:[NSDictionary dictionary]];
    }
    return _transitionTo;
}

-(TiAnimation*)transitionFrom
{
    if(_transitionFrom == nil)
    {
        [self setTransitionFrom:[NSDictionary dictionary]];
    }
    return _transitionFrom;
}

- (void)animateTransition:(id<UIViewControllerContextTransitioning>)transitionContext
{
    _endedFrom = NO;
    _endedTo = NO;
    _transitionContext = [transitionContext retain];
    
    TiViewController *fromViewController = (TiViewController*)[transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    TiViewController *toViewController = (TiViewController*)[transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
    
    TiViewProxy *fromProxy = [fromViewController proxy];
    TiViewProxy *toProxy = [toViewController proxy];
    
    [fromProxy setParentVisible:YES];
    [toProxy setParentVisible:YES];
    
    UIView *container = [transitionContext containerView];
    [container setUserInteractionEnabled:NO];
    
    [container addSubview:[fromViewController view]];
    [container addSubview:[toViewController view]];
        
    [fromProxy animate: [self transitionFrom]];
    [toProxy animate: [self transitionTo]];
}

-(void)animationDidComplete:(TiAnimation *)animation;
{
    if(animation == _transitionFrom) {
        _endedFrom = YES;
    }
    if(animation == _transitionTo) {
        _endedTo = YES;
    }
    if(_endedTo && _endedFrom) {
        [_transitionContext completeTransition:YES];
    }
}

- (NSTimeInterval)transitionDuration:(id<UIViewControllerContextTransitioning>)transitionContext
{
    return [[self duration] floatValue] / 1000;
}

- (void)animationEnded:(BOOL) transitionCompleted;
{
    UIView *container = [_transitionContext containerView];

    TiViewController *fromViewController = (TiViewController*)[_transitionContext viewControllerForKey:UITransitionContextFromViewControllerKey];
    TiViewController *toViewController = (TiViewController*)[_transitionContext viewControllerForKey:UITransitionContextToViewControllerKey];
    
    TiViewProxy *fromProxy = [fromViewController proxy];
    TiViewProxy *toProxy = [toViewController proxy];

    [self fireEvent:@"end" withObject:@{ @"fromWindow": fromProxy, @"toWindow" : toProxy }];
}

@end
#endif
