/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

typedef enum {
	TitaniumTableActionIndexed			=0x100,

	TitaniumTableActionDeleteRow		=0x101,
	TitaniumTableActionInsertBeforeRow	=0x102,
	TitaniumTableActionInsertAfterRow	=0x103,
	TitaniumTableActionUpdateRow		=0x104,
	TitaniumTableActionAppendRow		=0x105,

	TitaniumTableActionReload			=0x200,
	TitaniumTableActionReloadData		=0x201,
	TitaniumGroupActionReloadSections	=0x202,

	TitaniumTableActionSectionRow		=0x400,
	TitaniumGroupActionInsertBeforeRow	=0x401,
	TitaniumGroupActionDeleteRow		=0x402,
	TitaniumGroupActionUpdateRow		=0x403,

	TitaniumTableActionSection			=0x800,
	TitaniumGroupActionInsertBeforeGroup=0x801,
	TitaniumGroupActionDeleteGroup		=0x802,
	TitaniumGroupActionUpdateGroup		=0x803,

	TitaniumTableActionScroll			=0x010,
	TitaniumTableActionScrollRow		=TitaniumTableActionScroll | TitaniumTableActionIndexed,
	TitaniumTableActionScrollSectionRow	=TitaniumTableActionScroll | TitaniumTableActionSectionRow,

	
} TitaniumTableAction;

@interface TitaniumTableActionWrapper : NSObject
{
	TitaniumTableAction kind;
	int index;
	int section;
	int row;

	NSDictionary * sectionData;
	NSDictionary * rowData;
	NSArray * replacedData;
	UITableViewRowAnimation animation;
	NSURL * baseUrl;
	
	BOOL	isAnimated;
	UITableViewScrollPosition scrollPosition;
}

@property(nonatomic,assign)	TitaniumTableAction kind;
@property(nonatomic,assign)	int index;
@property(nonatomic,assign)	int section;
@property(nonatomic,assign)	int row;

@property(nonatomic,copy)	NSDictionary * sectionData;
@property(nonatomic,copy)	NSDictionary * rowData;
@property(nonatomic,copy)	NSArray * replacedData;
@property(nonatomic,copy)	NSURL * baseUrl;
@property(nonatomic,assign)	UITableViewRowAnimation animation;

@property(nonatomic,assign)	BOOL	isAnimated;
@property(nonatomic,assign)	UITableViewScrollPosition scrollPosition;


- (void) getBaseUrl;
- (void) setAnimationDict: (NSDictionary *) animationDict;

@end


@class TitaniumCellWrapper;
@interface TitaniumTableViewController : TitaniumContentViewController<UITableViewDelegate,UITableViewDataSource,UIWebViewDelegate,UISearchBarDelegate> {
	UITableViewStyle tableStyle;
	CGFloat tableRowHeight;
//	BOOL	useRowHeightCallback;
	
	UIColor * borderColor;

	float marginTop;
	float marginLeft;
	float marginRight;
	float marginBottom;
	
	NSLock * sectionLock;
	NSMutableArray * sectionArray;
	NSString * callbackWindowToken;
	NSString * callbackProxyPath;

	NSIndexPath * blessedPath;
	
	UIView * wrapperView;
	UITableView * tableView;
	
	NSLock * actionLock;
	NSMutableArray * actionQueue;

	UIColor * backgroundColor;
	
	NativeControlProxy * searchField;
	NSString * searchAttributeKey;
//	NSString * lastSearchString;	//Todo: Optimize
	NSMutableArray * searchResultIndexes;

	UITableView * searchTableView;
	UIButton * searchScreenView;


	TitaniumCellWrapper * templateCell;
}

- (void)enqueueAction: (TitaniumTableActionWrapper *) newAction;

@end
