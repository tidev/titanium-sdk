/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

@interface TitaniumTableViewController : TitaniumContentViewController<UITableViewDelegate,UITableViewDataSource,UIWebViewDelegate> {
	UITableViewStyle tableStyle;
	CGFloat tableRowHeight;
	
	NSLock * sectionLock;
	NSMutableArray * sectionArray;
	NSString * callbackWindowToken;
	NSString * callbackProxyPath;

	NSIndexPath * blessedPath;
	UITableView * tableView;
}

@end
