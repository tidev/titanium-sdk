/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIWidgetProxy.h"
#import "TiUtils.h"

@implementation TiUIWidgetProxy

@synthesize barButtonItem;

-(void)dealloc
{
	RELEASE_TO_NIL(barButtonItem);
	[super dealloc];
}

-(void)_destroy
{
	RELEASE_TO_NIL(barButtonItem);
	[super _destroy];
}

- (TiUIView *) view;
{
	return [super view];
}

- (TiUIView *)barButtonViewForSize:(CGSize)bounds
{
	isUsingBarButtonItem = YES;
	TiUIView * barButtonView = [self view];
	//TODO: This logic should have a good place in case that refreshLayout is used.
	LayoutConstraint barButtonLayout = layoutProperties;
	if (TiDimensionIsUndefined(barButtonLayout.width))
	{
		barButtonLayout.width = TiDimensionAuto;
	}
	if (TiDimensionIsUndefined(barButtonLayout.height))
	{
		barButtonLayout.height = TiDimensionAuto;
	}
	CGRect barBounds;
	barBounds.origin = CGPointZero;
	barBounds.size = SizeConstraintViewWithSizeAddingResizing(&barButtonLayout, self, bounds, NULL);
	
	[TiUtils setView:barButtonView positionRect:barBounds];
	[barButtonView setAutoresizingMask:UIViewAutoresizingNone];
	
	return barButtonView;
}

- (UIBarButtonItem *) barButtonItem
{
	if (barButtonItem == nil)
	{
		barButtonItem = [[UIBarButtonItem alloc] initWithCustomView:[self barButtonViewForSize:CGSizeZero]];
	}
	return barButtonItem;
}

-(BOOL)supportsNavBarPositioning
{
	return YES;
}

-(void)removeBarButtonView
{
	isUsingBarButtonItem = NO;
	[self setBarButtonItem:nil];
}

- (BOOL) isUsingBarButtonItem
{
	return isUsingBarButtonItem;
}

@end
