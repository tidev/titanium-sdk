/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLVIEW

#import "TiUIScrollView.h"
#import "TiUIScrollViewProxy.h"
#import "TiUtils.h"

@implementation TiUIScrollViewImpl

//TIMOB-12988 Additions BEGIN.
/*
 * If you log the scrollRectToVisible and setContentOffset calls, you can see
 * IOS is passing values we do not want. This is a hack to workaround 
 * bad contentoffset call. We calculate it correctly in our own code
 * and that call follows soon after.
 * Happens on IOS 5.1, 5.0 and 4.3. Not on iOS 6. Although values passed in are identical. Timing?
 * Delete this block when we drop support for older versions of IOS.
 */
-(void) delayContentOffset
{
    if(!ignore){
        [self setContentOffset:offsetPoint animated:offsetAnimated];
    }
}

- (void)setContentOffset:(CGPoint)contentOffset animated:(BOOL)animated
{
    if (delay && ![TiUtils isIOS6OrGreater]) {
        delay = NO;
        ignore = NO;
        offsetPoint = contentOffset;
        offsetAnimated = animated;
        [self performSelector:@selector(delayContentOffset) withObject:nil afterDelay:0.2];
        return;
    }
    ignore = YES;
    [super setContentOffset:contentOffset animated:animated];
}

- (void)scrollRectToVisible:(CGRect)rect animated:(BOOL)animated
{
    delay = YES;
    [super scrollRectToVisible:rect animated:animated];
}
//TIMOB-12988 Additions END.

-(void)setTouchHandler:(TiUIView*)handler
{
    //Assign only. No retain
    touchHandler = handler;
}

