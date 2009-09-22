/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumScrollableViewController.h"
#import "TitaniumViewController.h"
#import "TweakedScrollView.h"
#import "TitaniumHost.h"

@implementation TitaniumScrollableViewController

#pragma mark Init and dealloc

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	if([pagedView superview]==nil)[self setView:nil];
	// Release any cached data, images, etc that aren't in use.
}

- (void)dealloc {
	[wrapperView release];
	[pagedView release];
	[pageControl release];
	[contentViewControllers release];
    [super dealloc];
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	Class dictClass = [NSDictionary class];
	if(![inputState isKindOfClass:dictClass])return;
	
	NSNumber * currentPageObject = [(NSDictionary *)inputState objectForKey:@"currentPage"];
	if([currentPageObject respondsToSelector:@selector(intValue)])currentPage = [currentPageObject intValue];
	
	NSNumber * showPageControlObject = [(NSDictionary *)inputState objectForKey:@"showPagingControl"];
	if([showPageControlObject respondsToSelector:@selector(boolValue)])showPagingControl = [showPageControlObject boolValue];
	
	NSArray * viewsArray = [(NSDictionary *)inputState objectForKey:@"views"];
	if([viewsArray isKindOfClass:[NSArray class]]){
		if(contentViewControllers!=nil){
			[contentViewControllers autorelease];
		}
		contentViewControllers = [[NSMutableArray alloc] initWithCapacity:[viewsArray count]];
		NSString * ourTitaniumWindowToken = [self titaniumWindowToken];
		NSString * callingToken = [[[TitaniumHost sharedHost] currentThread] magicToken];
		for(NSDictionary * thisViewObject in viewsArray){
			TitaniumContentViewController * ourNewVC = [TitaniumContentViewController viewControllerForState:thisViewObject relativeToUrl:baseUrl];
			if(ourNewVC != nil){
				[ourNewVC setTitaniumWindowToken:ourTitaniumWindowToken];
				[ourNewVC addListeningWebContextToken:callingToken];
				[contentViewControllers addObject:ourNewVC];
			}
		}
	}
}

#pragma mark Utility functions

- (TitaniumContentViewController *)viewControllerForIndex:(int) index;
{
	if((index<0) || (index>=[contentViewControllers count]))return nil;
	return [contentViewControllers objectAtIndex:index];
}

#pragma mark Accessors

- (void) setView:(UIView *) newView;
{
	if(newView==nil){
		[wrapperView release];
		wrapperView = nil;
		[pagedView release];
		pagedView = nil;
		[pageControl release];
		pageControl = nil;
	}
}

- (UIPageControl *) pageControl;
{
	if(pageControl==nil){
		pageControl = [[UIPageControl alloc] init];
		[pageControl setAutoresizingMask:UIViewAutoresizingFlexibleTopMargin|UIViewAutoresizingFlexibleWidth];
		[pageControl setBackgroundColor:[UIColor colorWithWhite:0 alpha:0.5]]; //TODO: Settable, er, settings?
		[pageControl setHidesForSinglePage:YES];
		[pageControl addTarget:self action:@selector(changePage:) forControlEvents:UIControlEventValueChanged];
	}
	return pageControl;
}

- (UIView *) view;
{
	if(pagedView==nil){
		pagedView = [[TweakedScrollView alloc] initWithFrame:CGRectMake(0, 0, 320, 480)];
		[pagedView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[pagedView setPagingEnabled:YES];
		[pagedView setOpaque:NO];
		[pagedView setBackgroundColor:[UIColor clearColor]];
		[pagedView setDelegate:self];
		[pagedView setDelaysContentTouches:NO];
	}

	if(wrapperView==nil){
		wrapperView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 320, 480)];
		[wrapperView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[wrapperView addSubview:pagedView];
		
		if(pageControl){
			[[self pageControl] setFrame:CGRectMake(0, 460, 320, 20)];
			[wrapperView addSubview:pageControl];
		}
	}
	return wrapperView;
}

#pragma mark Repeaters to subviews

#ifndef __IPHONE_3_0
typedef int UIEventSubtype;
const UIEventSubtype UIEventSubtypeMotionShake=1;
#endif

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	TitaniumContentViewController * ourVC = [self viewControllerForIndex:currentPage];
	if([ourVC respondsToSelector:@selector(motionEnded:withEvent:)]){
		[(id)ourVC motionEnded:motion withEvent:event];
	}
}

- (BOOL) isShowingView: (TitaniumContentViewController *) contentView;
{
	if(self==contentView)return YES;
	if(contentView==nil) return NO;
	return([self viewControllerForIndex:currentPage]==contentView);
}

- (void) setTitaniumWindowToken: (NSString *) newToken;
{
	[super setTitaniumWindowToken:newToken];
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		[thisVC setTitaniumWindowToken:newToken];
	}
}

#pragma mark Layout

