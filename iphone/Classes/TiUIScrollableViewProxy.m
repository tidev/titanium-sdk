/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLABLEVIEW

#import "TiUIScrollableViewProxy.h"
#import "TiUIScrollableView.h"

@implementation TiUIScrollableViewProxy
@synthesize viewProxies;

-(void)_initWithProperties:(NSDictionary *)properties
{
	pthread_rwlock_init(&viewsLock, NULL);
	[self replaceValue:NUMINT(0) forKey:@"currentPage" notification:NO];
	[super _initWithProperties:properties];
}

- (void) dealloc
{
	pthread_rwlock_destroy(&viewsLock);
	[viewProxies makeObjectsPerformSelector:@selector(setParent:) withObject:nil];
	[viewProxies release];
	[super dealloc];
}

-(void)lockViews
{
	pthread_rwlock_rdlock(&viewsLock);
}

-(void)lockViewsForWriting
{
	pthread_rwlock_wrlock(&viewsLock);
}

-(void)unlockViews
{
	pthread_rwlock_unlock(&viewsLock);
}

-(NSArray *)views
{
	[self lockViews];
	NSArray * result = [viewProxies copy];
	[self unlockViews];
	return [result autorelease];
}

-(int)viewCount
{
	[self lockViews];
	int result = [viewProxies count];
	[self unlockViews];
	return result;
}

-(void)setViews:(id)args
{
	ENSURE_ARRAY(args);
	for (id newViewProxy in args)
	{
		[self rememberProxy:newViewProxy];
		[newViewProxy setParent:self];
	}
	[self lockViewsForWriting];
	for (id oldViewProxy in viewProxies)
	{
		if (![args containsObject:oldViewProxy])
		{
			[oldViewProxy setParent:nil];
			[oldViewProxy performSelectorOnMainThread:@selector(detachView) withObject:nil waitUntilDone:NO];
			[self forgetProxy:oldViewProxy];			
		}
	}
	[viewProxies autorelease];
	viewProxies = [args mutableCopy];
	[self unlockViews];
	[self replaceValue:args forKey:@"views" notification:YES];
}

-(void)addView:(id)args
{
	ENSURE_SINGLE_ARG(args,TiViewProxy);

	[self lockViewsForWriting];
	[self rememberProxy:args];
	[args setParent:self];
	if (viewProxies != nil)
	{
		[viewProxies addObject:args];
	}
	else
	{
		viewProxies = [[NSMutableArray alloc] initWithObjects:args,nil];
	}
	[self unlockViews];	
	[self makeViewPerformSelector:@selector(addView:) withObject:args createIfNeeded:YES waitUntilDone:NO];
}

-(void)removeView:(id)args
{	//TODO: Refactor this properly.
	ENSURE_SINGLE_ARG(args,NSObject);

	[self lockViewsForWriting];
	TiViewProxy * doomedView;
	if ([args isKindOfClass:[TiViewProxy class]])
	{
		doomedView = args;

		if (![viewProxies containsObject:doomedView])
		{
			[self unlockViews];
			[self throwException:@"view not in the scrollableView" subreason:nil location:CODELOCATION];
			return;
		}
	}
	else if ([args respondsToSelector:@selector(intValue)])
	{
		int doomedIndex = [args intValue];
		if ((doomedIndex >= 0) && (doomedIndex < [viewProxies count]))
		{
			doomedView = [viewProxies objectAtIndex:doomedIndex];
		}
		else
		{
			[self unlockViews];
			[self throwException:TiExceptionRangeError subreason:@"invalid view index" location:CODELOCATION];
			return;
		}
	}
	else
	{
		[self unlockViews];
		[self throwException:TiExceptionInvalidType subreason:
				[NSString stringWithFormat:@"argument needs to be a number or view, but was %@ instead.",
				[args class]] location:CODELOCATION];
		return;
	}

	[doomedView performSelectorOnMainThread:@selector(detachView) withObject:nil waitUntilDone:NO];
	[self forgetProxy:args];
	[viewProxies removeObject:args];
	[self unlockViews];	

	[[self view] performSelectorOnMainThread:@selector(removeView:) withObject:args waitUntilDone:NO];
}

-(void)scrollToView:(id)args
{	//TODO: Refactor this properly.
	ENSURE_SINGLE_ARG(args,NSObject);
	[[self view] performSelectorOnMainThread:@selector(scrollToView:) withObject:args waitUntilDone:NO];
}

-(void)childWillResize:(TiViewProxy *)child
{
	BOOL hasChild = [[self children] containsObject:child];

	if (!hasChild)
	{
		return;
		//In the case of views added with addView, as they are not part of children, they should be ignored.
	}
	[super childWillResize:child];
}

-(TiViewProxy *)viewAtIndex:(int)index
{
	[self lockViews];
	// force index to be in range in case the scrollable view is rotated while scrolling
	if (index < 0) {
		index = 0;
	} else if (index >= [viewProxies count]) {
		index = [viewProxies count] - 1;
	}
	TiViewProxy * result = [viewProxies objectAtIndex:index];
	[self unlockViews];
	return result;
}

-(UIView *)parentViewForChild:(TiViewProxy *)child
{
	[self lockViews];
	int index = [viewProxies indexOfObject:child];
	[self unlockViews];
	
	if (index != NSNotFound)
	{
		TiUIScrollableView * ourView = (TiUIScrollableView *)[self view];
		NSArray * scrollWrappers = [[ourView scrollview] subviews];
		if (index < [scrollWrappers count])
		{
			return [scrollWrappers objectAtIndex:index];
		}
		//Hideous hack is hideous. This should stave off the bugs until layout is streamlined
		[ourView refreshScrollView:[[self view] bounds] readd:YES];
		scrollWrappers = [[ourView scrollview] subviews];
		if (index < [scrollWrappers count])
		{
			return [scrollWrappers objectAtIndex:index];
		}
	}
	//TODO: Generate the view?
	return [super parentViewForChild:child];
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    if ([self viewAttached]) {
        [(TiUIScrollableView*)[self view] manageRotation];
    }
}

@end

#endif