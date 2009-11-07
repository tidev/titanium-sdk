/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "LayoutConstraint.h"
#import "TitaniumContentViewController.h"

@interface TitaniumCompositeRule : NSObject
{
	LayoutConstraint constraint;
}
@end


@interface TitaniumCompositeViewController : TitaniumContentViewController {
	NSMutableArray * contentViewControllers;
	NSMutableArray * contentRules;
	NSMutableArray * pendingRules;
	NSMutableArray * pendingViewControllers;

	UIView * view;
}

- (void) addRule: (NSDictionary *) newRuleObject baseUrl:(NSURL *)baseUrl;
- (BOOL) sendJavascript: (NSString *) inputString;

@end
