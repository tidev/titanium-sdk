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
#import "TitaniumViewController.h"

@implementation TitaniumScrollableViewController

#pragma mark Init and dealloc

- (id) init
{
	self = [super init];
	if (self != nil) {
		visiblePages = [[NSMutableIndexSet alloc] init];
		pageControlHeight = 20;
	}
	return self;
}


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
	[contentViewControllers autorelease];
    [super dealloc];
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	Class dictClass = [NSDictionary class];
	if(![inputState isKindOfClass:dictClass])return;
	
	NSNumber * currentPageObject = [(NSDictionary *)inputState objectForKey:@"currentPage"];
	if([currentPageObject respondsToSelector:@selector(intValue)])currentPage = [currentPageObject intValue];
	
	NSNumber * showPageControlObject = [(NSDictionary *)inputState objectForKey:@"showPagingControl"];
	if([showPageControlObject respondsToSelector:@selector(boolValue)])
	{
		showPagingControl = [showPageControlObject boolValue];
		
		NSNumber * pagingControlHeight = [(NSDictionary *)inputState objectForKey:@"pagingControlHeight"];
		if([pagingControlHeight respondsToSelector:@selector(intValue)])pageControlHeight = [pagingControlHeight intValue];
	}
	
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
		[pagedView setShowsVerticalScrollIndicator:NO];
		[pagedView setShowsHorizontalScrollIndicator:NO];
		[pagedView setDelegate:self];
		[pagedView setDelaysContentTouches:NO];
		
	}

	if(wrapperView==nil){
		wrapperView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 320, 480)];
		[wrapperView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[wrapperView addSubview:pagedView];
		
		if(pageControl){
			[[self pageControl] setFrame:CGRectMake(0, 460, 320, pageControlHeight)];
			[wrapperView addSubview:pageControl];
		}
	}
	return wrapperView;
}

#pragma mark Repeaters to subviews

#if __IPHONE_OS_VERSION_MIN_REQUIRED < 30000
typedef int UIEventSubtype;
#define UIEventSubtypeMotionShake	1
#endif

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	TitaniumContentViewController * ourVC = [self viewControllerForIndex:currentPage];
	if([ourVC respondsToSelector:@selector(motionEnded:withEvent:)]){
		[(id)ourVC motionEnded:motion withEvent:event];
	}
}

