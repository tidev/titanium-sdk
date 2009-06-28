/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumViewController.h"

@interface TitaniumTableViewController : TitaniumViewController<UITableViewDelegate,UITableViewDataSource,UIWebViewDelegate> {
	UITableViewStyle tableStyle;
	CGFloat tableRowHeight;
	
	NSMutableArray * sectionArray;
	NSString * callbackWindowToken;
	NSString * callbackProxyPath;
}

@end
