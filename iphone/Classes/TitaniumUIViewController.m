/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TitaniumUIViewController.h"
#import "TitaniumViewController.h"

TitaniumViewController * TitaniumViewControllerForToken(UIViewController * baseController, NSString * token)
{
	if ([baseController isKindOfClass:[TitaniumViewController class]]){
		if ([(TitaniumViewController *)baseController contextForToken:token] != nil) return (TitaniumViewController *)baseController;
		return nil;
	}
	if ([baseController isKindOfClass:[UITabBarController class]] || [baseController isKindOfClass:[UINavigationController class]]){
		for(UIViewController * thisVC in [(UITabBarController *)baseController viewControllers]){
			TitaniumViewController * result = TitaniumViewControllerForToken(thisVC,token);
			if (result != nil) return result;
		}
	}
	return nil;
}

TitaniumViewController * CurrentTitaniumViewController(UIViewController * baseController)
{
	if ([baseController isKindOfClass:[TitaniumViewController class]]){
		return (TitaniumViewController *)baseController;
	}
	if ([baseController isKindOfClass:[UITabBarController class]]){
		return CurrentTitaniumViewController([(UITabBarController *)baseController selectedViewController]);
	}
	if ([baseController isKindOfClass:[UINavigationController class]]){
		return CurrentTitaniumViewController([(UINavigationController *)baseController visibleViewController]);
	}
	return nil;
}
