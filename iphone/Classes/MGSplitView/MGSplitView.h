/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPADSPLITWINDOW

#import <UIKit/UIKit.h>
#import "MGSplitViewController.h"

@interface MGSplitView : UIView {
    MGSplitViewController* controller;
    BOOL layingOut;
    BOOL singleLayout;
}
@property(nonatomic,readwrite,assign) BOOL layingOut;

- (id)initWithFrame:(CGRect)frame controller:(MGSplitViewController*)controller_;
-(void)setSingleLayout;
@end

#endif