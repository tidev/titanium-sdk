/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSDYNAMICITEMBEHAVIOR
#import "TiDynamicItemBehavior.h"

@implementation TiDynamicItemBehavior

-(void)_initWithProperties:(NSDictionary *)properties
{
    _items = [[NSMutableArray alloc] init];
    _angularVelocities = [[NSMutableArray alloc] init];
    _linearVelocities = [[NSMutableArray alloc] init];
    _friction = 0;
    _elasticity = 0;
    _resistance = 0;
    _angularResistance = 0;
    _density = 1;
    _allowsRotation = YES;
    [super _initWithProperties:properties];
}

-(void)dealloc
{
    RELEASE_TO_NIL(_items);
    RELEASE_TO_NIL(_angularVelocities);
    RELEASE_TO_NIL(_linearVelocities);
    [super dealloc];
}

#pragma mark - TiBehaviorProtocol
-(UIDynamicBehavior*)behaviorObject
{
    if (_dynamicItemBehavior == nil) {
        NSMutableArray* viewItems = [[NSMutableArray alloc] initWithCapacity:_items.count];
        for (TiViewProxy* theArg in _items) {
            [viewItems addObject:[theArg view]];
        }
        _dynamicItemBehavior = [[UIDynamicItemBehavior alloc] initWithItems:viewItems];
        [_dynamicItemBehavior setFriction:_friction];
        [_dynamicItemBehavior setElasticity:_elasticity];
        [_dynamicItemBehavior setResistance:_resistance];
        [_dynamicItemBehavior setAngularResistance:_angularResistance];
        [_dynamicItemBehavior setAllowsRotation:_allowsRotation];
        [_dynamicItemBehavior setDensity:_density];
        
        NSUInteger max = [viewItems count];
        NSUInteger counter = 0;
        while (counter < max) {
            [_dynamicItemBehavior addAngularVelocity:[TiUtils floatValue:[_angularVelocities objectAtIndex:counter] def:0] forItem:[viewItems objectAtIndex:counter]];
            [_dynamicItemBehavior addLinearVelocity:[(TiPoint*)[_linearVelocities objectAtIndex:counter] point] forItem:[viewItems objectAtIndex:counter]];
            counter++;
        }

        [viewItems release];
        void (^update)(void) = ^{
            [self updateItems];
        };
        _dynamicItemBehavior.action = update;
    }
    
    return _dynamicItemBehavior;
}

-(void)updateItems
{
    DebugLog(@"GOT UPDATE ITEMS CALL");
}

#pragma mark - Public API

-(void)addItem:(id)args
{
    ENSURE_SINGLE_ARG(args, TiViewProxy);
    if (![_items containsObject:args]) {
        [self rememberProxy:args];
        [_items addObject:args];
        [_angularVelocities addObject:NUMFLOAT(0)];
        TiPoint* newPoint = [[TiPoint alloc] initWithPoint:CGPointZero];
        [_linearVelocities addObject:newPoint];
        [newPoint release];
        if (_dynamicItemBehavior != nil) {
            TiThreadPerformOnMainThread(^{
                [_dynamicItemBehavior addItem:[(TiViewProxy*)args view]];
            }, YES);
        }
    }
}

-(void)removeItem:(id)args
{
    ENSURE_SINGLE_ARG(args, TiViewProxy);
    if ([_items containsObject:args]) {
        if (_dynamicItemBehavior != nil) {
            TiThreadPerformOnMainThread(^{
                [_dynamicItemBehavior removeItem:[(TiViewProxy*)args view]];
            }, YES);
        }
        NSUInteger theIndex = [_items indexOfObject:args];
        [_items removeObject:args];
        [_angularVelocities removeObjectAtIndex:theIndex];
        [_linearVelocities removeObjectAtIndex:theIndex];
        [self forgetProxy:args];
    }
}

-(NSArray*)items
{
    return [NSArray arrayWithArray:_items];
}

-(void)setAllowsRotation:(id)args
{
    ENSURE_SINGLE_ARG(args, NSObject);
    _allowsRotation = [TiUtils boolValue:args def:YES];
    if (_dynamicItemBehavior != nil) {
        TiThreadPerformOnMainThread(^{
            [_dynamicItemBehavior setAllowsRotation:_allowsRotation];
        }, YES);
    }
}

-(NSNumber*)allowsRotation
{
    return NUMBOOL(_allowsRotation);
}

-(void)setAngularResistance:(id)args
{
    ENSURE_SINGLE_ARG(args, NSNumber);
    _angularResistance = [TiUtils floatValue:args def:_angularResistance];
    if (_dynamicItemBehavior != nil) {
        TiThreadPerformOnMainThread(^{
            [_dynamicItemBehavior setAngularResistance:_angularResistance];
        }, YES);
    }
}

-(NSNumber*)angularResistance
{
    return NUMFLOAT(_angularResistance);
}

-(void)setResistance:(id)args
{
    ENSURE_SINGLE_ARG(args, NSNumber);
    _resistance = [TiUtils floatValue:args def:_resistance];
    if (_dynamicItemBehavior != nil) {
        TiThreadPerformOnMainThread(^{
            [_dynamicItemBehavior setResistance:_resistance];
        }, YES);
    }
}

