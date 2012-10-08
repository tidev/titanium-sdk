/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLVIEW

#import "TiUIScrollViewProxy.h"
#import "TiUIScrollView.h"

#import "TiUtils.h"

@implementation TiUIScrollViewProxy

static NSArray* scrollViewKeySequence;
-(NSArray *)keySequence
{
    if (scrollViewKeySequence == nil)
    {
        //URL has to be processed first since the spinner depends on URL being remote
        scrollViewKeySequence = [[NSArray arrayWithObjects:@"minZoomScale",@"maxZoomScale",@"zoomScale",nil] retain];
    }
    return scrollViewKeySequence;
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    [self initializeProperty:@"minZoomScale" defaultValue:NUMFLOAT(1.0)];
    [self initializeProperty:@"maxZoomScale" defaultValue:NUMFLOAT(1.0)];
    [self initializeProperty:@"zoomScale" defaultValue:NUMFLOAT(1.0)];
    [self initializeProperty:@"canCancelEvents" defaultValue:NUMBOOL(YES)];
    [self initializeProperty:@"scrollingEnabled" defaultValue:NUMBOOL(YES)];
    [super _initWithProperties:properties];
}

-(TiPoint *) contentOffset{
    if([self viewAttached]){
        TiThreadPerformOnMainThread(^{
                   contentOffset = [[TiPoint alloc] initWithPoint:CGPointMake(
                                        [(TiUIScrollView *)[self view] scrollView].contentOffset.x,
                                        [(TiUIScrollView *)[self view] scrollView].contentOffset.y)] ; 
          }, YES);
    }
    else{
        contentOffset = [[TiPoint alloc] initWithPoint:CGPointMake(0,0)];
    }
    return [contentOffset autorelease];
}

-(void)windowWillOpen
{
    [super windowWillOpen];
    //Since layout children is overridden in scrollview need to make sure that 
    //a full layout occurs atleast once if view is attached
    if ([self viewAttached]) {
        [self contentsWillChange];
    }
}

-(void)contentsWillChange
{
	if ([self viewAttached])
	{
		[(TiUIScrollView *)[self view] setNeedsHandleContentSize];
	}
	[super contentsWillChange];
}

-(void)willChangeSize
{
	if ([self viewAttached])
	{
		[(TiUIScrollView *)[self view] setNeedsHandleContentSizeIfAutosizing];
	}
	[super willChangeSize];
}


-(void)layoutChildren:(BOOL)optimize
{
	if (![self viewAttached])
	{
		return;
	}

	[(TiUIScrollView *)[self view] handleContentSizeIfNeeded];
}

-(void)layoutChildrenAfterContentSize:(BOOL)optimize
{
	[super layoutChildren:optimize];	
}

