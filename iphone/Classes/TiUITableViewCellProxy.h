/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewProxy.h"

@class WebFont, TiUITableViewCell;

@interface TiUITableViewCellProxy : TiProxy {

@private
	TiDimension  rowHeight;
	TiDimension  minRowHeight;
	TiDimension  maxRowHeight;
	WebFont * font;
}

-(TiUITableViewCell *)cellForTableView:(UITableView *)tableView;

@end