-(NSNumber*)resistance
{
    return NUMFLOAT(_resistance);
}

-(void)setDensity:(id)args
{
    ENSURE_SINGLE_ARG(args, NSNumber);
    _density = [TiUtils floatValue:args def:_density];
    if (_dynamicItemBehavior != nil) {
        TiThreadPerformOnMainThread(^{
            [_dynamicItemBehavior setDensity:_density];
        }, YES);
    }
}

-(NSNumber*)density
{
    return NUMFLOAT(_density);
}

-(void)setElasticity:(id)args
{
    ENSURE_SINGLE_ARG(args, NSNumber);
    CGFloat newVal = [TiUtils floatValue:args def:_elasticity];
    if (newVal < 0) {
        _elasticity = 0;
    } else if (newVal > 1) {
        _elasticity = 1;
    } else {
        _elasticity = newVal;
    }
    if (_dynamicItemBehavior != nil) {
        TiThreadPerformOnMainThread(^{
            [_dynamicItemBehavior setElasticity:_elasticity];
        }, YES);
    }
}

-(NSNumber*)elasticity
{
    return NUMFLOAT(_elasticity);
}

-(void)setFriction:(id)args
{
    ENSURE_SINGLE_ARG(args, NSNumber);
    CGFloat newVal = [TiUtils floatValue:args def:_friction];
    if (newVal < 0) {
        _friction = 0;
    } else if (newVal > 1) {
        _friction = 1;
    } else {
        _friction = newVal;
    }
    if (_dynamicItemBehavior != nil) {
        TiThreadPerformOnMainThread(^{
            [_dynamicItemBehavior setFriction:_friction];
        }, YES);
    }
}

-(NSNumber*)friction
{
    return NUMFLOAT(_friction);
}

-(void)addAngularVelocityForItem:(id)args
{
    TiViewProxy* theItem = nil;
    NSNumber* theVelocity = nil;
    ENSURE_ARG_AT_INDEX(theItem, args, 0, TiViewProxy);
    ENSURE_ARG_AT_INDEX(theVelocity, args, 1, NSNumber);
    if ([_items containsObject:theItem]) {
        CGFloat floatVal = [TiUtils floatValue:theVelocity def:0];
        if (floatVal != 0) {
            if (_dynamicItemBehavior != nil) {
                TiThreadPerformOnMainThread(^{
                    [_dynamicItemBehavior addAngularVelocity:floatVal forItem:[theItem view]];
                }, YES);
            }
            NSUInteger theIndex = [_items indexOfObject:args];
            CGFloat curVal = [TiUtils floatValue:[_angularVelocities objectAtIndex:theIndex] def:0] + floatVal;
            [_angularVelocities replaceObjectAtIndex:theIndex withObject:NUMFLOAT(curVal)];
        }
    } else {
        DebugLog(@"[ERROR] The item specified is not an item specified by this behavior object");
    }
}

-(void)addLinearVelocityForItem:(id)args
{
    TiViewProxy* theItem = nil;
    NSDictionary* theVelocity = nil;
    ENSURE_ARG_AT_INDEX(theItem, args, 0, TiViewProxy);
    ENSURE_ARG_AT_INDEX(theVelocity, args, 1, NSDictionary);
    if ([_items containsObject:theItem]) {
        CGPoint newPoint = [TiUtils pointValue:theVelocity];
        if (!CGPointEqualToPoint(newPoint, CGPointZero)) {
            if (_dynamicItemBehavior != nil) {
                TiThreadPerformOnMainThread(^{
                    [_dynamicItemBehavior addLinearVelocity:newPoint forItem:[theItem view]];
                }, YES);
            }
            NSUInteger theIndex = [_items indexOfObject:args];
            TiPoint* thePoint = [_linearVelocities objectAtIndex:theIndex];
            CGPoint curPoint = [ thePoint point];
            curPoint.x = curPoint.x + newPoint.x;
            curPoint.y = curPoint.y + newPoint.y;
            [thePoint setPoint:curPoint];
        }
    } else {
        DebugLog(@"[ERROR] The item specified is not an item managed by this behavior object");
    }
}

-(NSNumber*)angularVelocityForItem:(id)args
{
    ENSURE_SINGLE_ARG(args, TiViewProxy);
    if ([_items containsObject:args]) {
        NSUInteger theIndex = [_items indexOfObject:args];
        return [_angularVelocities objectAtIndex:theIndex];
    } else {
        DebugLog(@"[ERROR] The item specified is not an item managed by this behavior object");
    }
}

-(NSDictionary*)linearVelocityForItem:(id)args
{
    ENSURE_SINGLE_ARG(args, TiViewProxy);
    if ([_items containsObject:args]) {
        NSUInteger theIndex = [_items indexOfObject:args];
        CGPoint curPoint = [ [_linearVelocities objectAtIndex:theIndex] point];
        return [TiUtils pointToDictionary:curPoint];
    } else {
        DebugLog(@"[ERROR] The item specified is not an item managed by this behavior object");
    }
}

@end
#endif
#endif