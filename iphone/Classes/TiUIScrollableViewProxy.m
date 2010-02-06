/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIScrollableViewProxy.h"

#import "TiUIScrollableView.h"
#import "TiUtils.h"

@implementation TiUIScrollableViewProxy
@synthesize pageIndex;

- (void) dealloc
{
	RELEASE_TO_NIL(views);
	[super dealloc];
}

#pragma mark Accessors

-(NSArray *)views
{
	return [views copy];
}

-(int)countOfViews
{
	return [views count];
}

-(TiViewProxy *)objectInViewsAtIndex:(int)index
{
	if ((index < 0) || (index >= [views count]))
	{
		return nil;
	}
	return [views objectAtIndex:index];
}


-(void)setViews:(NSArray *)newViews
{
	[views autorelease];
	views = [newViews mutableCopy];
	NSLog(@"Setting views %@",views);
	if ([self viewAttached])
	{
		[(TiUIScrollableView *)[self view] performSelectorOnMainThread:@selector(resetSubViews) withObject:nil waitUntilDone:NO];
	}
}

-(void)addView:(id)args //Arg 1: view to add.
{
	ENSURE_ARG_COUNT(args,1);
	TiViewProxy * newView = [args objectAtIndex:0];
	ENSURE_TYPE(newView,TiViewProxy);

	if (views == nil)
	{
		views = [[NSMutableArray alloc] initWithObjects:newView,nil];
	}
	else
	{
		[views addObject:newView];
	}

	if ([self viewAttached])
	{
		[(TiUIScrollableView *)[self view] performSelectorOnMainThread:@selector(resetSubViews) withObject:nil waitUntilDone:NO];
	}
}

-(void)scrollToView:(id)args //Arg 1: Integer or view to scroll to.
{
	ENSURE_ARG_COUNT(args,1);
	id scrolledView = [args objectAtIndex:0];
	
	int newPageIndex;
	
	if ([scrolledView respondsToSelector:@selector(intValue)])
	{
		newPageIndex = [scrolledView intValue];

		if ((newPageIndex < 0) || (newPageIndex >= [views count]))
		{
			[self throwException:TiExceptionRangeError subreason:
					[NSString stringWithFormat:@"Page %d is not within 0 and %d",
					newPageIndex,[views count]] location:CODELOCATION];
		}
	}
	else
	{
		newPageIndex = [views indexOfObject:scrolledView];
		if (newPageIndex == NSNotFound)
		{
			[self throwException:TiExceptionInvalidType subreason:
					[NSString stringWithFormat:@"%@ was not found in the views",
					scrolledView] location:CODELOCATION];			
		}
	}
	
	if ([self viewAttached])
	{
		[(TiUIScrollableView *)[self view] scrollToPageNumber:[NSNumber numberWithInt:newPageIndex]];
	}
	else
	{
		pageIndex = newPageIndex;
	}

}


-(void)fireScrollEvent:(int)newIndex
{
	if (pageIndex == newIndex)
	{
		return;
	}
	pageIndex = newIndex;

	if ([self _hasListeners:@"scroll"])
	{
		[self fireEvent:@"scroll" withObject:[NSDictionary dictionaryWithObjectsAndKeys:
				[NSNumber numberWithInt:newIndex],@"currentPage",
				[views objectAtIndex:newIndex],@"view",nil]]; 
	}
}



@end
