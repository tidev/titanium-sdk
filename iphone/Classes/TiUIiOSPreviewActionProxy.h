/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSPREVIEWCONTEXT

#import <TitaniumKit/TiViewProxy.h>

@interface TiUIiOSPreviewActionProxy : TiViewProxy {
  UIPreviewAction *action;
}

/**
    The index of the action inside the previewing context.
 */
@property (nonatomic, assign) NSUInteger actionIndex;

/**
    The style of the preview action
 */
@property (nonatomic, assign) UIPreviewActionStyle style;

/**
    The title of the preview action
 */
@property (nonatomic, retain) NSString *title;

/**
    The indexPath for accessing section and item of
    the tableView if specified.
*/
@property (nonatomic, retain) NSDictionary *listViewEvent;

/**
    Returns a configured preview action.
    @return The configured UIPreviewAction.
 */
- (UIPreviewAction *)action;

/**
    Fires an event when an action is clicked.
    @param The clicked UIPreviewAction.
 */
- (void)fireEventWithAction:(UIPreviewAction *)action;

@end

#endif
