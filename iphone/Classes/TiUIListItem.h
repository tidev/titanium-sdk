/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import <UIKit/UIKit.h>
#import "TiUIListView.h"
#import "TiUIListItemProxy.h"

enum {
	TiUIListItemTemplateStyleCustom = -1
};

@interface TiUIListItem : UITableViewCell

@property (nonatomic, readonly) NSInteger templateStyle;
@property (nonatomic, readonly) TiUIListItemProxy *proxy;
@property (nonatomic, readwrite, retain) NSDictionary *dataItem;

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier proxy:(TiUIListItemProxy *)proxy;
- (id)initWithProxy:(TiUIListItemProxy *)proxy reuseIdentifier:(NSString *)reuseIdentifier;

- (BOOL)canApplyDataItem:(NSDictionary *)otherItem;
- (void)configureCellBackground;
@end

#endif
