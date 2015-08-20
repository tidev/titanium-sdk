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
#import "TiApp.h"

@implementation TiUIScrollViewImpl

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
	RELEASE_TO_NIL(contentView);
	RELEASE_TO_NIL(scrollView);
	[super dealloc];
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        scrollView = [[TiUIScrollViewImpl alloc] init];
        [scrollView setTranslatesAutoresizingMaskIntoConstraints:NO];
        [scrollView setBackgroundColor:[UIColor clearColor]];
        [scrollView setShowsHorizontalScrollIndicator:NO];
        [scrollView setShowsVerticalScrollIndicator:NO];
        [scrollView setDelegate:self];
        [scrollView setTouchHandler:self];

        contentView = [[TiLayoutView alloc] init];
        [contentView setTranslatesAutoresizingMaskIntoConstraints:NO];
        [contentView setBackgroundColor:[UIColor greenColor]];
        [contentView setViewName:@"contentView"];
        
        [contentView setDefaultHeight:TiDimensionAutoSize];
        [contentView setDefaultWidth:TiDimensionAutoSize];
        
        [scrollView addSubview:contentView];
        [super addSubview:scrollView];
        
        [self setDefaultHeight:TiDimensionAutoFill];
        [self setDefaultWidth:TiDimensionAutoFill];
        
        [self setInnerView:scrollView];
        [self setHorizontalWrap:NO];

    }
    return self;
}

-(UIView *)contentView
{
	return contentView;
}

-(TiUIScrollViewImpl *)scrollView
{
	return scrollView;
}

- (id)accessibilityElement
{
	return [self scrollView];
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

-(void)setHorizontalWrap:(BOOL)horizontalWrap
{
    [contentView setHorizontalWrap:horizontalWrap];
    [super setHorizontalWrap:horizontalWrap];
}

-(BOOL)horizontalWrap
{
    return [contentView horizontalWrap];
}

-(void)addSubview:(nonnull UIView *)view
{
    [contentView addSubview:view];
}

-(void)insertSubview:(nonnull UIView *)view aboveSubview:(nonnull UIView *)siblingSubview
{
    [contentView insertSubview:view aboveSubview:siblingSubview];
}

-(void)insertSubview:(nonnull UIView *)view atIndex:(NSInteger)index
{
    [contentView insertSubview:view atIndex:index];
}

-(void)insertSubview:(nonnull UIView *)view belowSubview:(nonnull UIView *)siblingSubview
{
    [contentView insertSubview:view belowSubview:siblingSubview];
}

-(void)setLayout_:(id)val
{
    [contentView setLayout_:val];
}

-(void)setOnContentLayout:(void (^)(TiLayoutView * sender, CGRect rect))onContentLayout
{
    [contentView setOnLayout:onContentLayout];
}

-(void)setBackgroundColor:(UIColor *)backgroundColor
{
    [[self contentView] setBackgroundColor:backgroundColor];
    [super setBackgroundColor:backgroundColor];
}

-(void)setDecelerationRate_:(id)value
{
	[self.proxy replaceValue:value forKey:@"decelerationRate" notification:NO];
	[[self scrollView] setDecelerationRate:[TiUtils floatValue:value def:UIScrollViewDecelerationRateNormal]];
}

-(void)setContentWidth_:(id)value
{
	contentWidth = [TiUtils dimensionValue:value];
    [self.proxy replaceValue:value forKey:@"contentWidth" notification:NO];
    [contentView setWidth_:value];
}

-(void)setContentHeight_:(id)value
{
	contentHeight = [TiUtils dimensionValue:value];
    [self.proxy replaceValue:value forKey:@"contentHeight" notification:NO];
    [contentView setHeight_:value];
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
	return [self contentView];
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView_ withView:(UIView *)view atScale:(CGFloat)scale
{
	// scale between minimum and maximum. called after any 'bounce' animations
	[(id<UIScrollViewDelegate>)[self proxy] scrollViewDidEndZooming:scrollView withView:(UIView*)view atScale:scale];
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView_
{
//	CGSize boundsSize = scrollView.bounds.size;
//    CGRect frameToCenter = contentView.frame;
//	if (TiDimensionIsAuto(contentWidth) || TiDimensionIsAutoSize(contentWidth) || TiDimensionIsUndefined(contentWidth)) {
//		if (frameToCenter.size.width < boundsSize.width) {
//			frameToCenter.origin.x = (boundsSize.width - frameToCenter.size.width) / 2;
//		} else {
//			frameToCenter.origin.x = 0;
//		}
//	}
//	if (TiDimensionIsAuto(contentHeight) || TiDimensionIsAutoSize(contentHeight) || TiDimensionIsUndefined(contentHeight)) {
//		if (frameToCenter.size.height < boundsSize.height) {
//			frameToCenter.origin.y = (boundsSize.height - frameToCenter.size.height) / 2;
//		} else {
//			frameToCenter.origin.y = 0;
//		}
//	}
//    contentView.frame = frameToCenter;
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
    UIEdgeInsets contentInsets = UIEdgeInsetsMake(0.0, 0.0, keyboardTop, 0);
    [[self scrollView] setContentInset: contentInsets];
    [[self scrollView] setScrollIndicatorInsets: contentInsets];
    
    [NSTimer scheduledTimerWithTimeInterval:0.3 block:^{
        TiViewProxy* focused = [[TiApp controller] keyboardFocusedProxy];
        if (focused == nil) return;

        UIView* parent = [[focused view] superview];
        while (parent) {
            if (parent == self) {
                [self scrollToShowView:[focused view] withKeyboardHeight:keyboardTop];
                return;
            }
            parent = [parent superview];
        }
    } repeats:NO];

    
}

-(void)notifyFocusedViews:(UIView*)parent keyboardTop:(CGFloat)keyboardTop
{
//    TiViewProxy* focus = [[TiApp controller] keyboardFocusedProxy];
//    UIView* parent = [[focus view] superview];
//    
//    while (parent) {
//        if (parent == self) {
//            [self scrollToShowView:(TiUIView*)parent withKeyboardHeight:keyboardTop];
//            break;
//        }
//        parent = [parent superview];
//    }
//    
//    for (UIView* child in [parent subviews]) {
//        [self notifyFocusedViews:child keyboardTop:keyboardTop];
//
//        if ([child isKindOfClass:[TiUIView class]]) {
//            TiViewProxy* proxy = (TiViewProxy*)[(TiUIView*)child proxy];
//            if (proxy == focus) {
//                [self scrollToShowView:(TiUIView*)child withKeyboardHeight:keyboardTop];
//            }
//        }
//    }
}

-(void)keyboardDidHide
{
    [[self scrollView] setContentInset: UIEdgeInsetsZero];
    [[self scrollView] setScrollIndicatorInsets: UIEdgeInsetsZero];
}

-(void)scrollToShowView:(TiUIView *)firstResponderView withKeyboardHeight:(CGFloat)keyboardTop
{
    if ([scrollView isScrollEnabled]) {
        CGRect responderRect = [contentView convertRect:[firstResponderView bounds] fromView:firstResponderView];
        OffsetScrollViewForRect(scrollView,keyboardTop,minimumContentHeight,responderRect);
    }
}

@end

#endif