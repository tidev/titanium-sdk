/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <UIKit/UIKit.h>

@class TitaniumViewController, TitaniumContentViewController;
TitaniumViewController * TitaniumViewControllerForToken(UIViewController * baseController, NSString * token);
TitaniumContentViewController * TitaniumContentViewControllerForToken(UIViewController * baseController, NSString * token);
TitaniumViewController * CurrentTitaniumViewController(UIViewController * baseController);

