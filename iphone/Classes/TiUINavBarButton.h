/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBUTTON

#import "TiProxy.h"

@class TiUIView;

@interface TiUINavBarButton : UIBarButtonItem<TiProxyDelegate> {
@private
	TiProxy *proxy;
	TiUIView *activityDelegate;
}

-(id)initWithProxy:(TiProxy*)proxy;

@end

#endif