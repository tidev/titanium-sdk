/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATOR
#ifdef USE_TI_UIIOSANCHORATTACHMENTBEHAVIOR
#import "TiAnimatorProxy.h"
#import <TitaniumKit/TiProxy.h>
@interface TiAnchorAttachBehavior : TiProxy <TiBehaviorProtocol> {
  CGFloat _damping;
  CGFloat _frequency;
  CGFloat _length;
  CGPoint _anchor;
  CGPoint _offset;
  TiViewProxy *_item;
  UIAttachmentBehavior *_attachBehavior;
  BOOL _needsRefresh;
}

#pragma mark - Public API
- (void)setItem:(id)args;
- (TiViewProxy *)item;
- (void)setDamping:(id)args;
- (NSNumber *)damping;
- (void)setFrequency:(id)args;
- (NSNumber *)frequency;
- (void)setDistance:(id)args;
- (NSNumber *)distance;
- (void)setAnchor:(id)args;
- (NSDictionary *)anchor;
- (void)setOffset:(id)args;
- (NSDictionary *)offset;
@end
#endif
#endif
