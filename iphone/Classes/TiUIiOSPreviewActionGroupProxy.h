/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSPREVIEWCONTEXT

#import "TiUIiOSPreviewActionProxy.h"
#import <TitaniumKit/TiViewProxy.h>

@interface TiUIiOSPreviewActionGroupProxy : TiViewProxy {
  UIPreviewActionGroup *actionGroup;
}

/**
    The actions assigned to the preview action group.
 */
@property (nonatomic, retain) NSMutableArray<UIPreviewAction *> *actions;

/**
    The title of the preview action group.
 */
@property (nonatomic, retain) NSString *title;

/**
    The style of the preview action group.
 */
@property (nonatomic, assign) UIPreviewActionStyle style;

/**
    Returns a configured preview action group.
    @return The configured UIPreviewActionGroup.
 */
- (UIPreviewActionGroup *)actionGroup;

@end
#endif
