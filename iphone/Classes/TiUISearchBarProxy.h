/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITABLEVIEW) || defined(USE_TI_UILISTVIEW)
#ifndef USE_TI_UISEARCHBAR
#define USE_TI_UISEARCHBAR
#endif
#endif

#ifdef USE_TI_UISEARCHBAR

#import <TitaniumKit/TiViewProxy.h>

@interface TiUISearchBarProxy : TiViewProxy {
  BOOL showsCancelButton;
}

- (void)setDelegate:(id<UISearchBarDelegate>)delegate;
- (UISearchBar *)searchBar;

//	showsCancelButton is related to the JS property ShowCancel,
//	but is internal ONLY, and should NOT be used by javascript.
@property (nonatomic, readwrite, assign) BOOL showsCancelButton;

#pragma mark - Titanium Internal Use

- (void)ensureSearchBarHierarchy;
- (void)setSearchBar:(UISearchBar *)searchBar;

@end

#endif
