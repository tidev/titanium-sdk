/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSPUSHBEHAVIOR
#import "TiAnimatorProxy.h"
#import <TitaniumKit/TiProxy.h>
#import <TitaniumKit/TiViewProxy.h>
@interface TiPushBehavior : TiProxy <TiBehaviorProtocol> {
  BOOL _active;
  CGFloat _angle;
  CGFloat _magnitude;
  CGVector _vector;
  UIPushBehavior *_pushBehavior;
  UIPushBehaviorMode _mode;
  NSMutableArray *_items;
  BOOL _needsRefresh;
  BOOL _vectorDefined;
}

#pragma mark - Public API
- (void)addItem:(id)args;
- (void)removeItem:(id)args;
- (NSArray *)items;
- (void)setAngle:(id)args;
- (NSNumber *)angle;
- (void)setMagnitude:(id)args;
- (NSNumber *)magnitude;
- (void)setPushDirection:(id)args;
- (NSDictionary *)pushDirection;
- (void)setPushMode:(id)args;
- (NSNumber *)pushMode;
- (void)setActive:(id)args;
- (NSNumber *)active;
@end
#endif
#endif
