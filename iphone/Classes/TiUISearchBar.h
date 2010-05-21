/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW
#ifndef USE_TI_UISEARCHBAR
#define USE_TI_UISEARCHBAR
#endif
#endif

#ifdef USE_TI_UISEARCHBAR

#import "TiUIView.h"


@interface TiUISearchBar : TiUIView<UISearchBarDelegate> {
@private
	UISearchBar *searchView;
	id<UISearchBarDelegate> delegate;
}

-(void)setDelegate:(id<UISearchBarDelegate>)delegate;
-(UISearchBar*)searchBar;

@end

#endif