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
	RELEASE_TO_NIL(_scrollView);
    RELEASE_TO_NIL(_dotsViewHeight);
	RELEASE_TO_NIL(_dotsView);
    RELEASE_TO_NIL(_backgroundView);
	[super dealloc];
}

-(id)init
{
	if (self = [super init])
    {
        
        [self setDefaultHeight:TiDimensionAutoFill];
        [self setDefaultWidth:TiDimensionAutoFill];
        

        _contentView = [[UIView alloc] init];
        [_contentView setTranslatesAutoresizingMaskIntoConstraints:NO];
        
        _scrollView = [[UIScrollView alloc] init];
        [_scrollView setDirectionalLockEnabled:YES];
        [_scrollView setDelegate:self];
        [_scrollView setPagingEnabled:YES];
        [_scrollView setTranslatesAutoresizingMaskIntoConstraints:NO];
        [_scrollView setShowsHorizontalScrollIndicator:NO];
        [_scrollView setShowsVerticalScrollIndicator:NO];
        [_scrollView setBackgroundColor:[UIColor clearColor]];
        [_scrollView setDelaysContentTouches:NO];
        [_scrollView setScrollsToTop:NO];
        [_scrollView addSubview:_contentView];

        _dotsView = [[UIPageControl alloc] init];
        [_dotsView setTranslatesAutoresizingMaskIntoConstraints:NO];
        [_dotsView addTarget:self action:@selector(pageControlTouched:) forControlEvents:UIControlEventValueChanged];
        [_dotsView setBackgroundColor:[UIColor blackColor]];
        
        _backgroundView = [[UIView alloc] init];
        [_backgroundView addSubview:_scrollView];
        [_backgroundView addSubview:_dotsView];
        [self setInnerView:_backgroundView];

	}
	return self;
}

-(void)updateConstraints
{
    if (!_constraintAdded) {
        _constraintAdded = YES;
        NSDictionary* views =  NSDictionaryOfVariableBindings(_contentView, _scrollView, _dotsView);
        [_scrollView addConstraints:TI_CONSTR(@"V:|[_contentView(_scrollView)]|", views)];
        [_scrollView addConstraints:TI_CONSTR(@"H:|[_contentView(>=_scrollView)]|", views)];
        
        [_backgroundView addConstraints:TI_CONSTR(@"H:|[_scrollView]|", views)];
        [_backgroundView addConstraints:TI_CONSTR(@"V:|[_scrollView]|", views)];
        
        [_backgroundView addConstraints:TI_CONSTR(@"V:[_dotsView]-|", views)];
        [_backgroundView addConstraint: [NSLayoutConstraint constraintWithItem:_backgroundView attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:_dotsView attribute:NSLayoutAttributeCenterX multiplier:1 constant:0]];
    }
    [super updateConstraints];
}

-(void)layoutSubviews
{
    [super layoutSubviews];
    
    NSArray* children = [_contentView subviews];
    NSUInteger length = [children count];
    if (length != _childrenCount) {
        _childrenCount = length;
        for (TiLayoutView* child in children) {
            [TiLayoutView removeConstraints:_contentView fromChild:child];
            [TiLayoutView removeConstraints:_scrollView fromChild:child];
        }
        for (NSUInteger index = 0; index < length; index++)
        {
            TiLayoutView* child = [children objectAtIndex:index];
            NSDictionary* views;
            if (index == 0) {
                views =  NSDictionaryOfVariableBindings(_contentView, child, _scrollView);
                [_contentView addConstraints: TI_CONSTR(@"H:|[child]", views)];
            } else {
                UIView *prev = [children objectAtIndex:index-1];
                views =  NSDictionaryOfVariableBindings(_contentView, child, prev, _scrollView);
                [_contentView addConstraints: TI_CONSTR(@"H:[prev][child]", views)];
                
            }
            
            if (index == length-1) {
                [_contentView addConstraints:TI_CONSTR(@"H:[child]|", views)];
            }
            [_contentView addConstraints:TI_CONSTR(@"V:|[child]|", views)];
            [_scrollView addConstraints:TI_CONSTR(@"H:[child(_scrollView)]", views)];
            
        }
    }
    [_dotsView setNumberOfPages:length];
    [_dotsView setCurrentPage: _currentPage];
    
    [_scrollView setContentOffset:CGPointMake(_currentPage * self.frame.size.width, 0) animated:NO];
}

