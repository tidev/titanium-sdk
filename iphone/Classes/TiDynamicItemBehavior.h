/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSDYNAMICITEMBEHAVIOR
#import "TiAnimatorProxy.h"
#import <TitaniumKit/TiProxy.h>
@interface TiDynamicItemBehavior : TiProxy <TiBehaviorProtocol> {
  NSMutableArray *_items;
  NSMutableArray *_angularVelocities;
  NSMutableArray *_linearVelocities;
  UIDynamicItemBehavior *_dynamicItemBehavior;
  CGFloat _friction;
  CGFloat _elasticity;
  CGFloat _resistance;
  CGFloat _angularResistance;
  BOOL _allowsRotation;
  CGFloat _density;
}
#pragma mark - Public API
- (void)addItem:(id)args;
- (void)removeItem:(id)args;
- (NSArray *)items;
- (void)setAllowsRotation:(id)args;
- (NSNumber *)allowsRotation;
- (void)setAngularResistance:(id)args;
- (NSNumber *)angularResistance;
- (void)setResistance:(id)args;
- (NSNumber *)resistance;
- (void)setDensity:(id)args;
- (NSNumber *)density;
- (void)setElasticity:(id)args;
- (NSNumber *)elasticity;
- (void)setFriction:(id)args;
- (NSNumber *)friction;
- (void)addAngularVelocityForItem:(id)args;
- (void)addLinearVelocityForItem:(id)args;
- (NSNumber *)angularVelocityForItem:(id)args;
- (NSDictionary *)linearVelocityForItem:(id)args;
@end
#endif
#endif
