/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TitaniumUIViewController.h"
#import "TitaniumViewController.h"
#import "TitaniumContentViewController.h"

TitaniumViewController * TitaniumViewControllerForToken(UIViewController * baseController, NSString * token)
{
	if ([baseController isKindOfClass:[TitaniumViewController class]]){
		if ([(TitaniumViewController *)baseController hasToken:token]) return (TitaniumViewController *)baseController;
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

TitaniumContentViewController * TitaniumContentViewControllerForToken(UIViewController * baseController, NSString * token)
{
	if ([baseController isKindOfClass:[TitaniumViewController class]]){
		for(UIViewController * thisVC in [(TitaniumViewController *)baseController contentViewControllers]){
			TitaniumContentViewController * result = TitaniumContentViewControllerForToken(thisVC,token);
			if (result != nil) return result;
		}
	}
	if ([baseController isKindOfClass:[TitaniumContentViewController class]]){
		if ([(TitaniumContentViewController *)baseController hasToken:token]) return (TitaniumContentViewController *)baseController;
		return nil;
	}
	if ([baseController isKindOfClass:[UITabBarController class]] || [baseController isKindOfClass:[UINavigationController class]]){
		for(UIViewController * thisVC in [(UITabBarController *)baseController viewControllers]){
			TitaniumContentViewController * result = TitaniumContentViewControllerForToken(thisVC,token);
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
		UINavigationController * thisVC = (UINavigationController*)[(UITabBarController *)baseController selectedViewController];
		if ([[thisVC viewControllers] count]==0){
			thisVC = [(UITabBarController *)baseController moreNavigationController];
		}
		return CurrentTitaniumViewController(thisVC);
	}
	if ([baseController isKindOfClass:[UINavigationController class]]){
		return CurrentTitaniumViewController([(UINavigationController *)baseController visibleViewController]);
	}
	return nil;
}
