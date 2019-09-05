/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIREFRESHCONTROL

#ifdef USE_TI_UIATTRIBUTEDSTRING
#import "TiUIAttributedStringProxy.h"
#endif
#import "TiUIRefreshControlProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIRefreshControlProxy

- (NSString *)apiName
{
  return @"Ti.UI.RefreshControl";
}

- (void)dealloc
{
  RELEASE_TO_NIL(_refreshControl);
  [super dealloc];
}

#pragma mark - Internal Use
- (UIRefreshControl *)control
{
  //Must be called on main thread
  if (_refreshControl == nil) {
    _refreshControl = [UIRefreshControl new];
    [_refreshControl addTarget:self action:@selector(refreshingDidStart) forControlEvents:UIControlEventValueChanged];
  }

  return _refreshControl;
}

- (void)refreshingDidStart
{
  if ([self _hasListeners:@"refreshstart"]) {
    [self fireEvent:@"refreshstart" withObject:nil propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}

- (void)refreshingDidEnd
{
  if ([self _hasListeners:@"refreshend"]) {
    [self fireEvent:@"refreshend" withObject:nil propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}

#pragma mark - Public APIs

- (void)setTitle:(id)value
{
#if defined(USE_TI_UIATTRIBUTEDSTRING) || defined(USE_TI_UIIOSATTRIBUTEDSTRING)
  ENSURE_SINGLE_ARG_OR_NIL(value, TiUIAttributedStringProxy);
  [self replaceValue:value forKey:@"title" notification:NO];

  TiThreadPerformOnMainThread(^{
    [[self control] setAttributedTitle:[(TiUIAttributedStringProxy *)value attributedString]];
  },
      NO);
#endif
}

- (void)setTintColor:(id)value
{
  ENSURE_SINGLE_ARG_OR_NIL(value, NSString);
  [self replaceValue:value forKey:@"tintColor" notification:NO];

  TiThreadPerformOnMainThread(^{
    [[self control] setTintColor:[[TiUtils colorValue:value] color]];
  },
      NO);
}

- (void)beginRefreshing:(id)unused
{
  TiThreadPerformOnMainThread(^{
    // For iOS < 10, the refresh-control is added as a sub-view and needs to adjust its content offset.
    if (![TiUtils isIOSVersionOrGreater:@"10.0"]) {
      [(UIScrollView *)[[self control] superview] setContentOffset:CGPointMake(0, -([[self control] frame].size.height)) animated:YES];
    }
    [[self control] beginRefreshing];
    [[self control] sendActionsForControlEvents:UIControlEventValueChanged];
  },
      NO);
}

- (void)endRefreshing:(id)unused
{
  TiThreadPerformOnMainThread(^{
    [[self control] endRefreshing];
    [self refreshingDidEnd];
  },
      NO);
}

@end
#endif
