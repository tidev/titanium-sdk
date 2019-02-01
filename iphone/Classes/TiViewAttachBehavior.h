/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSVIEWATTACHMENTBEHAVIOR
#import "TiAnimatorProxy.h"
#import <TitaniumKit/TiProxy.h>
@interface TiViewAttachBehavior : TiProxy <TiBehaviorProtocol> {
  CGFloat _damping;
  CGFloat _frequency;
  CGFloat _length;
  CGPoint _itemOffset;
  CGPoint _anchorOffset;
  TiViewProxy *_item;
  TiViewProxy *_anchorItem;
  UIAttachmentBehavior *_attachBehavior;
  BOOL _needsRefresh;
}

#pragma mark - Public API
- (void)setItem:(id)args;
- (TiViewProxy *)item;
- (void)setAnchorItem:(id)args;
- (TiViewProxy *)anchorItem;
- (void)setDamping:(id)args;
- (NSNumber *)damping;
- (void)setFrequency:(id)args;
- (NSNumber *)frequency;
- (void)setDistance:(id)args;
- (NSNumber *)distance;
- (void)setItemOffset:(id)args;
- (NSDictionary *)itemOffset;
- (void)setAnchorOffset:(id)args;
- (NSDictionary *)anchorOffset;
@end
#endif
#endif
