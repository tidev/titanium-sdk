/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIScrollableView.h"

#import "TiUIScrollableViewProxy.h"

#import "TiUtils.h"

@implementation TiUIScrollableView

-(void)removePageControl
{
	if (pageControl == nil)
	{
		return;
	}
	[pageControl removeFromSuperview];
	[pageControl removeTarget:self action:@selector(pageControlTouched:) forControlEvents:UIControlEventValueChanged];
	RELEASE_TO_NIL(pageControl);
}

-(void)updatePageControl
{
	if (pageControl == nil)
	{
		return;
	}

	TiUIScrollableViewProxy * ourProxy = (TiUIScrollableViewProxy *)[self proxy];
	int pageCount = [ourProxy countOfViews];
	int currentPage = [ourProxy pageIndex];

	[pageControl setNumberOfPages:pageCount];
//	[pageControl setCurrentPage:currentPage];
}

-(void)preloadPages:(int)currentPageIndex;
{
	if (loadedViews == nil)
	{
		loadedViews = [[NSMutableIndexSet alloc] init];
	}

	TiUIScrollableViewProxy * ourProxy = (TiUIScrollableViewProxy *)[self proxy];

	CGRect visibleBounds = [self bounds];
	CGRect viewBounds;
	viewBounds.size = visibleBounds.size;
	viewBounds.origin.y = 0;
	
	for (int thisPageIndex = currentPageIndex-1; thisPageIndex<=currentPageIndex+1; thisPageIndex++)
	{
		if ([loadedViews containsIndex:thisPageIndex])
		{
			continue;
		}
	
		TiViewProxy * thisPageProxy = [ourProxy objectInViewsAtIndex:thisPageIndex];
		if (thisPageProxy == nil)
		{
			continue;
		}
		
		viewBounds.origin.x = thisPageIndex*visibleBounds.size.width;
		UIView * thisPageWrapper = [[UIView alloc] initWithFrame:viewBounds];
		TiUIView * thisPageView = [thisPageProxy view];
		[thisPageWrapper addSubview:thisPageView];
		[thisPageView reposition];

		[scrollingView addSubview:thisPageWrapper];
		
		[thisPageWrapper release];
		[loadedViews addIndex:thisPageIndex];
	}
}

-(void)resetSubViews
{
	for (UIView * thisView in [scrollingView subviews])
	{
		[thisView removeFromSuperview];
	}
	RELEASE_TO_NIL(loadedViews);

	TiUIScrollableViewProxy * ourProxy = (TiUIScrollableViewProxy *)[self proxy];
	int pageCount = [ourProxy countOfViews];
	int currentPage = [ourProxy pageIndex];

	CGRect contentBounds = [self bounds];
	
	contentBounds.origin.y += contentBounds.size.width * currentPage;
	contentBounds.size.width *= pageCount;
	[scrollingView setContentSize:contentBounds.size];
	[scrollingView setContentOffset:contentBounds.origin];

	[self preloadPages:[ourProxy pageIndex]];
}

-(void)setBounds:(CGRect)bounds
{
	[super setBounds:bounds];
	[self resetSubViews];
}

-(void)layoutSubviews;
{
	[super layoutSubviews];
	if (scrollingView == nil)
	{
		scrollingView = [[UIScrollView alloc] initWithFrame:[self bounds]];
		[scrollingView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
		[scrollingView setPagingEnabled:YES];
		[scrollingView setDelegate:self];
		[scrollingView setBackgroundColor:[UIColor clearColor]];
		[scrollingView setShowsVerticalScrollIndicator:NO];
		[scrollingView setShowsHorizontalScrollIndicator:NO];
		[scrollingView setDelaysContentTouches:NO];
		[self addSubview:scrollingView];
		[self resetSubViews];
	}
	
	if (!showPageControl)
	{	// Remove the paging control if it exists.
		[self removePageControl];
	}
	else
	{
		if (pageControl == nil)
		{
			CGRect boundsRect = [self bounds];
			CGRect pageRect;
			pageRect = CGRectMake(boundsRect.origin.x,
					boundsRect.origin.y + boundsRect.size.height - pageControlHeight,
					boundsRect.size.width, pageControlHeight);
			pageControl = [[UIPageControl alloc] initWithFrame:pageRect];
			[pageControl setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleTopMargin];
			[pageControl addTarget:self action:@selector(pageControlTouched:) forControlEvents:UIControlEventValueChanged];
			[self addSubview:pageControl];
		}
		[self updatePageControl];
	}
}

-(void)scrollToPage:(int)pageNum
{
	[scrollingView setContentOffset:CGPointMake([self bounds].size.width * pageNum, 0) animated:YES];
}

#pragma mark From Proxy

-(void)scrollToPageNumber:(NSNumber *)newPageNum
{
	ENSURE_UI_THREAD_1_ARG(newPageNum);
	[self scrollToPage:[TiUtils intValue:newPageNum]];
}

-(void)setShowPagingControl_:(id)value
{
	showPageControl = [TiUtils boolValue:value];
	if (pageControlHeight < 5.0)
	{
		pageControlHeight = 20.0;
	}
	[self setNeedsLayout];
}

-(void)setPagingControlHeight_:(id)value
{
	pageControlHeight = [TiUtils floatValue:value def:20.0];
	[self removePageControl];	//Just for ease of coding, we'll wipe and re-make it.
	[self setNeedsLayout];
}


#pragma mark Delegate calls

- (IBAction)pageControlTouched:(id)sender
{
	[self scrollToPage:[(UIPageControl *)sender currentPage]];
	handlingPageControlEvent = YES;
}

- (void)scrollViewDidScroll:(UIScrollView *)sender
{
	CGPoint offset = [sender contentOffset];
	CGSize scrollFrame = [self bounds].size;
	int tempPageIndex=floor(offset.x/scrollFrame.width);
	[self preloadPages:tempPageIndex];
}


- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
// called when setContentOffset/scrollRectVisible:animated: finishes. not called if not animating
{
	[self scrollViewDidEndDecelerating:scrollView];
}

// At the end of scroll animation, reset the boolean used when scrolls originate from the UIPageControl
- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
	CGPoint offset = [scrollView contentOffset];
	CGSize scrollFrame = [self bounds].size;
	int newPageIndex=floor(offset.x/scrollFrame.width);
	handlingPageControlEvent = NO;

	[(TiUIScrollableViewProxy *)[self proxy] fireScrollEvent:newPageIndex];
	[pageControl setCurrentPage:newPageIndex];

}

@end
