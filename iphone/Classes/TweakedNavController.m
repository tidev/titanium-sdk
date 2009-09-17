/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TweakedNavController.h"

@implementation TweakedNavController




- (void)pushViewController:(UIViewController *)viewController animated:(BOOL)animated; // Uses a horizontal slide transition. Has no effect if the view controller is already in the stack.
{
	[super pushViewController:viewController animated:animated];
}

- (UIViewController *)popViewControllerAnimated:(BOOL)animated; // Returns the popped controller.
{
	return [super popViewControllerAnimated:animated];
}

- (NSArray *)popToViewController:(UIViewController *)viewController animated:(BOOL)animated; // Pops view controllers until the one specified is on top. Returns the popped controllers.
{
	return [super popToViewController:viewController animated:animated];
}

- (NSArray *)popToRootViewControllerAnimated:(BOOL)animated; // Pops until there's only a single view controller left on the stack. Returns the popped controllers.
{
	NSArray * ourViewControllers = [self viewControllers];
	for (UIViewController * ourVC in [ourViewControllers reverseObjectEnumerator]){
		if ([[ourVC navigationItem] hidesBackButton]){
			return [super popToViewController:ourVC animated:animated];
		}
	}
	return [super popToRootViewControllerAnimated:animated];
}


- (void)dealloc {
    [super dealloc];
}


@end
