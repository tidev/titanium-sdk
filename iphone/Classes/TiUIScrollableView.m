/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIScrollableView.h"
#import "TiUtils.h"
#import "TiViewProxy.h"

@implementation TiUIScrollableView

#pragma mark Internal 

-(void)dealloc
{
	RELEASE_TO_NIL(views);
	RELEASE_TO_NIL(scrollview);
	RELEASE_TO_NIL(pageControl);
	[super dealloc];
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
		scrollview = [[UIScrollView alloc] initWithFrame:[self frame]];
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

-(void)refreshScrollView:(CGRect)visibleBounds readd:(BOOL)readd
{
	CGRect viewBounds;
	viewBounds.size = visibleBounds.size;
	viewBounds.origin.y = 0;
	
	UIScrollView *sv = [self scrollview];
	
	[self refreshPageControl];
	
	if (readd && [[sv subviews] count] > 0)
	{
		for (UIView *view in [sv subviews])
		{
			[view removeFromSuperview];
		}
	}
	
	for (int c=0;c<[views count];c++)
	{
		TiViewProxy *viewproxy = [views objectAtIndex:c];
		viewBounds.origin.x = c*visibleBounds.size.width;
		
		if (readd)
		{
			UIView *view = [[UIView alloc] initWithFrame:viewBounds];
			TiUIView *uiview = (TiUIView*)[viewproxy view];
			[view addSubview:uiview];
			[uiview reposition];
			[viewproxy layoutChildren:[uiview bounds]];
			[sv addSubview:view];
			[view release];
		}
		else 
		{
			UIView *view = [[sv subviews] objectAtIndex:c];
			view.frame = viewBounds;
		}
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
	if (refresh)
	{
		[self refreshScrollView:[self frame] readd:YES];
	}
	if (showPageControl)
	{
		[[self pagecontrol] setCurrentPage:0];
	}
	currentPage = 0;
	[self.proxy replaceValue:NUMINT(0) forKey:@"currentPage" notification:NO];
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

-(void)setPageControlHeight_:(id)args
{
	showPageControl=YES;
	pageControlHeight = [TiUtils floatValue:args def:20.0];
	if (pageControlHeight < 5.0)
	{
		pageControlHeight = 20.0;
	}
	[[self pagecontrol] setFrame:[self pageControlRect]];
}

-(void)setPageControlColor_:(id)args
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

	[self.proxy replaceValue:NUMINT(pageNum) forKey:@"currentPage" notification:NO];
}

-(void)addView:(id)viewproxy
{
	[views addObject:viewproxy];
	[self refreshScrollView:[self frame] readd:YES];
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
		[views removeObjectAtIndex:pageNum];
		[self refreshScrollView:[self frame] readd:YES];
	}
}

-(int)currentPage
{
	CGPoint offset = [[self scrollview] contentOffset];
	CGSize scrollFrame = [self bounds].size;
	return floor(offset.x/scrollFrame.width);
}

#pragma mark Delegate calls

-(void)pageControlTouched:(id)sender
{
	int pageNum = [(UIPageControl *)sender currentPage];
	[scrollview setContentOffset:CGPointMake([self bounds].size.width * pageNum, 0) animated:YES];
	handlingPageControlEvent = YES;
	
	currentPage = pageNum;
	
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
	currentPage=page;
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
}

@end
