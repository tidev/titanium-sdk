/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

@class TitaniumCellWrapper;
@interface ComplexTableViewCell : UITableViewCell {
	TitaniumCellWrapper * dataWrapper;
	NSMutableArray * layoutViewsArray;
	id lastLayoutArray;	//Is not retained, and kept only as a memory value, NOT to be used as an object.
	NSString * clickedName;
	NSMutableSet * watchedBlobs;
}

@property(nonatomic,readwrite,retain) TitaniumCellWrapper * dataWrapper;
@property(nonatomic,readwrite,retain) NSString * clickedName;

@end
