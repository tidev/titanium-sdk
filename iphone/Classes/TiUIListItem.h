/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TiUIListView.h"
#import "TiUIListItemProxy.h"

enum {
	TiUIListItemTemplateStyleCustom = -1
};

@interface TiUIListItem : UITableViewCell

@property (nonatomic, readonly) NSInteger templateStyle;

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier proxy:(TiUIListItemProxy *)proxy;
- (id)initWithProxy:(TiUIListItemProxy *)proxy reuseIdentifier:(NSString *)reuseIdentifier;

- (void)applyDataItem:(NSDictionary *)item;

@end
