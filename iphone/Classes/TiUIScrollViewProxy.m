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

-(void)add:(id)arg
{
	ENSURE_ARG_COUNT(arg,1);
	ENSURE_UI_THREAD_1_ARG(arg);
	
	[super add:arg];
	
	if ([self viewAttached])
	{
		[(TiUIScrollView *)[self view] setNeedsHandleContentSize];
	}
}

-(void)layoutChild:(TiViewProxy*)child bounds:(CGRect)bounds
{
	if (![self viewAttached])
	{
		return;
	}
	TiUIView *childView = [child view];

	[(TiUIScrollView *)[self view] layoutChild:childView];

	[child layoutChildren:childView.bounds];
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
	CGPoint * offset = [scrollView contentOffset];
	TiPoint * offsetPoint = [[TiPoint alloc] initWithPoint:offset];
	[self replaceValue:offset forKey:@"contentOffset" notification:NO];

	[self fireEvent:@"scroll" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
			[NSNumber numberWithFloat:offset.x],@"x",
			[NSNumber numberWithFloat:offset.y],@"y",
			[NSNumber numberWithBool:[scrollView isDecelerating]],@"decelerating",
			[NSNumber numberWithBool:[scrollView isDragging]],@"dragging",
			,nil]];

}

@end
