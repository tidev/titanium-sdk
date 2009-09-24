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

	CGFloat left;
	CGFloat right;
	CGFloat width;

	CGFloat top;
	CGFloat bottom;
	CGFloat height;

	BOOL hasZConstraint;

	BOOL hasLeftConstraint;
	BOOL hasRightConstraint;
	BOOL hasWidthConstraint;

	BOOL hasTopConstraint;
	BOOL hasBottomConstraint;
	BOOL hasHeightConstraint;
}
@property(nonatomic,readwrite,retain)	TitaniumContentViewController * viewController;

@end


@interface TitaniumCompositeViewController : TitaniumContentViewController {
	NSMutableArray * viewControllerRules;
	NSMutableArray * pendingRules;

	UIView * view;
}

- (void) addRule: (NSDictionary *) newRuleObject baseUrl:(NSURL *)baseUrl;

@end