- (void)setInterfaceOrientation:(TitaniumViewControllerOrientationsAllowed)interfaceOrientation duration:(NSTimeInterval)duration;
{
	for (TitaniumContentViewController * ourVC in contentViewControllers) {
		if ([ourVC respondsToSelector:@selector(setInterfaceOrientation:duration:)]){
			[(TitaniumContentViewController<TitaniumWindowDelegate> *)ourVC setInterfaceOrientation:interfaceOrientation duration:duration];
		}
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

- (void)setFocused:(BOOL)isFocused;
{
	TitaniumContentViewController * focusedContentController = [self viewControllerForIndex:currentPage];
	if([focusedContentController respondsToSelector:@selector(setFocused:)]){
		[focusedContentController setFocused:isFocused];
	}
}


- (void)setWindowFocused:(BOOL)isFocused;
{
	for(TitaniumContentViewController * focusedContentController in contentViewControllers){
		if([focusedContentController respondsToSelector:@selector(setWindowFocused:)]){
			[focusedContentController setWindowFocused:isFocused];
		}
	}
}

- (BOOL) sendJavascript: (NSString *) inputString;
{
	BOOL result = NO;
	for(TitaniumContentViewController * thisVC in contentViewControllers){
		if([thisVC respondsToSelector:@selector(sendJavascript:)]){
			result |= [(TitaniumWebViewController *)thisVC sendJavascript:inputString];
		}
	}
	return result;
}


#pragma mark Layout
- (UIView *) loadViewForPage: (int) page size:(CGSize) pageSize animated:(BOOL) animated didPresentView: (BOOL *) didPresentView;
{
	TitaniumContentViewController * resultController = [self viewControllerForIndex:page];
	if(resultController == nil)return nil;

	UIView * result = [resultController view];
	CGRect resultFrame;
	resultFrame.size = pageSize;
	resultFrame.origin.y = 0;
	resultFrame.origin.x = pageSize.width * page;
	
	[result setFrame:resultFrame];
	
	BOOL needsPresentView = [result superview] != pagedView;
	if(needsPresentView){
		[pagedView addSubview:result];
	}
	[resultController updateLayout:animated];
	if(didPresentView!=nil)*didPresentView=needsPresentView;
	return result;
}


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
	[visiblePages removeAllIndexes];
	
	UIView * prevContentPage = [self loadViewForPage:currentPage-1 size:pageFrame.size animated:animated didPresentView:nil];
	if(prevContentPage != nil)[visiblePages addIndex:currentPage-1];

	UIView * currentContentPage = [self loadViewForPage:currentPage size:pageFrame.size animated:animated didPresentView:nil];
	if(currentContentPage != nil)[visiblePages addIndex:currentPage];

	UIView * nextContentPage = [self loadViewForPage:currentPage+1 size:pageFrame.size animated:animated didPresentView:nil];
	if(nextContentPage != nil)[visiblePages addIndex:currentPage+1];

	if(lastAnnouncedPage != currentPage){
		TitaniumContentViewController * focusedContentController = [self viewControllerForIndex:lastAnnouncedPage];
		if([focusedContentController respondsToSelector:@selector(setFocused:)]){
			[focusedContentController setFocused:NO];
		}
		focusedContentController = [self viewControllerForIndex:currentPage];
		if([focusedContentController respondsToSelector:@selector(setFocused:)]){
			[focusedContentController setFocused:YES];
		}
		lastAnnouncedPage = currentPage;
	}

	
	NSArray * pagedSubViews = [pagedView subviews];
	if([visiblePages count] < [pagedSubViews count]){
		for(UIView * thisView in pagedSubViews){
			if((thisView == prevContentPage)||(thisView == nextContentPage)||(thisView == currentContentPage))continue;
			[thisView removeFromSuperview];
		}
	}

	if(showPagingControl){
		CGRect pageControlFrame = CGRectMake(0, pageFrame.size.height-pageControlHeight, pageFrameWidth, pageControlHeight);
		TitaniumViewController * TitaniumWindow = [[TitaniumHost sharedHost] titaniumViewControllerForToken:[self titaniumWindowToken]];
		if([TitaniumWindow toolbarOverlaid]){
			CGPoint toolbarOrigin = [wrapperView convertPoint:[TitaniumWindow toolbarOrigin] fromView:nil];
			pageControlFrame.origin.y = toolbarOrigin.y - pageControlHeight;
		}
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

}

#pragma mark User interaction

- (void)scrollViewDidScroll:(UIScrollView *)sender {
	CGRect scrollFrame = [pagedView frame];
	int newScrolledPage = floor(pagedView.contentOffset.x / scrollFrame.size.width);

	if((newScrolledPage>0) && ![visiblePages containsIndex:newScrolledPage-1]){
		[self loadViewForPage:newScrolledPage-1 size:scrollFrame.size animated:YES didPresentView:nil];
		[visiblePages addIndex:newScrolledPage-1];
	}

	int maxPage = [contentViewControllers count]-1;
	if((newScrolledPage >= 0) && (newScrolledPage <= maxPage) && ![visiblePages containsIndex:newScrolledPage]){
		[self loadViewForPage:newScrolledPage size:scrollFrame.size animated:YES didPresentView:nil];
		[visiblePages addIndex:newScrolledPage];
	}

	if((newScrolledPage < maxPage) && ![visiblePages containsIndex:newScrolledPage+1]){
		[self loadViewForPage:newScrolledPage+1 size:scrollFrame.size animated:YES didPresentView:nil];
		[visiblePages addIndex:newScrolledPage+1];
	}
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView; // called when setContentOffset/scrollRectVisible:animated: finishes. not called if not animating
{
	[self scrollViewDidEndDecelerating:scrollView];
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
			"%@.doEvent('scroll',{type:'scroll',currentPage:%d,view:%@})})();",pathString,currentPage,pathString,currentPage,
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
	[newViewController setTitaniumWindowToken:[self titaniumWindowToken]];
	[self shouldUpdate];
}

- (void) setCurrentPage: (int) newPage;
{
	if(newPage==currentPage)return;
	currentPage=newPage;
	[self shouldUpdate];
}




@end
