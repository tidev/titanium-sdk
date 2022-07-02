/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBUTTON

#import <TitaniumKit/TiViewProxy.h>

@class TiUIView;

@interface TiUINavBarButton : UIBarButtonItem <TiProxyDelegate> {
  @private
  TiViewProxy *proxy;
  TiUIView *activityDelegate;
}
@property (nonatomic, readonly) TiViewProxy *proxy;

- (id)initWithProxy:(TiProxy *)proxy;

@end

#endif
