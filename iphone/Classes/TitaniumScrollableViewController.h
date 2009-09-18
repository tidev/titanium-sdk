/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

@interface TitaniumScrollableViewController : TitaniumContentViewController<UIScrollViewDelegate> {
	UIScrollView * pagedView;		//Is typecast version of view.
	UIPageControl * pageControl;
	NSMutableArray * contentViewControllers;
	
	BOOL isControlVisibile;
	int currentPage;

}

@end
