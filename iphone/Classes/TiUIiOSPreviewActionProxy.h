/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSPREVIEWACTION
#import "TiViewProxy.h"

@interface TiUIiOSPreviewActionProxy : TiViewProxy
{
    UIPreviewAction *action;
    NSString *title;
    UIPreviewActionStyle style;
}

/**
    The index of the action inside the previewing context.
 */
@property(nonatomic,assign) int actionIndex;

/**
    Initializes a new preview action proxy.
    @param args The title and style of the action.
    @return The configured proxy.
 */
-(instancetype)initWithArguments:(id)args;

/**
    Returns a configured preview action.
    @return The configured UIPreviewAction.
 */
-(UIPreviewAction*)action;

/**
    Fires an event when an action is clicked.
    @param The clicked UIPreviewAction.
 */
-(void)fireEventWithAction:(UIPreviewAction*)action;

@end
#endif