-(void)initializerState
{
}


-(UIPageControl*)pagecontrol 
{
	return _dotsView;
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

            return test == nil ? _scrollView : test;
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
    return _scrollView;
    
//        //Update clips to bounds only if cornerRadius and backgroundImage are not set
//        if ( (self.layer.cornerRadius == 0) && (self.backgroundImage == nil) ) {
//            [self setClipsToBounds:clipsToBounds];
//        }
}

-(void)listenerAdded:(NSString*)event count:(int)count
{
    [super listenerAdded:event count:count];
    NSArray * childrenArray = [[[self proxy] views] retain];
    for (id child in childrenArray) {
        if ([child respondsToSelector:@selector(parentListenersChanged)]) {
            [child performSelector:@selector(parentListenersChanged)];
        }
    }
    [childrenArray release];
}

-(void)listenerRemoved:(NSString*)event count:(int)count
{
    [super listenerRemoved:event count:count];
    NSArray * childrenArray = [[[self proxy] views] retain];
    for (id child in childrenArray) {
        if ([child respondsToSelector:@selector(parentListenersChanged)]) {
            [child performSelector:@selector(parentListenersChanged)];
        }
    }
    [childrenArray release];
}

-(NSInteger)currentPage
{
	NSInteger result = _currentPage;
    if (_scrollView != nil) {
        CGPoint offset = [[self scrollview] contentOffset];
        if (offset.x > 0) {
            CGSize scrollFrame = [self bounds].size;
            if (scrollFrame.width != 0) {
                result = round(offset.x/scrollFrame.width);
            }
		}
    }
	[_dotsView setCurrentPage:result];
    return result;
}

-(void)addSubview:(nonnull UIView *)view
{
    TiLayoutView* wrapperView = [[TiLayoutView alloc] init];
    [wrapperView setViewName: TI_STRING(@"scrollable.wrapper.view%lu", (unsigned long)[[_contentView subviews] count])];
    [wrapperView addSubview:view];
    [_contentView addSubview:wrapperView];
    if ([self loaded]) {
        [self layoutSubviews];
    }
}

-(void)setViews_:(NSArray*)args
{
    for (UIView* child in [_contentView subviews]) {
        [child removeFromSuperview];
    }
    for (TiViewProxy* viewProxy in args)
    {
        [self addSubview:[viewProxy view]];
    }
}
 

-(void)setShowPagingControl_:(id)args
{
    [_dotsView setHidden:[TiUtils boolValue:args]];
}

-(void)setPagingControlHeight_:(id)args
{
	CGFloat pageControlHeight = [TiUtils floatValue:args def:20.0];
	if (pageControlHeight < 5.0)
	{
		pageControlHeight = _dotsView.bounds.size.height;
	}
    if (_dotsViewHeight) {
        [_dotsView removeConstraint:_dotsViewHeight];
        RELEASE_TO_NIL(_dotsViewHeight);
    }
    
    _dotsViewHeight = [TI_CONSTR( TI_STRING(@"[_dotsView(%f)]", pageControlHeight), NSDictionaryOfVariableBindings(_dotsView)) objectAtIndex:0];
    [_dotsViewHeight retain];
    [_dotsView addConstraint: _dotsViewHeight];
}

-(void)setPagingControlColor_:(id)args
{
    TiColor* val = [TiUtils colorValue:args];
    if (val != nil) {
        [_dotsView setBackgroundColor:[val color]];
    }
}
-(void)setPagingControlAlpha_:(id)args
{
    CGFloat pagingControlAlpha = [TiUtils floatValue:args def:1.0];
    if(pagingControlAlpha > 1.0){
        pagingControlAlpha = 1;
    }    
    if(pagingControlAlpha < 0.0 ){
        pagingControlAlpha = 0;
    }
    [_dotsView setAlpha:pagingControlAlpha];
}
-(void)setPagingControlOnTop_:(id)args
{
    LOG_MISSING
}

