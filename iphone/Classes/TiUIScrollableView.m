	/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLABLEVIEW

#import "TiUIScrollableView.h"
#import "TiUIScrollableViewProxy.h"
#import "TiUtils.h"
#import "TiViewProxy.h"

@interface TiUIScrollableView(redefiningProxy)
@property(nonatomic,readonly)	TiUIScrollableViewProxy * proxy;
@end

@implementation TiUIScrollableView

#pragma mark Internal 

-(void)dealloc
{
	RELEASE_TO_NIL(scrollview);
	RELEASE_TO_NIL(pageControl);
    RELEASE_TO_NIL(pageControlBackgroundColor);
	[super dealloc];
}

-(id)init
{
	if (self = [super init]) {
        cacheSize = 3;
        pageControlHeight=20;
        pageControlBackgroundColor = [[UIColor blackColor] retain];
        pagingControlOnTop = NO;
        overlayEnabled = NO;
        pagingControlAlpha = 1.0;
        showPageControl = YES;
	}
	return self;
}

-(void)initializerState
{
}

-(CGRect)pageControlRect
{
	
    if (!pagingControlOnTop) {
        CGRect boundsRect = [self bounds];
        return CGRectMake(boundsRect.origin.x, 
                          boundsRect.origin.y + boundsRect.size.height - pageControlHeight,
                          boundsRect.size.width, 
                          pageControlHeight);
    }
    else {
        CGRect boundsRect = [self bounds];
        CGRect finalRect = CGRectMake(0,0,
                          boundsRect.size.width, 
                          pageControlHeight);
        return finalRect;
    }
    
}

-(UIPageControl*)pagecontrol 
{
	if (pageControl==nil)
	{
		pageControl = [[UIPageControl alloc] initWithFrame:[self pageControlRect]];
		[pageControl setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleTopMargin];
		[pageControl addTarget:self action:@selector(pageControlTouched:) forControlEvents:UIControlEventValueChanged];
		[pageControl setBackgroundColor:pageControlBackgroundColor];
		[self addSubview:pageControl];
	}
	return pageControl;
}


- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event 
{
    id value = [self.proxy valueForKey:@"hitRect"];

    if (value != nil) 
    {
        CGRect hitRect = [TiUtils rectValue:value];
        // As long as we're inside of hitRect..
        if (CGRectContainsPoint(hitRect, point))
        {
            UIView * test = [super hitTest:point withEvent:event];

            // If it misses super's hitTest then it's outside of the
            // scrollview.  Just return scrollview; at least the scrolling
            // events can be processed, though no touches will go through
            // to the view inside of scrollview. otherwise just return 
            // whatever super got.

            return test == nil ? scrollview : test;
        }
        else
        {
            return nil;
        }
    }
    else 
    {
        return [super hitTest:point withEvent:event];
    }
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
		[scrollview setScrollsToTop:NO];
		BOOL clipsToBounds = [TiUtils boolValue:[self.proxy valueForKey:@"clipViews"] def:YES];
		[scrollview setClipsToBounds:clipsToBounds];
		[self insertSubview:scrollview atIndex:0];
        
        //Update clips to bounds only if cornerRadius and backgroundImage are not set
        if ( (self.layer.cornerRadius == 0) && (self.backgroundImage == nil) ) {
            [self setClipsToBounds:clipsToBounds];
        }
	}
	return scrollview;
}

