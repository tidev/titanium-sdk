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

-(CGFloat)autoHeightForSize:(CGSize)size
{
    BOOL flexibleContentWidth = YES;
    if ([self viewAttached]) {
        TiDimension contentWidth = [(TiUIScrollView*)[self view] contentWidth];
        flexibleContentWidth = !TiDimensionIsDip(contentWidth);
        
        // If the content width is NOT flexible, then the size needs to be adjusted
        if (!flexibleContentWidth) {
            // Note that if the contentWidth is smaller than the view bounds, it is enforced to
            // be the view width. See -[TiUIScrollView handleContentSize:].
            size.width = MAX(TiDimensionCalculateValue(contentWidth, size.width), size.width);
        }
    }
    
    if(TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle) && flexibleContentWidth)
    {
        //Horizontal Layout in scrollview is not a traditional horizontal layout. So need an override

        //This is the content width, which is implemented by widgets
        CGFloat contentHeight = -1.0;
        if ([self respondsToSelector:@selector(contentHeightForWidth:)]) {
            contentHeight = [self contentHeightForWidth:size.width];
        }
        
        CGFloat result=0.0;
        CGFloat thisHeight = 0.0;
        pthread_rwlock_rdlock(&childrenLock);
        NSArray* array = windowOpened ? children : pendingAdds;
        
        for (TiViewProxy * thisChildProxy in array)
        {
            thisHeight = [thisChildProxy minimumParentHeightForSize:size];
            if(result<thisHeight) {
                result = thisHeight;
            }
        }
        pthread_rwlock_unlock(&childrenLock);
        
        if (result < contentHeight) {
            result = contentHeight;
        }
        
        if([self respondsToSelector:@selector(verifyHeight:)])
        {
            result = [self verifyHeight:result];
        }
        
        return result;
    }
    else {
        return [super autoHeightForSize:size];
    }
}

-(CGRect)computeChildSandbox:(TiViewProxy*)child withBounds:(CGRect)bounds
{
    BOOL flexibleContentWidth = YES;
    if ([self viewAttached]) {
        //ScrollView calls this with wrapper view bounds. Make sure it is set to the right bound
        bounds = [[self view] bounds];
        
        TiDimension contentWidth = [(TiUIScrollView*)[self view] contentWidth];
        flexibleContentWidth = !TiDimensionIsDip(contentWidth);
        
        // If the content width is NOT flexible, then the bounds need to be adjusted so that they fit the
        // actual content width, rather than the wrapper view bounds.
        if (!flexibleContentWidth) {
            // Note that if the contentWidth is smaller than the view bounds, it is enforced to
            // be the view width. See -[TiUIScrollView handleContentSize:].
            bounds.size.width = MAX(TiDimensionCalculateValue(contentWidth, bounds.size.width), bounds.size.width);
        }
    }
    
    // We only do this if the content width is "flexible" (horizontal will stretch forever.)
    if(TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle) && flexibleContentWidth)
    {
        //Horizontal Layout in scrollview is not a traditional horizontal layout. So need an override
        BOOL followsFillBehavior = TiDimensionIsAutoFill([child defaultAutoWidthBehavior:nil]);
        bounds.origin.x = horizontalLayoutBoundary;
        bounds.origin.y = verticalLayoutBoundary;
        CGFloat boundingValue = bounds.size.width-horizontalLayoutBoundary;
        if (boundingValue < 0) {
            boundingValue = 0;
        }
        //TOP + BOTTOM
        CGFloat offset2 = TiDimensionCalculateValue([child layoutProperties]->top, bounds.size.height)
        + TiDimensionCalculateValue([child layoutProperties]->bottom, bounds.size.height);
        //LEFT + RIGHT
        CGFloat offset = TiDimensionCalculateValue([child layoutProperties]->left, boundingValue)
        + TiDimensionCalculateValue([child layoutProperties]->right, boundingValue);
        
        TiDimension constraint = [child layoutProperties]->width;
        
        if (TiDimensionIsDip(constraint) || TiDimensionIsPercent(constraint))
        {
            //Absolute of total width so leave the sandbox and just increment the boundary
            bounds.size.width =  TiDimensionCalculateValue(constraint, bounds.size.width) + offset;
            horizontalLayoutBoundary += bounds.size.width;
        }
        else if (TiDimensionIsAutoFill(constraint))
        {
            //Fill up the remaining
            bounds.size.width = boundingValue + offset;
            horizontalLayoutBoundary += bounds.size.width;
        }
        else if (TiDimensionIsAutoSize(constraint))
        {
			// allow child to take as much horizontal space as scroll view width
            bounds.size.width = [child autoWidthForSize:CGSizeMake(bounds.size.width,bounds.size.height - offset2)] + offset;
            horizontalLayoutBoundary += bounds.size.width;
        }
        else if (TiDimensionIsAuto(constraint) )
        {
            if (followsFillBehavior) {
                //FILL behavior
                bounds.size.width = boundingValue + offset;
                horizontalLayoutBoundary += bounds.size.width;
            }
            else {
                //SIZE behavior
				// allow child to take as much horizontal space as scroll view width
                bounds.size.width = [child autoWidthForSize:CGSizeMake(bounds.size.width,bounds.size.height - offset2)] + offset;
                horizontalLayoutBoundary += bounds.size.width;
            }
        }
        else if (TiDimensionIsUndefined(constraint))
        {
            if (!TiDimensionIsUndefined([child layoutProperties]->left) && !TiDimensionIsUndefined([child layoutProperties]->centerX) ) {
                CGFloat width = 2 * ( TiDimensionCalculateValue([child layoutProperties]->centerX, boundingValue) - TiDimensionCalculateValue([child layoutProperties]->left, boundingValue) );
                bounds.size.width = width + offset;
                horizontalLayoutBoundary += bounds.size.width;
            }
            else if (!TiDimensionIsUndefined([child layoutProperties]->left) && !TiDimensionIsUndefined([child layoutProperties]->right) ) {
                bounds.size.width = boundingValue + offset;
                horizontalLayoutBoundary += bounds.size.width;
            }
            else if (!TiDimensionIsUndefined([child layoutProperties]->centerX) && !TiDimensionIsUndefined([child layoutProperties]->right) ) {
                CGFloat width = 2 * ( boundingValue - TiDimensionCalculateValue([child layoutProperties]->right, boundingValue) - TiDimensionCalculateValue([child layoutProperties]->centerX, boundingValue));
                bounds.size.width = width + offset;
                horizontalLayoutBoundary += bounds.size.width;
            }
            else if (followsFillBehavior) {
                //FILL behavior
                bounds.size.width = boundingValue + offset;
                horizontalLayoutBoundary += bounds.size.width;
            }
            else {
                //SIZE behavior
				// allow child to take as much horizontal space as scroll view width
                bounds.size.width = [child autoWidthForSize:CGSizeMake(bounds.size.width,bounds.size.height - offset2)] + offset;
                horizontalLayoutBoundary += bounds.size.width;
            }
        }
        
        return bounds;
    }
    else {
        return [super computeChildSandbox:child withBounds:bounds];
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
