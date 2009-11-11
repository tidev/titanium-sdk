/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumImageViewController.h"

@class TitaniumCellWrapper;
@interface ComplexTableViewCell : UITableViewCell<TitaniumImageViewDelegate> {
	TitaniumCellWrapper * dataWrapper;
	NSMutableArray * layoutViewsArray;
	NSString * clickedName;
}

@property(nonatomic,readwrite,retain) TitaniumCellWrapper * dataWrapper;
@property(nonatomic,readwrite,retain) NSString * clickedName;

@end
