/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

typedef enum {
	TitaniumTableActionDeleteRow,
	TitaniumTableActionInsertBeforeRow,
	TitaniumTableActionInsertAfterRow,
	TitaniumTableActionUpdateRow,
	TitaniumTableActionReloadData,

	TitaniumGroupActionInsertRow,
	TitaniumGroupActionDeleteRow,
	TitaniumGroupActionUpdateRow,

	TitaniumGroupActionInsertGroup,
	TitaniumGroupActionDeleteGroup,
} TitaniumTableAction;

@interface TitaniumTableActionWrapper : NSObject
{
	TitaniumTableAction kind;
	int index;
	NSDictionary * rowData;
	NSArray * updatedRows;
	NSArray * replacedData;
	UITableViewRowAnimation animation;
	NSURL * baseUrl;
}

@property(nonatomic,assign)	TitaniumTableAction kind;
@property(nonatomic,assign)	int index;
@property(nonatomic,copy)	NSDictionary * rowData;
@property(nonatomic,copy)	NSArray * updatedRows;
@property(nonatomic,copy)	NSArray * replacedData;
@property(nonatomic,copy)	NSURL * baseUrl;
@property(nonatomic,assign)	UITableViewRowAnimation animation;

- (void) getBaseUrl;
- (void) setAnimationDict: (NSDictionary *) animationDict;

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
