/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIScrollableView.h"
#import "TiUtils.h"
#import "TiViewProxy.h"


@interface InnerScrollView : UIScrollView<UIScrollViewDelegate>
{
}
@end

@implementation InnerScrollView

- (UIView *)viewForZoomingInScrollView:(UIScrollView *)scrollView
{
	return [[self subviews] objectAtIndex:0];
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView_ withView:(UIView *)view atScale:(float)scale 
{
}

@end



@implementation TiUIScrollableView

#pragma mark Internal 

-(void)dealloc
{
	RELEASE_TO_NIL(views);
	RELEASE_TO_NIL(scrollview);
	RELEASE_TO_NIL(pageControl);
	[super dealloc];
}

-(void)initializerState
{
	maxScale = 1.0;
	minScale = 1.0;
}

-(CGRect)pageControlRect
{
	CGRect boundsRect = [self bounds];
	return CGRectMake(boundsRect.origin.x, 
					  boundsRect.origin.y + boundsRect.size.height - pageControlHeight,
					  boundsRect.size.width, 
					  pageControlHeight);
}

-(UIPageControl*)pagecontrol 
{
	if (pageControl==nil)
	{
		pageControl = [[UIPageControl alloc] initWithFrame:[self pageControlRect]];
		[pageControl setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleTopMargin];
		[pageControl addTarget:self action:@selector(pageControlTouched:) forControlEvents:UIControlEventValueChanged];
		[pageControl setBackgroundColor:[UIColor blackColor]];
		[self addSubview:pageControl];
	}
	return pageControl;
}

-(UIScrollView*)scrollview 
{
	if (scrollview==nil)
	{
		scrollview = [[UIScrollView alloc] initWithFrame:[self bounds]];
		[scrollview setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
		[scrollview setPagingEnabled:YES];
		[scrollview setDelegate:self];
		[scrollview setBackgroundColor:[UIColor clearColor]];
		[scrollview setShowsVerticalScrollIndicator:NO];
		[scrollview setShowsHorizontalScrollIndicator:NO];
		[scrollview setDelaysContentTouches:NO];
		[self addSubview:scrollview];
	}
	return scrollview;
}

-(void)refreshPageControl
{
	if (showPageControl)
	{
		UIPageControl *pg = [self pagecontrol];
		[pg setFrame:[self pageControlRect]];
		[pg setNumberOfPages:[views count]];
	}	
}

-(void)renderViewForIndex:(int)index
{
	UIScrollView *sv = [self scrollview];
	NSArray * svSubviews = [sv subviews];
	int svSubviewsCount = [svSubviews count];

	if ((index < 0) || (index >= svSubviewsCount))
	{
		return;
	}

	NSLog(@"Rendering for view %d.",index);

	UIView *wrapper = [[sv subviews] objectAtIndex:index];
	if ([[wrapper subviews] count]==0)
	{
		// we need to realize this view
		TiViewProxy *viewproxy = [views objectAtIndex:index];
		TiUIView *uiview = [viewproxy view];
		[wrapper addSubview:uiview];
		[uiview reposition];
		[viewproxy layoutChildren];
	}
}

-(void)loadNextFrames:(BOOL)forward
{
	[self renderViewForIndex:currentPage-1];
	[self renderViewForIndex:currentPage];
	[self renderViewForIndex:currentPage+1];
	

	// determine if we're going forward or reverse should determine
	// the next set of frames we'll load
	
	// the goal of this logic is to simply attempt to keep 3 frames
	// in memory at a time (attached to the view tree)
	// depending on the direction it will keep the 
	// current frame +1 and -1 available so that those are immediately
	// visible when you scroll
	
	if (forward)
	{
		for (int c=currentPage;c<MIN(currentPage+2,[views count]);c++)
		{
			[self renderViewForIndex:c];
		}
		for (int c=currentPage-3;c>=0;c--)
		{
			TiViewProxy *viewproxy = [views objectAtIndex:c];
			if ([viewproxy viewAttached])
			{
				[viewproxy detachView];
			}
		}
	}
	else 
	{
		for (int c=currentPage+2;c<MIN(currentPage+4,[views count]);c++)
		{
			TiViewProxy *viewproxy = [views objectAtIndex:c];
			if ([viewproxy viewAttached])
			{
				[viewproxy detachView];
			}
		}
		for (int c=currentPage;c>=MAX(0,currentPage-3);c--)
		{
			[self renderViewForIndex:c];
		}
	}
}

-(void)refreshScrollView:(CGRect)visibleBounds readd:(BOOL)readd
{
	CGRect viewBounds;
	viewBounds.size = visibleBounds.size;
	viewBounds.origin.y = 0;
	
	UIScrollView *sv = [self scrollview];
	
	[self refreshPageControl];
	
	if (readd)
	{
		for (UIView *view in [sv subviews])
		{
			[view removeFromSuperview];
		}
	}
	
	for (int c=0;c<[views count];c++)
	{
		viewBounds.origin.x = c*visibleBounds.size.width;
		
		if (readd)
		{
			//TODO: optimize for non-scaled?
			InnerScrollView *view = [[InnerScrollView alloc] initWithFrame:viewBounds];
			[view setMaximumZoomScale:maxScale];
			[view setMinimumZoomScale:minScale];
			[view setShowsVerticalScrollIndicator:NO];
			[view setShowsHorizontalScrollIndicator:NO];
			[view setDelegate:view];
			[view setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
			[view setPagingEnabled:NO];
			[view setBackgroundColor:[UIColor clearColor]];
			[view setDelaysContentTouches:NO];
			[sv addSubview:view];
			[view release];
		}
		else 
		{
			UIView *view = [[sv subviews] objectAtIndex:c];
			view.frame = viewBounds;
		}
	}
	
	if (currentPage==0)
	{
		[self loadNextFrames:true];
	}
	
	if (readd)
	{
		[self renderViewForIndex:currentPage];
	}
	
	CGRect contentBounds;
	contentBounds.origin.x = viewBounds.origin.x;
	contentBounds.origin.y = viewBounds.origin.y;
	contentBounds.size.width = viewBounds.size.width;
	contentBounds.size.height = viewBounds.size.height-(showPageControl ? pageControlHeight : 0);
	contentBounds.size.width *= [views count];
	
	[sv setContentSize:contentBounds.size];
	[sv setFrame:CGRectMake(0, 0, visibleBounds.size.width, visibleBounds.size.height-(showPageControl ? pageControlHeight : 0))];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)visibleBounds
{
	if (!CGRectIsEmpty(visibleBounds))
	{
		UIScrollView *sv = [self scrollview];
		BOOL readd = [sv subviews]==0 || [views count]!=[[sv subviews] count];
		[self refreshScrollView:visibleBounds readd:readd];
	}
}

#pragma mark Public APIs

-(void)setViews_:(id)args
{
	BOOL refresh = views!=nil;
	if (views!=nil)
	{
		for (TiViewProxy *proxy in views)
		{
			[[proxy view] removeFromSuperview];
		}
	}
	RELEASE_TO_NIL(views);
	views = [args retain];
//	// set the parent so we can propagate events
//	for (TiViewProxy *viewproxy in views)
//	{
//		[viewproxy setParent:self.parent];
//	}
//	if (showPageControl)
//	{
//		[[self pagecontrol] setCurrentPage:0];
//	}
//	currentPage = 0;
//	[self.proxy replaceValue:NUMINT(0) forKey:@"currentPage" notification:NO];

	if (refresh)
	{
		[self refreshScrollView:[self bounds] readd:YES];
	}
	
	for (int c=0;c<MIN(3,[views count]);c++)
	{
		[self renderViewForIndex:c];
	}
}

-(void)setShowPagingControl_:(id)args
{
	showPageControl = [TiUtils boolValue:args];
	if (pageControl!=nil)
	{
		if (showPageControl==NO)
		{
			[pageControl removeFromSuperview];
			RELEASE_TO_NIL(pageControl);
		}
	}
	else if (showPageControl)
	{
		[self pagecontrol];
	}
}

-(void)setPagingControlHeight_:(id)args
{
	showPageControl=YES;
	pageControlHeight = [TiUtils floatValue:args def:20.0];
	if (pageControlHeight < 5.0)
	{
		pageControlHeight = 20.0;
	}
	[[self pagecontrol] setFrame:[self pageControlRect]];
}

-(void)setPageControlHeight_:(id)arg
{
	// for 0.8 backwards compat, renamed all for consistency
	[self setPagingControlHeight_:arg];
}

-(void)setPagingControlColor_:(id)args
{
	[[self pagecontrol] setBackgroundColor:[[TiUtils colorValue:args] _color]];
}

-(int)pageNumFromArg:(id)args
{
	int pageNum = 0;
	
	if ([args isKindOfClass:[TiViewProxy class]])
	{
		for (int c=0;c<[views count];c++)
		{
			if (args == [views objectAtIndex:c])
			{
				pageNum = c;
				break;
			}
		}
	}
	else
	{
		pageNum = [TiUtils intValue:args];
	}
	
	return pageNum;
}

-(void)scrollToView:(id)args
{
	int pageNum = [self pageNumFromArg:args];
	
	[[self scrollview] setContentOffset:CGPointMake([self bounds].size.width * pageNum, 0) animated:YES];

	int existingPage = currentPage;
	currentPage = pageNum;
	
	if (pageNum >= existingPage)
	{
		[self loadNextFrames:true];
	}
	else
	{
		[self loadNextFrames:false];
	}
	
	[self.proxy replaceValue:NUMINT(pageNum) forKey:@"currentPage" notification:NO];
}

-(void)addView:(id)viewproxy
{
	ENSURE_SINGLE_ARG(viewproxy,TiProxy);
	[viewproxy setParent:self.parent];
	[views addObject:viewproxy];
	[self refreshScrollView:[self bounds] readd:YES];
}

-(void)removeView:(id)args
{
	int pageNum = [self pageNumFromArg:args];
	if (pageNum >=0 && pageNum < [views count])
	{
		if (currentPage==pageNum)
		{
			currentPage = [views count]-1;
			[self.proxy replaceValue:NUMINT(pageNum) forKey:@"currentPage" notification:NO];
		}
		TiViewProxy *viewproxy = [views objectAtIndex:pageNum];
		[viewproxy setParent:nil];
		[views removeObjectAtIndex:pageNum];
		[self refreshScrollView:[self bounds] readd:YES];
	}
}

-(int)currentPage
{
	CGPoint offset = [[self scrollview] contentOffset];
	CGSize scrollFrame = [self bounds].size;
	return floor(offset.x/scrollFrame.width);
}

-(void)setCurrentPage_:(id)page
{
	int newPage = [TiUtils intValue:page];
	if (newPage >=0 && newPage < [views count])
	{
		[scrollview setContentOffset:CGPointMake([self bounds].size.width * newPage, 0) animated:NO];
		int existingPage = currentPage;
		currentPage = newPage;
		pageControl.currentPage = newPage;
		
		if (newPage > existingPage)
		{
			[self loadNextFrames:true];
		}
		else
		{
			[self loadNextFrames:false];
		}
		
		[self.proxy replaceValue:NUMINT(newPage) forKey:@"currentPage" notification:NO];
	}
}

-(void)setMaxZoomScale_:(id)scale
{
	maxScale = [TiUtils floatValue:scale];
}

-(void)setMinZoomScale_:(id)scale
{
	minScale = [TiUtils floatValue:scale];
}

#pragma mark Delegate calls

-(void)pageControlTouched:(id)sender
{
	int pageNum = [(UIPageControl *)sender currentPage];
	[scrollview setContentOffset:CGPointMake([self bounds].size.width * pageNum, 0) animated:YES];
	handlingPageControlEvent = YES;
	
	int existingPage = currentPage;
	currentPage = pageNum;
	
	if (pageNum > existingPage)
	{
		[self loadNextFrames:true];
	}
	else
	{
		[self loadNextFrames:false];
	}
	
	[self.proxy replaceValue:NUMINT(pageNum) forKey:@"currentPage" notification:NO];
	
	if ([self.proxy _hasListeners:@"click"])
	{
		[self.proxy fireEvent:@"click" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
													NUMINT(pageNum),@"currentPage",
													[views objectAtIndex:pageNum],@"view",nil]]; 
	}
	
}

-(void)scrollViewDidScroll:(UIScrollView *)sender
{
	//switch page control at 50% across the center - this visually looks better
    CGFloat pageWidth = scrollview.frame.size.width;
    int page = floor((scrollview.contentOffset.x - pageWidth / 2) / pageWidth) + 1;
    pageControl.currentPage = page;
	[self loadNextFrames:YES];
}

-(void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
	// called when setContentOffset/scrollRectVisible:animated: finishes. not called if not animating
	[self scrollViewDidEndDecelerating:scrollView];
}

-(void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
	// At the end of scroll animation, reset the boolean used when scrolls originate from the UIPageControl
	int pageNum = [self currentPage];
	handlingPageControlEvent = NO;

	[self.proxy replaceValue:NUMINT(pageNum) forKey:@"currentPage" notification:NO];
	
	if ([self.proxy _hasListeners:@"scroll"])
	{
		[self.proxy fireEvent:@"scroll" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
											  NUMINT(pageNum),@"currentPage",
											  [views objectAtIndex:pageNum],@"view",nil]]; 
	}
	currentPage=pageNum;
	[pageControl setCurrentPage:pageNum];
	[self loadNextFrames:YES];
}

@end
