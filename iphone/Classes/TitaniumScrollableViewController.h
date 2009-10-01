/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

@interface TitaniumScrollableViewController : TitaniumContentViewController<UIScrollViewDelegate> {
	UIView * wrapperView; // Contains pagedView and pageControl
	UIScrollView * pagedView;
	UIPageControl * pageControl;
	
	BOOL showPagingControl;
	int pageControlHeight;
	int currentPage;
	int lastAnnouncedPage;
	NSMutableIndexSet * visiblePages;
	NSMutableArray * contentViewControllers;

}

- (void) shouldUpdate;
- (void) addViewController: (TitaniumContentViewController *) newViewController;
- (void) setCurrentPage: (int) newPage;

@end
