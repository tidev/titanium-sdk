/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>


@protocol TiRootController
@required
-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)orientation;

-(void)windowFocused:(UIViewController*)focusedViewController;
-(void)windowClosed:(UIViewController *)closedViewController;

-(CGRect)resizeView;
-(void)repositionSubviews;

-(void)setBackgroundColor:(UIColor*)color;
-(void)setBackgroundImage:(UIImage*) backgroundImage;
@end
