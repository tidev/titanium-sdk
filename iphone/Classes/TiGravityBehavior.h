/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSGRAVITYBEHAVIOR
#import "TiProxy.h"
#import "TiViewProxy.h"
#import "TiAnimatorProxy.h"
@interface TiGravityBehavior : TiProxy <TiBehaviorProtocol> {
    CGFloat _angle;
    CGFloat _magnitude;
    CGVector _vector;
    UIGravityBehavior* _gravityBehavior;
    NSMutableArray* _items;
    BOOL _needsRefresh;
    BOOL _vectorDefined;
}

#pragma mark - Public API
-(void)addItem:(id)args;
-(void)removeItem:(id)args;
-(NSArray*)items;
-(void)setAngle:(id)args;
-(NSNumber*)angle;
-(void)setMagnitude:(id)args;
-(NSNumber*)magnitude;
-(void)setGravityDirection:(id)args;
-(NSDictionary*)gravityDirection;
@end
#endif
#endif
