/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiProxy.h"

@class TiUITableViewRowProxy;

@interface TiUITableViewCell : UITableViewCell<TiProxyDelegate>
{
@private
	NSMutableArray * childrenViews;
	UITableViewStyle tableStyle;
	TiUITableViewRowProxy * proxy;

}

@property(nonatomic,readwrite,retain) TiUITableViewRowProxy * proxy;
@property(nonatomic,readwrite,assign) UITableViewStyle tableStyle; //Needed for some handling of styles.

@end