-(CGFloat)autoWidthForSize:(CGSize)size
{
    BOOL flexibleContentWidth = YES;
    BOOL flexibleContentHeight = YES;
    CGSize contentSize = CGSizeMake(size.width,size.height);
    id cw = [self valueForUndefinedKey:@"contentWidth"];
    id ch = [self valueForUndefinedKey:@"contentHeight"];
    TiDimension contentWidth = TiDimensionUndefined;
    TiDimension contentHeight = TiDimensionUndefined;
    if (cw) {
        contentWidth = TiDimensionFromObject(cw);
    }
    if (ch) {
        contentHeight = TiDimensionFromObject(ch);
    }
    
    if (TiDimensionIsAutoFill(contentWidth) || TiDimensionIsDip(contentWidth) || TiDimensionIsPercent(contentWidth)) {
        flexibleContentWidth = NO;
    }
    if (TiDimensionIsAutoFill(contentHeight) || TiDimensionIsDip(contentHeight) || TiDimensionIsPercent(contentHeight)) {
        flexibleContentHeight = NO;
    }
    
    if (!flexibleContentWidth) {
        contentSize.width = MAX(TiDimensionCalculateValue(contentWidth, size.width), size.width);
        //Scrollview contents are always limited by contentWidth
        return contentSize.width;
    }
    
    if (!flexibleContentHeight) {
        contentSize.height = MAX(TiDimensionCalculateValue(contentHeight, size.height), size.height);
    }
    CGFloat result = 0.0;
    
    if (TiLayoutRuleIsVertical(layoutProperties.layoutStyle)) {
        //Vertical layout. Just get the maximum child width
        CGFloat thisWidth = 0.0;
        pthread_rwlock_rdlock(&childrenLock);
        NSArray* subproxies = [self children];
        for (TiViewProxy * thisChildProxy in subproxies) {
            thisWidth = [thisChildProxy minimumParentWidthForSize:contentSize];
            if (result < thisWidth) {
                result = thisWidth;
            }
        }
        pthread_rwlock_unlock(&childrenLock);
    }
    else if (TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle)) {
        pthread_rwlock_rdlock(&childrenLock);
        NSArray* subproxies = [self children];
        for (TiViewProxy * thisChildProxy in subproxies) {
            if ([thisChildProxy widthIsAutoFill]) {
                result += [thisChildProxy minimumParentWidthForSize:size];
            }
            else if (TiDimensionIsPercent(thisChildProxy->layoutProperties.width)){
                result += [thisChildProxy minimumParentWidthForSize:size];
            }
            else {
                result += [thisChildProxy minimumParentWidthForSize:contentSize];
            }
        }
        pthread_rwlock_unlock(&childrenLock);
    }
    else {
        result = [super autoWidthForSize:size];
    }
    return result;
}

-(CGFloat)autoHeightForSize:(CGSize)size
{
    BOOL flexibleContentWidth = YES;
    BOOL flexibleContentHeight = YES;
    CGSize contentSize = CGSizeMake(size.width,size.height);
    id cw = [self valueForUndefinedKey:@"contentWidth"];
    id ch = [self valueForUndefinedKey:@"contentHeight"];
    TiDimension contentWidth = TiDimensionUndefined;
    TiDimension contentHeight = TiDimensionUndefined;
    if (cw) {
        contentWidth = TiDimensionFromObject(cw);
    }
    if (ch) {
        contentHeight = TiDimensionFromObject(ch);
    }
    
    if (TiDimensionIsAutoFill(contentWidth) || TiDimensionIsDip(contentWidth) || TiDimensionIsPercent(contentWidth)) {
        flexibleContentWidth = NO;
    }
    if (TiDimensionIsAutoFill(contentHeight) || TiDimensionIsDip(contentHeight) || TiDimensionIsPercent(contentHeight)) {
        flexibleContentHeight = NO;
    }
    
    if (!flexibleContentHeight) {
        contentSize.height = MAX(TiDimensionCalculateValue(contentHeight, size.height), size.height);
        return contentSize.height;
    }
    if (!flexibleContentWidth) {
        contentSize.width = MAX(TiDimensionCalculateValue(contentWidth, size.width), size.width);
    }
    CGFloat result = 0.0;
    if (TiLayoutRuleIsVertical(layoutProperties.layoutStyle)) {
        pthread_rwlock_rdlock(&childrenLock);
        NSArray* subproxies = [self children];
        for (TiViewProxy * thisChildProxy in subproxies) {
            if ([thisChildProxy heightIsAutoFill]) {
                result += size.height;
            }
            else if (TiDimensionIsPercent(thisChildProxy->layoutProperties.height)){
                result += [thisChildProxy minimumParentWidthForSize:size];
            }
            else {
                result += [thisChildProxy minimumParentHeightForSize:contentSize];
            }
        }
        pthread_rwlock_unlock(&childrenLock);
    }
    else if (TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle)) {
        BOOL horizontalWrap = TiLayoutFlagsHasHorizontalWrap(&layoutProperties);
        if(flexibleContentWidth || !horizontalWrap) {
            CGFloat thisHeight = 0;
            pthread_rwlock_rdlock(&childrenLock);
            NSArray* subproxies = [self children];
            for (TiViewProxy * thisChildProxy in subproxies) {
                if ([thisChildProxy heightIsAutoFill]) {
                    thisHeight = [thisChildProxy minimumParentHeightForSize:size];
                }
                else if (TiDimensionIsPercent(thisChildProxy->layoutProperties.height)){
                    thisHeight = [thisChildProxy minimumParentHeightForSize:size];
                }
                else {
                    thisHeight = [thisChildProxy minimumParentHeightForSize:contentSize];
                }
                if (result < thisHeight) {
                    result = thisHeight;
                }
            }
            pthread_rwlock_unlock(&childrenLock);
        }
        else {
            //Not flexible width and wraps
            result = [super autoHeightForSize:contentSize];
        }
    }
    else {
        result = [super autoHeightForSize:contentSize];
    }
    return result;
}

