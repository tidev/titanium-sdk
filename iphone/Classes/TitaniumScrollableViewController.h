//
//  TitaniumScrollableViewController.h
//  Titanium
//
//  Created by Blain Hamon on 9/14/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

@interface TitaniumScrollableViewController : TitaniumContentViewController<UIScrollViewDelegate> {
	UIScrollView * pagedView;
	UIPageControl * pageControl;
	NSMutableArray * pagedViewControllers;	//Should be a subset of contentViewControllers
}

@end
