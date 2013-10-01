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

-(void)_initWithProperties:(NSDictionary *)properties
{
    _damping = 0.5;

    [super _initWithProperties:properties];
}

-(void)dealloc
{
    RELEASE_TO_NIL(_snapItem);
    [super dealloc];
}

#pragma mark - TiBehaviorProtocol
-(id)behaviorObject
{
    return [[[UISnapBehavior alloc] initWithItem:[_snapItem view] snapToPoint:_snapPoint] autorelease];
}

#pragma mark - Public API

-(TiViewProxy*) item
{
    return _snapItem;
}

-(void) setItem:(id)args;
{
    ENSURE_SINGLE_ARG(args, TiViewProxy);
    RELEASE_TO_NIL(_snapItem);
    _snapItem = [(TiViewProxy*)args retain];
}

-(NSNumber*) damping
{
    return [NSNumber numberWithFloat:_damping];
}

-(void) setDamping:(id)args
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
    }
}

-(NSDictionary*) snapPoint
{
    return [TiUtils pointToDictionary:_snapPoint];
}

-(void) setSnapPoint:(id)args
{
    ENSURE_SINGLE_ARG(args, NSObject);
    _snapPoint = [TiUtils pointValue:args];
}

@end
#endif
#endif