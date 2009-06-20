//
//  TitaniumTableViewController.h
//  Titanium
//
//  Created by Blain Hamon on 6/17/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "TitaniumViewController.h"

@interface TitaniumTableViewController : TitaniumViewController<UITableViewDelegate,UITableViewDataSource> {
	UITableViewStyle tableStyle;
	CGFloat tableRowHeight;
	
	NSMutableArray * sectionArray;
	NSString * callbackWindowToken;
	NSString * callbackProxyPath;
}

@end
