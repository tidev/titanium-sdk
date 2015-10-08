/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if IS_XCODE_7
#ifdef USE_TI_UIIOSPREVIEWCONTEXT

#import "TiViewProxy.h"
#import "TiUIiOSPreviewActionProxy.h"

@interface TiUIiOSPreviewActionGroupProxy : TiViewProxy {
    UIPreviewActionGroup *actionGroup;
}

/**
    The actions assigned to the preview action group.
 */
@property(nonatomic, retain) NSMutableArray<UIPreviewAction*> *actions;

/**
 The title of the preview action group.
 */
@property(nonatomic, retain) NSString *title;

/**
 The style of the preview action group.
 */
@property(nonatomic) UIPreviewActionStyle style;

/**
 The index of the action group inside the previewing context.
 */
@property(nonatomic,assign) int actionGroupIndex;

/**
 Returns a configured preview action group.
 @return The configured UIPreviewActionGroup.
 */
-(UIPreviewActionGroup*)group;

@end
#endif
#endif