-(CGRect)computeChildSandbox:(TiViewProxy*)child withBounds:(CGRect)bounds
{
    CGRect viewBounds = CGRectMake(bounds.origin.x, bounds.origin.y, bounds.size.width, bounds.size.height);
    CGRect contentSize = CGRectMake(bounds.origin.x, bounds.origin.y, bounds.size.width, bounds.size.height);
    if ([self viewAttached]) {
        viewBounds = [[self view] bounds];
    }
    BOOL flexibleContentWidth = YES;
    BOOL flexibleContentHeight = YES;
    id cw = [self valueForUndefinedKey:@"contentWidth"];
    id ch = [self valueForUndefinedKey:@"contentHeight"];
    TiDimension contentWidth = TiDimensionUndefined;
    TiDimension contentHeight = TiDimensionUndefined;
    if (cw) {
        contentWidth = TiDimensionFromObject(cw);
    }
    if (ch) {
        contentHeight = TiDimensionFromObject(ch);
    }
    
    if (TiDimensionIsAutoFill(contentWidth) || TiDimensionIsDip(contentWidth) || TiDimensionIsPercent(contentWidth)) {
        flexibleContentWidth = NO;
    }
    if (TiDimensionIsAutoFill(contentHeight) || TiDimensionIsDip(contentHeight) || TiDimensionIsPercent(contentHeight)) {
        flexibleContentHeight = NO;
    }
    
    if (flexibleContentHeight) {
        contentSize.size.height = [self autoHeightForSize:bounds.size];
    }
    if (flexibleContentWidth) {
        contentSize.size.width = [self autoWidthForSize:bounds.size];
    }
    
    contentSize.size.width = MAX(contentSize.size.width,viewBounds.size.width);
    contentSize.size.height = MAX(contentSize.size.height,viewBounds.size.height);
    
    if (TiLayoutRuleIsVertical(layoutProperties.layoutStyle)) {
        if ([child heightIsAutoFill] && flexibleContentHeight) {
            bounds.origin.y = verticalLayoutBoundary;
            bounds.size.height = viewBounds.size.height;
            verticalLayoutBoundary += bounds.size.height;
            return bounds;
        }
        else if (TiDimensionIsPercent(child->layoutProperties.height)){
            bounds.origin.y = verticalLayoutBoundary;
            bounds.size.height = [child minimumParentHeightForSize:viewBounds.size];
            verticalLayoutBoundary += bounds.size.height;
            return bounds;
        }
        else if (TiDimensionIsUndefined(child->layoutProperties.height)){
            //Undefined height with 2+pins. Need to use view bounds to match autoHeight behavior
            bounds.origin.y = verticalLayoutBoundary;
            bounds.size.height = [child minimumParentHeightForSize:viewBounds.size];
            verticalLayoutBoundary += bounds.size.height;
        }
        else {
            return [super computeChildSandbox:child withBounds:contentSize];
        }
    }
    else if (TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle)) {
        BOOL horizontalWrap = TiLayoutFlagsHasHorizontalWrap(&layoutProperties);
        if (flexibleContentWidth) {
            if ([child widthIsAutoFill] || TiDimensionIsPercent(child->layoutProperties.width) || TiDimensionIsUndefined(child->layoutProperties.width)) {
                bounds.origin.x = horizontalLayoutBoundary;
                bounds.size.width = [child minimumParentWidthForSize:viewBounds.size];
                horizontalLayoutBoundary += bounds.size.width;
                bounds.size.height = contentSize.size.height;
                return bounds;
            }
            else {
                bounds = [super computeChildSandbox:child withBounds:contentSize];
                bounds.size.height = contentSize.size.height;
                return bounds;
            }
        }
        else {
            return [super computeChildSandbox:child withBounds:contentSize];
        }
        
    }
}

