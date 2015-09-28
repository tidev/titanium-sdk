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

@interface TiUIiOSPreviewContextProxy : TiViewProxy

/**
    The window to preview and open.
 */
@property(nonatomic,retain) TiWindowProxy *window;

/**
    The source view which triggered the peek.
 */
@property(nonatomic,retain) TiViewProxy *sourceView;

/**
    The preview actions.
 */
@property(nonatomic,retain) NSMutableArray *actions;

/**
    The width of the preview.
 */
@property(nonatomic) int width;

/**
    The height of the preview
 */
@property(nonatomic) int height;

/**
    Connectes the collected preview data to the iOS delegates.
 */
-(void)connectToDelegate;

@end
#endif