-(void)refreshPageControl
{
	if (showPageControl)
	{
		UIPageControl *pg = [self pagecontrol];
		[pg setFrame:[self pageControlRect]];
        [pg setNumberOfPages:[[self proxy] viewCount]];
        [pg setBackgroundColor:pageControlBackgroundColor];
		pg.currentPage = currentPage;
        pg.alpha = pagingControlAlpha;
        pg.backgroundColor = pageControlBackgroundColor;
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

	UIView *wrapper = [svSubviews objectAtIndex:index];
	TiViewProxy *viewproxy = [[self proxy] viewAtIndex:index];
	if ([[wrapper subviews] count]==0)
	{
		// we need to realize this view
		[viewproxy windowWillOpen];
		TiUIView *uiview = [viewproxy view];
		[wrapper addSubview:uiview];
		[viewproxy reposition];
	}
	[viewproxy parentWillShow];
}

-(NSRange)cachedFrames:(int)page
{
    int startPage;
    int endPage;
	int viewsCount = [[self proxy] viewCount];
    
    // Step 1: Check to see if we're actually smaller than the cache range:
    if (cacheSize >= viewsCount) {
        startPage = 0;
        endPage = viewsCount - 1;
    }
    else {
		startPage = (page - (cacheSize - 1) / 2);
		endPage = (page + (cacheSize - 1) / 2);
		
        // Step 2: Check to see if we're rendering outside the bounds of the array, and if so, adjust accordingly.
        if (startPage < 0) {
            endPage -= startPage;
            startPage = 0;
        }
        if (endPage >= viewsCount) {
            int diffPage = endPage - viewsCount;
            endPage = viewsCount -  1;
            startPage += diffPage;
        }
		if (startPage > endPage) {
			startPage = endPage;
		}
    }
    
	return NSMakeRange(startPage, endPage - startPage + 1);
}

-(void)manageCache:(int)page
{
    if ([(TiUIScrollableViewProxy *)[self proxy] viewCount] == 0) {
        return;
    }
    
    NSRange renderRange = [self cachedFrames:page];
	int viewsCount = [[self proxy] viewCount];

    for (int i=0; i < viewsCount; i++) {
        TiViewProxy* viewProxy = [[self proxy] viewAtIndex:i];
        if (i >= renderRange.location && i < NSMaxRange(renderRange)) {
            [self renderViewForIndex:i];
        }
        else if ([viewProxy viewAttached]) {
            [viewProxy detachView];
        }
    }
}

-(void)listenerAdded:(NSString*)event count:(int)count
{
	[super listenerAdded:event count:count];
	[[self proxy] lockViews];
	for (TiViewProxy* viewProxy in [[self proxy] viewProxies]) {
		if ([viewProxy viewAttached]) {
			[[viewProxy view] updateTouchHandling];
		}
	}
	[[self proxy] unlockViews];
}

-(int)currentPage
{
	int result = currentPage;
    if (scrollview != nil) {
        CGPoint offset = [[self scrollview] contentOffset];
        if (offset.x > 0) {
            CGSize scrollFrame = [self bounds].size;
            if (scrollFrame.width != 0) {
                result = floor(offset.x/scrollFrame.width);
            }
		}
    }
	[pageControl setCurrentPage:result];
    return result;
}

-(void)refreshScrollView:(CGRect)visibleBounds readd:(BOOL)readd
{
	CGRect viewBounds;
	viewBounds.size.width = visibleBounds.size.width;
	viewBounds.size.height = visibleBounds.size.height - (showPageControl ? pageControlHeight : 0);
    if(overlayEnabled && showPageControl ) {
        viewBounds.size.height = visibleBounds.size.height;
        viewBounds.origin = CGPointMake(0, 0);
    }
    else {
        viewBounds.size.height = visibleBounds.size.height - (showPageControl ? pageControlHeight : 0);
        if(!pagingControlOnTop){
            viewBounds.origin = CGPointMake(0, 0);
        }
        else {
            viewBounds.origin = CGPointMake(0, pageControlHeight);
        }
    }
	UIScrollView *sv = [self scrollview];
	
    int page = [self currentPage];
    
	[self refreshPageControl];
	
	if (readd)
	{
		for (UIView *view in [sv subviews])
		{
			[view removeFromSuperview];
		}
	}
	
	int viewsCount = [[self proxy] viewCount];
	/*
	Reset readd here since refreshScrollView is called from
	frameSizeChanged with readd false and the views might 
	not yet have been added on first launch
	*/
	readd = ([[sv subviews] count] == 0);
	
	for (int c=0;c<viewsCount;c++)
	{
		viewBounds.origin.x = c*visibleBounds.size.width;
		
		if (readd)
		{
			UIView *view = [[UIView alloc] initWithFrame:viewBounds];
			[sv addSubview:view];
			[view release];
		}
		else 
		{
			UIView *view = [[sv subviews] objectAtIndex:c];
			view.frame = viewBounds;
		}
	}
    
	if (page==0 || readd)
	{
        [self manageCache:page];
	}
	
	CGRect contentBounds;
	contentBounds.origin.x = viewBounds.origin.x;
	contentBounds.origin.y = viewBounds.origin.y;
	contentBounds.size.width = viewBounds.size.width;
	contentBounds.size.height = viewBounds.size.height-(showPageControl ? pageControlHeight : 0);
	contentBounds.size.width *= viewsCount;
	
	[sv setContentSize:contentBounds.size];
	[sv setFrame:CGRectMake(0, 0, visibleBounds.size.width, visibleBounds.size.height)];
}

// We have to cache the current page because we need to scroll to the new (logical) position of the view
// within the scrollable view.  Doing so, if we're resizing to a SMALLER frame, causes a content offset
// reset internally, which screws with the currentPage number (since -[self scrollViewDidScroll:] is called).
// Looks a little ugly, though...
-(void)setFrame:(CGRect)frame_
{
    lastPage = [self currentPage];
    enforceCacheRecalculation = YES;
    [super setFrame:frame_];
    [self setCurrentPage_:[NSNumber numberWithInt:lastPage]];
    enforceCacheRecalculation = NO;
}

-(void)setBounds:(CGRect)bounds_
{
    lastPage = [self currentPage];
    [super setBounds:bounds_];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)visibleBounds
{
	if (!CGRectIsEmpty(visibleBounds))
	{
		[self refreshScrollView:visibleBounds readd:NO];
		[scrollview setContentOffset:CGPointMake(lastPage*visibleBounds.size.width,0)];
        [self manageCache:[self currentPage]];
	}
    //To make sure all subviews are properly resized.
    UIScrollView *sv = [self scrollview];
    for(UIView *view in [sv subviews]){
        for (TiUIView *sView in [view subviews]) {
                [sView checkBounds];
        }
    }
    
    [super frameSizeChanged:frame bounds:visibleBounds];
}

#pragma mark Public APIs

-(void)setCacheSize_:(id)args
{
    ENSURE_SINGLE_ARG(args, NSNumber);
    int newCacheSize = [args intValue];
    if (newCacheSize < 3) {
        // WHAT.  Let's make it something sensible.
        newCacheSize = 3;
    }
    if (newCacheSize % 2 == 0) {
        DebugLog(@"[WARN] Even scrollable cache size %d; setting to %d", newCacheSize, newCacheSize-1);
        newCacheSize -= 1;
    }
    cacheSize = newCacheSize;
    [self manageCache:[self currentPage]];
}

-(void)setViews_:(id)args
{
	if ((scrollview!=nil) && ([scrollview subviews]>0))
	{
		[self refreshScrollView:[self bounds] readd:YES];
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
	
    if ((scrollview!=nil) && ([[scrollview subviews] count]>0)) {
        //No need to readd. Just set up the correct frame bounds
        [self refreshScrollView:[self bounds] readd:NO];
    }
	
}

-(void)setPagingControlHeight_:(id)args
{
	pageControlHeight = [TiUtils floatValue:args def:20.0];
	if (pageControlHeight < 5.0)
	{
		pageControlHeight = 20.0;
	}
    
    if (showPageControl && (scrollview!=nil) && ([[scrollview subviews] count]>0)) {
        //No need to readd. Just set up the correct frame bounds
        [self refreshScrollView:[self bounds] readd:NO];
    }
}

-(void)setPageControlHeight_:(id)arg
{
	// for 0.8 backwards compat, renamed all for consistency
     DEPRECATED_REPLACED(@"ScrollableView.PageControlHeight()", @"2.1.0", @"Ti.ScrollableView.PagingControlHeight()");
	[self setPagingControlHeight_:arg];
}

-(void)setPagingControlColor_:(id)args
{
    TiColor* val = [TiUtils colorValue:args];
    if (val != nil) {
        RELEASE_TO_NIL(pageControlBackgroundColor);
        pageControlBackgroundColor = [[val _color] retain];
        if (showPageControl && (scrollview!=nil) && ([[scrollview subviews] count]>0)) {
            [[self pagecontrol] setBackgroundColor:pageControlBackgroundColor];
        }
    }
}
-(void)setPagingControlAlpha_:(id)args
{
    pagingControlAlpha = [TiUtils floatValue:args def:1.0];
    if(pagingControlAlpha > 1.0){
        pagingControlAlpha = 1;
    }    
    if(pagingControlAlpha < 0.0 ){
        pagingControlAlpha = 0;
    }
    if (showPageControl && (scrollview!=nil) && ([[scrollview subviews] count] > 0)) {
        [[self pagecontrol] setAlpha:pagingControlAlpha];
    }
    
}
-(void)setPagingControlOnTop_:(id)args
{
    pagingControlOnTop = [TiUtils boolValue:args def:NO];
    if (showPageControl && (scrollview!=nil) && ([[scrollview subviews] count] > 0)) {
        //No need to readd. Just set up the correct frame bounds
        [self refreshScrollView:[self bounds] readd:NO];
    }
}

-(void)setOverlayEnabled_:(id)args
{
    overlayEnabled = [TiUtils boolValue:args def:NO];
    if (showPageControl && (scrollview!=nil) && ([[scrollview subviews] count] > 0)) {
        //No need to readd. Just set up the correct frame bounds
        [self refreshScrollView:[self bounds] readd:NO];
    }
}

-(int)pageNumFromArg:(id)args
{
	int pageNum = 0;
	if ([args isKindOfClass:[TiViewProxy class]])
	{
		[[self proxy] lockViews];
		pageNum = [[[self proxy] viewProxies] indexOfObject:args];
		[[self proxy] unlockViews];
	}
	else
	{
		pageNum = [TiUtils intValue:args];
	}
	
	return pageNum;
}

-(void)scrollToView:(id)args
{
    id data = nil;
    NSNumber* anim = nil;
    BOOL animated = YES;
    ENSURE_ARG_AT_INDEX(data, args, 0, NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(anim, args, 1, NSNumber);
	int pageNum = [self pageNumFromArg:data];
	if (anim != nil)
		animated = [anim boolValue];
	[[self scrollview] setContentOffset:CGPointMake([self bounds].size.width * pageNum, 0) animated:animated];
    [pageControl setCurrentPage:pageNum];
	currentPage = pageNum;
	
    [self manageCache:pageNum];
	
	[self.proxy replaceValue:NUMINT(pageNum) forKey:@"currentPage" notification:NO];
}

-(void)moveNext:(id)args
{
	int page = [self currentPage];
	int pageCount = [[self proxy] viewCount];

	if (page < pageCount-1)
	{
		NSArray* scrollArgs = [NSArray arrayWithObjects:[NSNumber numberWithInt:(page+1)], args, nil];
		[self scrollToView:scrollArgs];
	}
}

-(void)movePrevious:(id)args
{
	int page = [self currentPage];

	if (page > 0)
	{
		NSArray* scrollArgs = [NSArray arrayWithObjects:[NSNumber numberWithInt:(page-1)], args, nil];
		[self scrollToView:scrollArgs];
	}
}

-(void)addView:(id)viewproxy
{
	[self refreshScrollView:[self bounds] readd:YES];
}

-(void)removeView:(id)args
{
	int page = [self currentPage];
	int pageCount = [[self proxy] viewCount];
	if (page==pageCount)
	{
		currentPage = pageCount-1;
		[pageControl setCurrentPage:currentPage];
		[self.proxy replaceValue:NUMINT(currentPage) forKey:@"currentPage" notification:NO];
	}
	[self refreshScrollView:[self bounds] readd:YES];
}

-(void)setCurrentPage_:(id)page
{
	
	int newPage = [TiUtils intValue:page];
	int viewsCount = [[self proxy] viewCount];

	if (newPage >=0 && newPage < viewsCount)
	{
		[scrollview setContentOffset:CGPointMake([self bounds].size.width * newPage, 0) animated:NO];
		currentPage = newPage;
		pageControl.currentPage = newPage;
		
        [self manageCache:newPage];
        
		[self.proxy replaceValue:NUMINT(newPage) forKey:@"currentPage" notification:NO];
	}
}

-(void)setScrollingEnabled_:(id)enabled
{
    scrollingEnabled = [TiUtils boolValue:enabled];
    [[self scrollview] setScrollEnabled:scrollingEnabled];
}

-(void)setDisableBounce_:(id)value
{
	[[self scrollview] setBounces:![TiUtils boolValue:value]];
}

#pragma mark Rotation

-(void)manageRotation
{
    if ([scrollview isDecelerating] || [scrollview isDragging]) {
        rotatedWhileScrolling = YES;
    }
}

#pragma mark Delegate calls

-(void)pageControlTouched:(id)sender
{
	int pageNum = [(UIPageControl *)sender currentPage];
	[scrollview setContentOffset:CGPointMake([self bounds].size.width * pageNum, 0) animated:YES];
	handlingPageControlEvent = YES;
	
	currentPage = pageNum;
	[self manageCache:currentPage];
	
	[self.proxy replaceValue:NUMINT(pageNum) forKey:@"currentPage" notification:NO];
	
	if ([self.proxy _hasListeners:@"click"])
	{
		[self.proxy fireEvent:@"click" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
													NUMINT(pageNum),@"currentPage",
													[[self proxy] viewAtIndex:pageNum],@"view",nil]]; 
	}
	
}

-(void)scrollViewDidScroll:(UIScrollView *)sender
{
	//switch page control at 50% across the center - this visually looks better
    CGFloat pageWidth = scrollview.frame.size.width;
    int page = currentPage;
    float nextPageAsFloat = ((scrollview.contentOffset.x - pageWidth / 2) / pageWidth) + 0.5;
    int nextPage = floor(nextPageAsFloat - 0.5) + 1;
	if ([self.proxy _hasListeners:@"scroll"])
	{
		[self.proxy fireEvent:@"scroll" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                                       NUMINT(nextPage), @"currentPage",
                                                       NUMFLOAT(nextPageAsFloat), @"currentPageAsFloat",
                                                       [[self proxy] viewAtIndex:nextPage], @"view", nil]]; 

	}
    if (page != nextPage) {
        int curCacheSize = cacheSize;
        int minCacheSize = cacheSize;
        if (enforceCacheRecalculation) {
            minCacheSize = ABS(page - nextPage)*2 + 1;
            if (minCacheSize < cacheSize) {
                minCacheSize = cacheSize;
            }
        }
        cacheSize = minCacheSize;
		[pageControl setCurrentPage:nextPage];
		currentPage = nextPage;
		[self.proxy replaceValue:NUMINT(currentPage) forKey:@"currentPage" notification:NO];
        [self manageCache:currentPage];
        cacheSize = curCacheSize;
    }
}

-(void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
	// called when setContentOffset/scrollRectVisible:animated: finishes. not called if not animating
	[self scrollViewDidEndDecelerating:scrollView];
}

-(void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
    if (rotatedWhileScrolling) {
        CGFloat pageWidth = [self bounds].size.width;
        [[self scrollview] setContentOffset:CGPointMake(pageWidth * [self currentPage], 0) animated:YES];
        rotatedWhileScrolling = NO;
    }

	// At the end of scroll animation, reset the boolean used when scrolls originate from the UIPageControl
	int pageNum = [self currentPage];
	handlingPageControlEvent = NO;

	[self.proxy replaceValue:NUMINT(pageNum) forKey:@"currentPage" notification:NO];
	
	if ([self.proxy _hasListeners:@"scrollEnd"])
	{	//TODO: Deprecate old event.
		[self.proxy fireEvent:@"scrollEnd" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
											  NUMINT(pageNum),@"currentPage",
											  [[self proxy] viewAtIndex:pageNum],@"view",nil]]; 
	}
	if ([self.proxy _hasListeners:@"scrollend"])
	{
		[self.proxy fireEvent:@"scrollend" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
													   NUMINT(pageNum),@"currentPage",
													   [[self proxy] viewAtIndex:pageNum],@"view",nil]]; 
	}
	currentPage=pageNum;
	[pageControl setCurrentPage:pageNum];
}

@end

#endif
