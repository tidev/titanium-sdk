/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIScrollViewProxy.h"
#import "TiUIScrollView.h"

#import "TiUtils.h"

@implementation TiUIScrollViewProxy

-(void)_initWithProperties:(NSDictionary *)properties
{
	// set the initial scale to 1.0 which is the default
	[self replaceValue:NUMFLOAT(1.0) forKey:@"scale" notification:NO];
	[super _initWithProperties:properties];
}


-(void)childAdded:(id)child
{
	if ([self viewAttached])
	{
		[(TiUIScrollView *)[self view] setNeedsHandleContentSize];
	}
}

-(void)childRemoved:(id)child
{
	if ([self viewAttached])
	{
		[(TiUIScrollView *)[self view] setNeedsHandleContentSize];
	}
}

-(void)layoutChildren
{
	if (![self viewAttached])
	{
		return;
	}

	if (![(TiUIScrollView *)[self view] handleContentSizeIfNeeded])
	{
		[super layoutChildren];
	}
}

-(BOOL)willBeRelaying
{
	return [super willBeRelaying]; // || 
}

-(void)childWillResize:(TiViewProxy *)child
{
	[super childWillResize:child];
	[(TiUIScrollView *)[self view] setNeedsHandleContentSizeIfAutosizing];
}

-(void)layoutChild:(TiViewProxy*)child
{
	if (![self viewAttached])
	{
		return;
	}

	UIView * wrapperView = [(TiUIScrollView *)[self view] wrapperView];

	CGRect bounds = [wrapperView bounds];

	// layout out ourself
	UIView *childView = [child view];

	if ([childView superview]!=wrapperView)
	{
		[wrapperView addSubview:childView];
		[(TiUIScrollView *)[self view] setNeedsHandleContentSize];
	}
	
	if(TiLayoutRuleIsVertical(layoutProperties.layout)){
		bounds.origin.y += verticalLayoutBoundary;
		bounds.size.height = [child minimumParentHeightForWidth:bounds.size.width];
		verticalLayoutBoundary += bounds.size.height;
	}
	[[child view] relayout:bounds];
	
	// tell our children to also layout
	[child layoutChildren];
}

-(void)scrollTo:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	TiPoint * offset = [[TiPoint alloc] initWithPoint:CGPointMake(
			[TiUtils floatValue:[args objectAtIndex:0]],
			[TiUtils floatValue:[args objectAtIndex:1]])];

	[self replaceValue:offset forKey:@"contentOffset" notification:YES];
}


-(void)scrollViewDidScroll:(UIScrollView *)scrollView
{
	CGPoint offset = [scrollView contentOffset];
	TiPoint * offsetPoint = [[TiPoint alloc] initWithPoint:offset];
	[self replaceValue:offsetPoint forKey:@"contentOffset" notification:NO];

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
	[self replaceValue:NUMFLOAT(scale) forKey:@"scale" notification:NO];
	
	if ([self _hasListeners:@"scale"])
	{
		[self fireEvent:@"scale" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
											  NUMFLOAT(scale),@"scale",
											  nil]];
	}
}

@end