-(void)setOverlayEnabled_:(id)args
{
    LOG_MISSING
}

-(void)addView:(TiViewProxy*)viewproxy
{
    [self addSubview:[viewproxy view]];
}

-(void)removeView:(TiViewProxy*)viewproxy
{
	NSInteger page = [self currentPage];
	NSUInteger pageCount = [[self proxy] viewCount];
	if (page==pageCount)
	{
		_currentPage = pageCount-1;
		[_dotsView setCurrentPage:_currentPage];
		[self.proxy replaceValue:NUMINTEGER(_currentPage) forKey:@"currentPage" notification:NO];
	}
    [[viewproxy view] removeFromSuperview];
}


-(void)setCurrentPage:(id)page animated:(NSNumber*)animate {
    int newPage = [TiUtils intValue:page];
    NSUInteger viewsCount = [[self proxy] viewCount];
    
    if (newPage >= 0 && newPage < viewsCount) {
        [_scrollView setContentOffset:CGPointMake([self bounds].size.width * newPage, 0) animated:[animate boolValue]];
        _currentPage = newPage;
        [_dotsView setCurrentPage: newPage];
        [[self proxy] replaceValue:NUMINT(newPage) forKey:@"currentPage" notification:NO];
    }
}

-(void)setCurrentPage_:(id)page
{
    [self setCurrentPage:page animated:NUMBOOL(NO)];
}

-(void)setScrollingEnabled_:(id)enabled
{
    [[self scrollview] setScrollEnabled:[TiUtils boolValue:enabled]];
}

-(void)setDisableBounce_:(id)value
{
	[[self scrollview] setBounces:![TiUtils boolValue:value]];
}

#pragma mark Delegate calls

-(void)pageControlTouched:(UIPageControl*)sender
{
    _currentPage = [sender currentPage];
	[_scrollView setContentOffset:CGPointMake(self.bounds.size.width * _currentPage, 0) animated:YES];
	
	[self.proxy replaceValue:NUMINTEGER(_currentPage) forKey:@"currentPage" notification:NO];
	if ([self.proxy _hasListeners:@"click"])
	{
		[self.proxy fireEvent:@"click" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
													NUMINTEGER(_currentPage),@"currentPage",
													[[self proxy] viewAtIndex:_currentPage],@"view",nil]];
	}
	
}

-(void)scrollViewDidScroll:(UIScrollView *)sender
{
	//switch page control at 50% across the center - this visually looks better
    CGFloat pageWidth = _scrollView.frame.size.width;
    NSInteger page = _currentPage;
    float nextPageAsFloat = ((_scrollView.contentOffset.x - pageWidth / 2) / pageWidth) + 0.5;
    int nextPage = floor(nextPageAsFloat - 0.5) + 1;
	if ([self.proxy _hasListeners:@"scroll"])
	{
		[self.proxy fireEvent:@"scroll" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                                       NUMINT(nextPage), @"currentPage",
                                                       NUMFLOAT(nextPageAsFloat), @"currentPageAsFloat",
                                                       [[self proxy] viewAtIndex:nextPage], @"view", nil]]; 

	}
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{

}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
}

-(void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
	// called when setContentOffset/scrollRectVisible:animated: finishes. not called if not animating
	[self scrollViewDidEndDecelerating:scrollView];
}

-(void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
	// At the end of scroll animation, reset the boolean used when scrolls originate from the UIPageControl
    CGPoint contentOffset = [scrollView contentOffset];
    _currentPage = ceil(contentOffset.x / self.frame.size.width);

    [_dotsView setCurrentPage:_currentPage];

    [self.proxy replaceValue:NUMINTEGER(_currentPage) forKey:@"currentPage" notification:NO];
    if ([self.proxy _hasListeners:@"scrollend"])
	{
        [self.proxy fireEvent:@"scrollend" withObject: @{@"currentPage": NUMINTEGER(_currentPage), @"view": [[self proxy] viewAtIndex:_currentPage]}];
 	}
}

@end

#endif
