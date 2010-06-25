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

-(void)_initWithProperties:(NSDictionary *)properties
{
	[self replaceValue:NUMINT(0) forKey:@"currentPage" notification:NO];
	[self replaceValue:NUMFLOAT(1) forKey:@"minZoomScale" notification:NO];
	[self replaceValue:NUMFLOAT(1) forKey:@"maxZoomScale" notification:NO];
	[super _initWithProperties:properties];
}

-(void)scrollToView:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	[[self view] performSelectorOnMainThread:@selector(scrollToView:) withObject:args waitUntilDone:NO];
}

-(void)addView:(id)args
{
	ENSURE_SINGLE_ARG(args,TiViewProxy);
	[[self view] performSelectorOnMainThread:@selector(addView:) withObject:args waitUntilDone:NO];
}

-(void)removeView:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	[[self view] performSelectorOnMainThread:@selector(removeView:) withObject:args waitUntilDone:NO];
}

-(void)childWillResize:(TiViewProxy *)child
{
	[self lockChildrenForReading];
		BOOL hasChild = [[self children] containsObject:child];
	[self unlockChildren];

	if (!hasChild)
	{
		return;
		//In the case of views added with addView, as they are not part of children, they should be ignored.
	}
	[super childWillResize:child];
}



@end

#endif