/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSPREVIEWCONTEXT
#import "TiViewProxy.h"
#import "TiWindowProxy.h"
#import "TiApp.h"
#import "TiPreviewingDelegate.h"

@interface TiUIiOSPreviewContextProxy : TiViewProxy {
}

@property(nonatomic,retain) TiWindowProxy *window;
@property(nonatomic,retain) TiViewProxy *sourceView;
@property(nonatomic,retain) NSMutableArray *actions;
@property(nonatomic) int width;
@property(nonatomic) int height;

-(void)connectToDelegate;

@end
#endif