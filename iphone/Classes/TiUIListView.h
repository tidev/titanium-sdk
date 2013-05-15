/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIView.h"
#import "TiUIListViewProxy.h"

@interface TiUIListView : TiUIView <UITableViewDelegate, UITableViewDataSource, UIGestureRecognizerDelegate, TiScrolling, TiProxyObserver >

#pragma mark - Private APIs

@property (nonatomic, readonly) UITableView *tableView;

- (void)setTemplates_:(id)args;
- (void)setContentInsets_:(id)value withObject:(id)props;
- (void)deselectAll:(BOOL)animated;

+ (UITableViewRowAnimation)animationStyleForProperties:(NSDictionary*)properties;

@end

#endif
