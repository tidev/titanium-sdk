/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBUTTON

#import "TiViewProxy.h"

@class TiUIView;

@interface TiUINavBarButton : UIBarButtonItem<TiProxyDelegate> {
@private
	TiViewProxy *proxy;
	TiUIView *activityDelegate;
}
@property(nonatomic,readonly) TiViewProxy* proxy;

-(id)initWithProxy:(TiProxy*)proxy;

@end

#endif