-(void)childWillResize:(TiViewProxy *)child
{
	[super childWillResize:child];
	[(TiUIScrollView *)[self view] setNeedsHandleContentSizeIfAutosizing];
}

-(BOOL)optimizeSubviewInsertion
{
    return YES;
}

-(UIView *)parentViewForChild:(TiViewProxy *)child
{
	return [(TiUIScrollView *)[self view] wrapperView];
}

-(void)scrollTo:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	TiPoint * offset = [[TiPoint alloc] initWithPoint:CGPointMake(
			[TiUtils floatValue:[args objectAtIndex:0]],
			[TiUtils floatValue:[args objectAtIndex:1]])];

	[self setContentOffset:offset withObject:Nil];
	[offset release];
}

-(void)scrollToBottom:(id)args
{
    TiThreadPerformOnMainThread(^{
        [(TiUIScrollView *)[self view] scrollToBottom];
    }, YES);
}

-(void) setContentOffset:(id)value withObject:(id)animated
{
    TiThreadPerformOnMainThread(^{
        [(TiUIScrollView *)[self view] setContentOffset_:value withObject:animated];
    }, YES);
}

-(void) setZoomScale:(id)value withObject:(id)animated
{
    TiThreadPerformOnMainThread(^{
        [(TiUIScrollView *)[self view] setZoomScale_:value withObject:animated];
    }, YES);
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView_               // scrolling has ended
{
	if ([self _hasListeners:@"scrollEnd"])
	{	//TODO: Deprecate old event.
		[self fireEvent:@"scrollEnd" withObject:nil];
	}
	if ([self _hasListeners:@"scrollend"])
	{
		[self fireEvent:@"scrollend" withObject:nil];
	}
}

-(void)scrollViewDidScroll:(UIScrollView *)scrollView
{
	CGPoint offset = [scrollView contentOffset];
	if ([self _hasListeners:@"scroll"])
	{
		[self fireEvent:@"scroll" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
				NUMFLOAT(offset.x),@"x",
				NUMFLOAT(offset.y),@"y",
				NUMBOOL([scrollView isDecelerating]),@"decelerating",
				NUMBOOL([scrollView isDragging]),@"dragging",
				nil]];
	}
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(UIView *)view atScale:(float)scale
{
	[self replaceValue:NUMFLOAT(scale) forKey:@"zoomScale" notification:NO];
	
	if ([self _hasListeners:@"scale"])
	{
		[self fireEvent:@"scale" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
											  NUMFLOAT(scale),@"scale",
											  nil]];
	}
}

-(void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
	if([self _hasListeners:@"dragStart"])
	{	//TODO: Deprecate old event
		[self fireEvent:@"dragStart" withObject:nil];
	}
	if([self _hasListeners:@"dragstart"])
	{
		[self fireEvent:@"dragstart" withObject:nil];
	}
}

//listerner which tells when dragging ended in the scroll view.

-(void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
	if([self _hasListeners:@"dragEnd"])
	{	//TODO: Deprecate old event
		[self fireEvent:@"dragEnd" withObject:[NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithBool:decelerate],@"decelerate",nil]]	;
	}
	if([self _hasListeners:@"dragend"])
	{
		[self fireEvent:@"dragend" withObject:[NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithBool:decelerate],@"decelerate",nil]]	;
	}
}

DEFINE_DEF_PROP(scrollsToTop,[NSNumber numberWithBool:YES]);

@end

#endif
