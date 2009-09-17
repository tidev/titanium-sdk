/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

@interface TitaniumCompositeRule : NSObject
{
	TitaniumContentViewController * viewController;
	CGFloat z;
	CGRect bounds;
	BOOL hasXConstraint;
	BOOL hasYConstraint;
	BOOL hasWidthConstraint;
	BOOL hasHeightConstraint;
}
@property(nonatomic,readwrite,retain)	TitaniumContentViewController * viewController;
@property(nonatomic,readwrite,assign)	CGFloat z;
@property(nonatomic,readwrite,assign)	CGRect bounds;
@property(nonatomic,readwrite,assign)	BOOL hasXConstraint;
@property(nonatomic,readwrite,assign)	BOOL hasYConstraint;
@property(nonatomic,readwrite,assign)	BOOL hasWidthConstraint;
@property(nonatomic,readwrite,assign)	BOOL hasHeightConstraint;

@end


@interface TitaniumCompositeViewController : TitaniumContentViewController {
	NSArray * viewControllerRules;
}

@end