- (void)updateLayout: (BOOL)animated;
{ //No need to deal with views that aren't onscreen.
	CGRect pageFrame = [pagedView frame];
	CGFloat pageFrameWidth = pageFrame.size.width;
	CGFloat currentPagePosition = currentPage*pageFrameWidth;
	
	CGSize contentSize = CGSizeMake([contentViewControllers count]*pageFrameWidth,pageFrame.size.height);
	[pagedView setContentSize:contentSize];
	
	CGPoint offsetPoint = [pagedView contentOffset];
	if((offsetPoint.x != currentPagePosition) && ![pagedView isTracking] &&
			![pagedView isDragging] && ![pagedView isDecelerating]){
		[pagedView setContentOffset:CGPointMake(currentPagePosition, 0) animated:animated];
	}
	
	pageFrame.origin.y=0;
	int visibleViews = 0;
	
	TitaniumContentViewController * prevController = [self viewControllerForIndex:currentPage-1];
	UIView * prevContentPage;
	if(prevController != nil){
		prevContentPage = [prevController view];
		pageFrame.origin.x = currentPagePosition-pageFrameWidth;
		[prevContentPage setFrame:pageFrame];
		if([prevContentPage superview] != pagedView){
			[pagedView addSubview:prevContentPage];
		}
		visibleViews++;
	}else{
		prevContentPage = nil;
	}

	TitaniumContentViewController * currentController = [self viewControllerForIndex:currentPage];
	UIView * currentContentPage;
	if(currentController != nil){
		currentContentPage = [currentController view];
		pageFrame.origin.x = currentPagePosition;
		[currentContentPage setFrame:pageFrame];
		if([currentContentPage superview] != pagedView){
			[pagedView addSubview:currentContentPage];
		}
		visibleViews++;
	}else{
		currentContentPage = nil;
	}

	TitaniumContentViewController * nextController = [self viewControllerForIndex:currentPage+1];
	UIView * nextContentPage;
	if(nextController != nil){
		nextContentPage = [nextController view];
		pageFrame.origin.x = currentPagePosition+pageFrameWidth;
		[nextContentPage setFrame:pageFrame];
		if([nextContentPage superview] != pagedView){
			[pagedView addSubview:nextContentPage];
		}
		visibleViews++;
	}else{
		nextContentPage = nil;
	}
	
	NSArray * pagedSubViews = [pagedView subviews];
	if(visibleViews < [pagedSubViews count]){
		for(UIView * thisView in pagedSubViews){
			if((thisView == prevContentPage)||(thisView == nextContentPage)||(thisView == currentContentPage))continue;
			[thisView removeFromSuperview];
		}
	}

	if(showPagingControl){
		CGRect pageControlFrame = CGRectMake(0, pageFrame.size.height-20, pageFrameWidth, 20);
		if(pageControl == nil){
				[[self pageControl] setNumberOfPages:[contentViewControllers count]];
				[pageControl setFrame:pageControlFrame];
				[wrapperView addSubview:pageControl];
		} else {
			[pageControl setFrame:pageControlFrame];
		}
		if(currentPage != [pageControl currentPage]){
			[pageControl setCurrentPage:currentPage];
		}
	} else if(!pageControl && (pageControl != nil)) {
		[pageControl removeFromSuperview];
		[pageControl release];
		pageControl = nil;
	}


	[prevController updateLayout:animated];
	[currentController updateLayout:animated];
	[nextController updateLayout:animated];
}

#pragma mark User interaction

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
	CGPoint offset = [scrollView contentOffset];
	CGSize scrollFrame = [scrollView frame].size;
	CGFloat newPage=offset.x/scrollFrame.width;
	currentPage = floor(newPage);
	
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	NSString * pathString = [self javaScriptPath];
	NSString * commandString = [NSString stringWithFormat:@"(function(){%@.currentPage=%d;"
			"%@.doEvent({type:'scroll',currentPage:%d,view:%@})})();",pathString,currentPage,pathString,currentPage,
			[[contentViewControllers objectAtIndex:currentPage] javaScriptPath]];

	[theHost sendJavascript:commandString toPagesWithTokens:listeningWebContextTokens update:YES];

	[self shouldUpdate];
//	[theHost sendJavascript:[callbackProxyPath stringByAppendingString:triggeredCode] toPageWithToken:callbackWindowToken];

	//    pageControlUsed = NO;
}

- (IBAction)changePage:(id)sender {
	int newPage = [sender currentPage];
	if (newPage == currentPage) return;
	currentPage = newPage;
	[self shouldUpdate];
}

#pragma mark Javascript entry points

- (void) shouldUpdate;
{
	TitaniumContentViewController * currentVC = [[TitaniumHost sharedHost] visibleTitaniumContentViewController];
	if(![currentVC isShowingView:self])return;
	if([NSThread isMainThread]){
		[self updateLayout:YES];
	} else {
		[self performSelectorOnMainThread:@selector(updateLayout:) withObject:nil waitUntilDone:NO];
	}	
}

- (void) addViewController: (TitaniumContentViewController *) newViewController;
{
	if(newViewController==nil)return;
	
	[contentViewControllers addObject:newViewController];
	[self shouldUpdate];
}

- (void) setCurrentPage: (int) newPage;
{
	if(newPage==currentPage)return;
	currentPage=newPage;
	[self shouldUpdate];
}




// BUG BARRIER---------------------------------------------

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




@end
