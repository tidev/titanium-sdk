/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSPREVIEWCONTEXT
#import "TiPreviewingDelegate.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiViewProxy.h>
#import <TitaniumKit/TiWindowProxy.h>

@interface TiUIiOSPreviewContextProxy : TiViewProxy

/**
    The proxy to be displayed on peek.
 */
@property (nonatomic, retain) TiViewProxy *preview;

/**
    The source view which triggered the peek.
 */
@property (nonatomic, retain) TiViewProxy *sourceView;

/**
    The preview actions.
 */
@property (nonatomic, retain) NSMutableArray *actions;

/**
    The height of the preview.
 */
@property (nonatomic, assign) int contentHeight;

/**
    Connectes the collected preview data to the iOS delegates.
 */
- (void)connectToDelegate;

@end
#endif
