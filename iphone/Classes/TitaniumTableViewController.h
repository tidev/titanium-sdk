/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

typedef enum {
	TitaniumTableActionInsertRow,
	TitaniumTableActionDeleteRow,
	TitaniumTableActionUpdateRows,
} TitaniumTableAction;

@interface TitaniumTableActionWrapper : NSObject
{
	TitaniumTableAction kind;
	int index;
	NSDictionary * insertedRow;
	NSArray * updatedRows;
	UITableViewRowAnimation animation;
}

@property(nonatomic,assign)	TitaniumTableAction kind;
@property(nonatomic,assign)	int index;
@property(nonatomic,copy)	NSDictionary * insertedRow;
@property(nonatomic,copy)	NSArray * updatedRows;
@property(nonatomic,assign)	UITableViewRowAnimation animation;

@end



@interface TitaniumTableViewController : TitaniumContentViewController<UITableViewDelegate,UITableViewDataSource,UIWebViewDelegate> {
	UITableViewStyle tableStyle;
	CGFloat tableRowHeight;
	
	NSLock * sectionLock;
	NSMutableArray * sectionArray;
	NSString * callbackWindowToken;
	NSString * callbackProxyPath;

	NSIndexPath * blessedPath;
	UITableView * tableView;
	
	NSLock * actionLock;
	NSMutableArray * actionQueue;
}

- (void)enqueueAction: (TitaniumTableActionWrapper *) newAction;

@end
