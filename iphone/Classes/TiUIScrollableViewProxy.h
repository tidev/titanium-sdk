/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiViewProxy.h"

@interface TiUIScrollableViewProxy : TiViewProxy<UIScrollViewDelegate> {

@private
	NSMutableArray * views;
	int pageIndex;
}

#pragma mark For use with the view
@property(readwrite,nonatomic,assign)	int pageIndex;

-(int)countOfViews;
-(TiViewProxy *)objectInViewsAtIndex:(int)index;

#pragma mark Javascript-facing values
@property(readwrite,nonatomic,copy) NSArray * views;	//Normally we'd let dynamic take care of this, but we need to control the mutability.


-(void)addView:(id)args; //Arg 1: view to add.
-(void)scrollToView:(id)args; //Arg 1: Integer or view to scroll to.

@end

/*

	UIView * wrapperView; // Contains pagedView and pageControl
	UIScrollView * pagedView;
	UIPageControl * pageControl;
	
	BOOL showPagingControl;
	int pageControlHeight;
	int currentPage;
	int lastAnnouncedPage;
	NSMutableIndexSet * visiblePages;
	NSMutableArray * contentViewControllers;


*/