- (BOOL)touchesShouldBegin:(NSSet *)touches withEvent:(UIEvent *)event inContentView:(UIView *)view
{
    //If the content view is of type TiUIView touch events will automatically propagate
    //If it is not of type TiUIView we will fire touch events with ourself as source
    if ([view isKindOfClass:[TiUIView class]]) {
        touchedContentView= view;
    }
    else {
        touchedContentView = nil;
    }
    return [super touchesShouldBegin:touches withEvent:event inContentView:view];
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event 
{
    //When userInteractionEnabled is false we do nothing since touch events are automatically
    //propagated. If it is dragging,tracking or zooming do not do anything.
    if (!self.dragging && !self.zooming && !self.tracking 
        && self.userInteractionEnabled && (touchedContentView == nil) ) {
        [touchHandler processTouchesBegan:touches withEvent:event];
 	}		
	[super touchesBegan:touches withEvent:event];
}
- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event 
{
    if (!self.dragging && !self.zooming && !self.tracking 
        && self.userInteractionEnabled && (touchedContentView == nil) ) {
        [touchHandler processTouchesMoved:touches withEvent:event];
    }		
	[super touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event 
{
    if (!self.dragging && !self.zooming && !self.tracking 
        && self.userInteractionEnabled && (touchedContentView == nil) ) {
        [touchHandler processTouchesEnded:touches withEvent:event];
    }		
	[super touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event 
{
    if (!self.dragging && !self.zooming && !self.tracking 
        && self.userInteractionEnabled && (touchedContentView == nil) ) {
        [touchHandler processTouchesCancelled:touches withEvent:event];
    }		
	[super touchesCancelled:touches withEvent:event];
}
@end

@implementation TiUIScrollView
@synthesize contentWidth;

- (void) dealloc
{
	RELEASE_TO_NIL(wrapperView);
	RELEASE_TO_NIL(scrollView);
	[super dealloc];
}

-(UIView *)wrapperView
{
	if (wrapperView == nil)
	{
		CGRect wrapperFrame;
		wrapperFrame.size = [[self scrollView] contentSize];
		wrapperFrame.origin = CGPointZero;
		wrapperView = [[UIView alloc] initWithFrame:wrapperFrame];
		[wrapperView setUserInteractionEnabled:YES];
		[scrollView addSubview:wrapperView];
	}
	return wrapperView;
}

-(TiUIScrollViewImpl *)scrollView
{
	if(scrollView == nil)
	{
		scrollView = [[TiUIScrollViewImpl alloc] initWithFrame:[self bounds]];
		[scrollView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[scrollView setBackgroundColor:[UIColor clearColor]];
		[scrollView setShowsHorizontalScrollIndicator:NO];
		[scrollView setShowsVerticalScrollIndicator:NO];
		[scrollView setDelegate:self];
        [scrollView setTouchHandler:self];
		[self addSubview:scrollView];
	}
	return scrollView;
}

- (id)accessibilityElement
{
	return [self scrollView];
}

-(void)setNeedsHandleContentSizeIfAutosizing
{
	if (TiDimensionIsAuto(contentWidth) || TiDimensionIsAuto(contentHeight) ||
        TiDimensionIsAutoSize(contentWidth) || TiDimensionIsAutoSize(contentHeight) ||
        TiDimensionIsUndefined(contentWidth) || TiDimensionIsUndefined(contentHeight))
	{
		[self setNeedsHandleContentSize];
	}
}

-(void)setNeedsHandleContentSize
{
	if (!needsHandleContentSize)
	{
		needsHandleContentSize = YES;
		TiThreadPerformOnMainThread(^{[self handleContentSize];}, NO);
	}
}


-(BOOL)handleContentSizeIfNeeded
{
	if (needsHandleContentSize)
	{
		[self handleContentSize];
		return YES;
	}
	return NO;
}

-(void)handleContentSize
{
	if (!needsHandleContentSize) {
		return;
	}
	CGSize newContentSize = [self bounds].size;
	CGFloat scale = [scrollView zoomScale];

	switch (contentWidth.type)
	{
		case TiDimensionTypeDip:
		{
			newContentSize.width = MAX(newContentSize.width,contentWidth.value);
			break;
		}
        case TiDimensionTypeUndefined:
        case TiDimensionTypeAutoSize:
		case TiDimensionTypeAuto: // TODO: This may break the layout spec for content "auto"
		{
			newContentSize.width = MAX(newContentSize.width,[(TiViewProxy *)[self proxy] autoWidthForSize:[self bounds].size]);
			break;
		}
        case TiDimensionTypeAutoFill: // Assume that "fill" means "fill scrollview bounds"; not in spec
		default: {
			break;
		}
	}

	switch (contentHeight.type)
	{
		case TiDimensionTypeDip:
		{
			minimumContentHeight = contentHeight.value;
			break;
		}
        case TiDimensionTypeUndefined:
        case TiDimensionTypeAutoSize:
		case TiDimensionTypeAuto: // TODO: This may break the layout spec for content "auto"            
		{
			minimumContentHeight=[(TiViewProxy *)[self proxy] autoHeightForSize:[self bounds].size];
			break;
		}
        case TiDimensionTypeAutoFill: // Assume that "fill" means "fill scrollview bounds"; not in spec           
		default:
			minimumContentHeight = newContentSize.height;
			break;
	}
	newContentSize.width *= scale;
	newContentSize.height = scale * MAX(newContentSize.height,minimumContentHeight);

	[scrollView setContentSize:newContentSize];
	CGRect wrapperBounds;
	wrapperBounds.origin = CGPointZero;
	wrapperBounds.size = newContentSize;
	[wrapperView setFrame:wrapperBounds];
	[self scrollViewDidZoom:scrollView];
	needsHandleContentSize = NO;
	[(TiUIScrollViewProxy *)[self proxy] layoutChildrenAfterContentSize:NO];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)visibleBounds
{
	//Treat this as a size change
	[(TiViewProxy *)[self proxy] willChangeSize];
    [super frameSizeChanged:frame bounds:visibleBounds];
}

-(void)scrollToBottom
{
    /*
     * Calculate the bottom height & width and, sets the offset from the 
     * content view’s origin that corresponds to the receiver’s origin.
     */ 
    UIScrollView *currScrollView = [self scrollView];
    
    CGSize svContentSize = currScrollView.contentSize;
    CGSize svBoundSize = currScrollView.bounds.size;
    CGFloat svBottomInsets = currScrollView.contentInset.bottom;
    
    CGFloat bottomHeight = svContentSize.height - svBoundSize.height + svBottomInsets;
    CGFloat bottomWidth = svContentSize.width - svBoundSize.width;

    CGPoint newOffset = CGPointMake(bottomWidth,bottomHeight);
    
    [currScrollView setContentOffset:newOffset animated:YES];
    
}

-(void)setContentWidth_:(id)value
{
	contentWidth = [TiUtils dimensionValue:value];
    [self.proxy replaceValue:value forKey:@"contentWidth" notification:NO];
	[self performSelector:@selector(setNeedsHandleContentSize) withObject:nil afterDelay:.1];
}

-(void)setContentHeight_:(id)value
{
	contentHeight = [TiUtils dimensionValue:value];
    [self.proxy replaceValue:value forKey:@"contentHeight" notification:NO];
	[self performSelector:@selector(setNeedsHandleContentSize) withObject:nil afterDelay:.1];
}

-(void)setShowHorizontalScrollIndicator_:(id)value
{
	[[self scrollView] setShowsHorizontalScrollIndicator:[TiUtils boolValue:value]];
}

-(void)setShowVerticalScrollIndicator_:(id)value
{
	[[self scrollView] setShowsVerticalScrollIndicator:[TiUtils boolValue:value]];
}

-(void)setScrollIndicatorStyle_:(id)value
{
	[[self scrollView] setIndicatorStyle:[TiUtils intValue:value def:UIScrollViewIndicatorStyleDefault]];
}

-(void)setDisableBounce_:(id)value
{
	[[self scrollView] setBounces:![TiUtils boolValue:value]];
}

-(void)setScrollingEnabled_:(id)enabled
{
    BOOL scrollingEnabled = [TiUtils boolValue:enabled def:YES];
    [[self scrollView] setScrollEnabled:scrollingEnabled];
    [[self proxy] replaceValue:NUMBOOL(scrollingEnabled) forKey:@"scrollingEnabled" notification:NO];
}

-(void)setScrollsToTop_:(id)value
{
	[[self scrollView] setScrollsToTop:[TiUtils boolValue:value def:YES]];
}

-(void)setHorizontalBounce_:(id)value
{
	[[self scrollView] setAlwaysBounceHorizontal:[TiUtils boolValue:value]];
}

-(void)setVerticalBounce_:(id)value
{
	[[self scrollView] setAlwaysBounceVertical:[TiUtils boolValue:value]];
}

-(void)setContentOffset_:(id)value withObject:(id)property
{
    CGPoint newOffset = [TiUtils pointValue:value];
	BOOL animated = [TiUtils boolValue:@"animated" properties:property def:(scrollView !=nil)];
	[[self scrollView] setContentOffset:newOffset animated:animated];
}

-(void)setZoomScale_:(id)value withObject:(id)property
{
	CGFloat scale = [TiUtils floatValue:value def:1.0];
	BOOL animated = [TiUtils boolValue:@"animated" properties:property def:NO];
	[[self scrollView] setZoomScale:scale animated:animated];
	scale = [[self scrollView] zoomScale]; //Why are we doing this? Because of minZoomScale or maxZoomScale.
	[[self proxy] replaceValue:NUMFLOAT(scale) forKey:@"zoomScale" notification:NO];
	if ([self.proxy _hasListeners:@"scale"])
	{
		[self.proxy fireEvent:@"scale" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
											NUMFLOAT(scale),@"scale",
											nil]];
	}
}

-(void)setMaxZoomScale_:(id)args
{
    CGFloat val = [TiUtils floatValue:args def:1.0];
    [[self scrollView] setMaximumZoomScale:val];
    if ([[self scrollView] zoomScale] > val) {
        [self setZoomScale_:args withObject:nil];
    }
    else if ([[self scrollView] zoomScale] < [[self scrollView] minimumZoomScale]){
        [self setZoomScale_:[NSNumber numberWithFloat:[[self scrollView] minimumZoomScale]] withObject:nil];
    }
}

-(void)setMinZoomScale_:(id)args
{
    CGFloat val = [TiUtils floatValue:args def:1.0];
    [[self scrollView] setMinimumZoomScale:val];
    if ([[self scrollView] zoomScale] < val) {
        [self setZoomScale_:args withObject:nil];
    }
}

-(void)setCanCancelEvents_:(id)args
{
	[[self scrollView] setCanCancelContentTouches:[TiUtils boolValue:args def:YES]];
}

#pragma mark scrollView delegate stuff


- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView_               // any offset changes
{
	[(id<UIScrollViewDelegate>)[self proxy] scrollViewDidEndDecelerating:scrollView_];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView_               // any offset changes
{
	[(id<UIScrollViewDelegate>)[self proxy] scrollViewDidScroll:scrollView_];
}

- (UIView *)viewForZoomingInScrollView:(UIScrollView *)scrollView
{
	return [self wrapperView];
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView_ withView:(UIView *)view atScale:(float)scale 
{
	// scale between minimum and maximum. called after any 'bounce' animations
	[(id<UIScrollViewDelegate>)[self proxy] scrollViewDidEndZooming:scrollView withView:(UIView*)view atScale:scale];
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView_
{
	CGSize boundsSize = scrollView.bounds.size;
    CGRect frameToCenter = wrapperView.frame;
	if (TiDimensionIsAuto(contentWidth) || TiDimensionIsAutoSize(contentWidth) || TiDimensionIsUndefined(contentWidth)) {
		if (frameToCenter.size.width < boundsSize.width) {
			frameToCenter.origin.x = (boundsSize.width - frameToCenter.size.width) / 2;
		} else {
			frameToCenter.origin.x = 0;
		}
	}
	if (TiDimensionIsAuto(contentHeight) || TiDimensionIsAutoSize(contentHeight) || TiDimensionIsUndefined(contentHeight)) {
		if (frameToCenter.size.height < boundsSize.height) {
			frameToCenter.origin.y = (boundsSize.height - frameToCenter.size.height) / 2;
		} else {
			frameToCenter.origin.y = 0;
		}
	}
    wrapperView.frame = frameToCenter;	
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView_  
{
	// Tells the delegate when the scroll view is about to start scrolling the content.
	[(id<UIScrollViewDelegate>)[self proxy] scrollViewWillBeginDragging:scrollView_];
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView_ willDecelerate:(BOOL)decelerate
{
	//Tells the delegate when dragging ended in the scroll view.
	[(id<UIScrollViewDelegate>)[self proxy] scrollViewDidEndDragging:scrollView_ willDecelerate:decelerate];
}

#pragma mark Keyboard delegate stuff

-(void)keyboardDidShowAtHeight:(CGFloat)keyboardTop
{
	InsetScrollViewForKeyboard(scrollView,keyboardTop,minimumContentHeight);
}

-(void)scrollToShowView:(TiUIView *)firstResponderView withKeyboardHeight:(CGFloat)keyboardTop
{
    if ([scrollView isScrollEnabled]) {
        CGRect responderRect = [wrapperView convertRect:[firstResponderView bounds] fromView:firstResponderView];
        OffsetScrollViewForRect(scrollView,keyboardTop,minimumContentHeight,responderRect);
    }
}

@end

#endif