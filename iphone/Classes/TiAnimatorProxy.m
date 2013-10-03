/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR

#import "TiAnimatorProxy.h"

@implementation TiAnimatorProxy


-(void)_initWithProperties:(NSDictionary *)properties
{
    _behaviors = [[NSMutableArray alloc] init];
    [super _initWithProperties:properties];
}

-(void)dealloc
{
    [self removeAllBehaviors:nil];
    RELEASE_TO_NIL(_behaviors);
    RELEASE_TO_NIL(_referenceView);
    [super dealloc];
}

#pragma mark - Public API
-(NSNumber*)running
{
    if (theAnimator != nil) {
        __block id result = nil;
        TiThreadPerformOnMainThread(^{
            result = [[NSNumber numberWithBool:[theAnimator isRunning]] retain];
        }, YES);
        return [result autorelease];
    } else {
        return NUMBOOL(NO);
    }
}

-(TiViewProxy*) referenceView
{
    return _referenceView;
}

-(void)setReferenceView:(id)args
{
    if (theAnimator == nil) {
        ENSURE_SINGLE_ARG(args, TiViewProxy);
        TiViewProxy* theView = args;
        if (theView != _referenceView) {
            RELEASE_TO_NIL(_referenceView);
            _referenceView = [theView retain];
        }
        
    } else {
        DebugLog(@"Can not change referenceView when animator is running. Ignoring.");
    }
}

-(NSArray*) behaviors
{
    return [NSArray arrayWithArray:_behaviors];
}

-(void)setBehaviors:(id)args
{
    ENSURE_TYPE(args, NSArray);
    NSArray* curBehaviors = [self behaviors];
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

-(void)addBehavior:(id)args
{
    ENSURE_SINGLE_ARG(args, NSObject);
    id theArg = args;
    if ([theArg conformsToProtocol:@protocol(TiBehaviorProtocol)]) {
        [self rememberProxy:(TiProxy*)theArg];
        [_behaviors addObject:theArg];
        TiThreadPerformOnMainThread(^{
            [theAnimator addBehavior:(UIDynamicBehavior *)[(id<TiBehaviorProtocol>)theArg behaviorObject]];
        }, YES);
        
    } else {
        DebugLog(@"[ERROR] Invalid type passed to addBehavior. Ignoring.");
    }
}

-(void)removeBehavior:(id)args
{
    ENSURE_SINGLE_ARG(args, NSObject);
    id theArg = args;
    if ([theArg conformsToProtocol:@protocol(TiBehaviorProtocol)]) {
        if ([_behaviors containsObject:theArg]) {
            TiThreadPerformOnMainThread(^{
                [theAnimator removeBehavior:(UIDynamicBehavior *)[(id<TiBehaviorProtocol>)theArg behaviorObject]];
                [theArg updatePositioning];
            }, YES);
            [self forgetProxy:(TiProxy*)theArg];
            [_behaviors removeObject:theArg];
            if ([_behaviors count] == 0) {
                [self stopAnimator:nil];
            }
        }
    } else {
        DebugLog(@"[ERROR] Invalid type passed to removeBehavior. Ignoring.");
    }
}

-(void)removeAllBehaviors:(id)unused
{
    [self stopAnimator:nil];
    for (id<TiBehaviorProtocol> theArg in _behaviors) {
        [self forgetProxy:(TiProxy*)theArg];
    }
    [_behaviors removeAllObjects];
}

-(void)startAnimator:(id)unused
{
    if ([_behaviors count] > 0) {
        TiThreadPerformOnMainThread(^{
            theAnimator = [[UIDynamicAnimator alloc] initWithReferenceView:[_referenceView view]];
            theAnimator.delegate = self;
            for (id<TiBehaviorProtocol> theArg in _behaviors) {
                [theAnimator addBehavior:(UIDynamicBehavior *)[(id<TiBehaviorProtocol>)theArg behaviorObject]];
            }
        }, YES);
    }
}

-(void)stopAnimator:(id)unused
{
    TiThreadPerformOnMainThread(^{
        [theAnimator removeAllBehaviors];
        RELEASE_TO_NIL(theAnimator);
        for (id<TiBehaviorProtocol> theArg in _behaviors) {
            [theArg updatePositioning];
        }
    }, YES);
}

#pragma mark - UIDynamicAnimatorDelegate methods
- (void)dynamicAnimatorWillResume:(UIDynamicAnimator*)animator
{
    if ([self _hasListeners:@"resume"]) {
        [self fireEvent:@"resume" withObject:nil propagate:NO reportSuccess:NO errorCode:0 message:nil];
    }
}
- (void)dynamicAnimatorDidPause:(UIDynamicAnimator*)animator
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