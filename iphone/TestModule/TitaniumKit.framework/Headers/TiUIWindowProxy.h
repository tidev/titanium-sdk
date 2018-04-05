/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollBridge.h"
#import <TitaniumKit/TiUIView.h>
#import <TitaniumKit/TiViewProxy.h>
#import "TiWindowProxy.h"

//TODO: we probably should split this ViewProxy into a a separate TiUIView like normal

@interface TiUIWindowProxy : TiWindowProxy {
  @private
  KrollBridge *context;
  BOOL hasToolbar;
  BOOL contextReady;
  BOOL shouldUpdateNavBar;
  UIImageView *barImageView;
  NSURL *oldBaseURL;
  id latch;
}

- (void)refreshBackButton;
- (void)updateNavBar;
- (void)boot:(BOOL)timeout args:(id)args;

#if IS_XCODE_9
@property (nonatomic, assign) TiViewProxy *safeAreaViewProxy;
@property (nonatomic) BOOL shouldExtendSafeArea;
#endif
@end
