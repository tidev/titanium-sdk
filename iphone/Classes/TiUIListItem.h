/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiSelectedCellbackgroundView.h"
#import "TiUIListItemProxy.h"
#import "TiUIListView.h"
#import <UIKit/UIKit.h>

enum {
  TiUIListItemTemplateStyleCustom = -1
};

@interface TiUIListItem : UITableViewCell {
  TiGradientLayer *gradientLayer;
  TiGradient *backgroundGradient;
  TiGradient *selectedBackgroundGradient;
}

@property (nonatomic, readonly) NSInteger templateStyle;
@property (nonatomic, readonly) TiUIListItemProxy *proxy;
@property (nonatomic, readwrite, retain) NSDictionary *dataItem;

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier proxy:(TiUIListItemProxy *)proxy;
- (id)initWithProxy:(TiUIListItemProxy *)proxy reuseIdentifier:(NSString *)reuseIdentifier;

- (BOOL)canApplyDataItem:(NSDictionary *)otherItem;
- (void)setPosition:(int)position isGrouped:(BOOL)grouped;
- (void)configureCellBackground;
- (void)ensureVisibleSelectorWithTableView:(UITableView *)tableView;
@end

#endif
