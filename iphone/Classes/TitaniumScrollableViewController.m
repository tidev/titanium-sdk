/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumScrollableViewController.h"
#import "TitaniumViewController.h"

@implementation TitaniumScrollableViewController

// Implement loadView to create a view hierarchy programmatically, without using a nib.
- (void)loadView {
	
}

- (UIView *) view;
{
	return pagedView;
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}

- (void)dealloc {
    [super dealloc];
}

#ifndef __IPHONE_3_0
typedef int UIEventSubtype;
const UIEventSubtype UIEventSubtypeMotionShake=1;
#endif

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	TitaniumContentViewController * ourVC = [contentViewControllers objectAtIndex:currentPage];
	if([ourVC respondsToSelector:@selector(motionEnded:withEvent:)]){
		[(id)ourVC motionEnded:motion withEvent:event];
	}
}

- (BOOL) isShowingView: (TitaniumContentViewController *) contentView;
{
	if(self==contentView)return YES;
	return([contentViewControllers objectAtIndex:currentPage]==contentView);
}



- (void) setPagedViewControllerProxies: (NSArray *) newPagedViewControllerProxies;
{
	Class dictClass = [NSDictionary class];
	Class stringClass = [NSString class];
	int controllerCount = 0;
	
	if(contentViewControllers != nil){
		[contentViewControllers removeAllObjects];
	}
	
	for(NSDictionary * thisProxyObject in newPagedViewControllerProxies){
		if(![thisProxyObject isKindOfClass:dictClass])continue;
		NSString * thisProxyToken = [thisProxyObject objectForKey:@"_TOKEN"];
		if(![thisProxyToken isKindOfClass:stringClass])continue;
		TitaniumContentViewController * ourVC = nil;
//		for(TitaniumContentViewController * thisVC in contentViewControllers){
//			if([thisVC hasToken:thisProxyToken]){
//				ourVC = thisVC;
//				break;
//			}
//		}
		if(ourVC == nil)continue;
		
		if(contentViewControllers==nil){
			contentViewControllers = [[NSMutableArray alloc] initWithObjects:ourVC,nil];
		} else {
			[contentViewControllers addObject:ourVC];
		}
		controllerCount++;
	}
	
	if(controllerCount==0){
		[pagedView release];
		pagedView = nil;
		[pageControl release];
		pageControl = nil;
		[contentViewControllers release];
		contentViewControllers = nil;
		[self needsUpdate:TitaniumViewControllerNeedsRefresh];
		return;
	}
	
	
	if(pageControl == nil){
		pageControl = [[UIPageControl alloc] initWithFrame:CGRectZero];
		[pageControl addTarget:self action:@selector(changePage:) forControlEvents:UIControlEventValueChanged];
		
	}
	[pageControl setNumberOfPages:controllerCount];
	
	if(pagedView == nil){
		pagedView = [[UIScrollView alloc] initWithFrame:CGRectMake(0, 0, 320, 480)];
		[pagedView setDelegate:self];
		[pagedView setPagingEnabled:YES];
		[pagedView setDelaysContentTouches:NO];
	}
	
	[self needsUpdate:TitaniumViewControllerNeedsRefresh];
}

- (void)prepareViewAtPage:(int) pageNum;
{
	if((pageNum < 0) || (pageNum >= [contentViewControllers count]))return;
	
	TitaniumContentViewController * thisPageViewController = [contentViewControllers objectAtIndex:pageNum];
	UIView * thisPageView = [thisPageViewController view];
	if ([thisPageView superview] != pagedView){
		CGRect thisFrame = [thisPageView frame];
		CGRect pagedFrame = [pagedView frame];
		thisFrame.origin.y=0;
		thisFrame.origin.x=pageNum * pagedFrame.size.width;
		thisFrame.size=pagedFrame.size;
		[pagedView addSubview:thisPageView];
	}
}


- (void)scrollViewDidScroll:(UIScrollView *)sender {
	//    // We don't want a "feedback loop" between the UIPageControl and the scroll delegate in
	//    // which a scroll event generated from the user hitting the page control triggers updates from
	//    // the delegate method. We use a boolean to disable the delegate logic when the page control is used.
	//    if (pageControlUsed) {
	//        // do nothing - the scroll was initiated from the page control, not the user dragging
	//        return;
	//    }
	//    // Switch the indicator when more than 50% of the previous/next page is visible
	//    CGFloat pageWidth = scrollView.frame.size.width;
	//    int page = floor((scrollView.contentOffset.x - pageWidth / 2) / pageWidth) + 1;
	//    pageControl.currentPage = page;
	//	
	//    // load the visible page and the page on either side of it (to avoid flashes when the user starts scrolling)
	//    [self loadScrollViewWithPage:page - 1];
	//    [self loadScrollViewWithPage:page];
	//    [self loadScrollViewWithPage:page + 1];
	//	
	//    // A possible optimization would be to unload the views+controllers which are no longer visible
}

// At the end of scroll animation, reset the boolean used when scrolls originate from the UIPageControl
- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView {
	//    pageControlUsed = NO;
}

- (IBAction)changePage:(id)sender {
	//    int page = pageControl.currentPage;
	//    // load the visible page and the page on either side of it (to avoid flashes when the user starts scrolling)
	//    [self loadScrollViewWithPage:page - 1];
	//    [self loadScrollViewWithPage:page];
	//    [self loadScrollViewWithPage:page + 1];
	//    // update the scroll view to the appropriate page
	//    CGRect frame = scrollView.frame;
	//    frame.origin.x = frame.size.width * page;
	//    frame.origin.y = 0;
	//    [scrollView scrollRectToVisible:frame animated:YES];
	//    // Set the boolean used when scrolls originate from the UIPageControl. See scrollViewDidScroll: above.
	//    pageControlUsed = YES;
}


@end
