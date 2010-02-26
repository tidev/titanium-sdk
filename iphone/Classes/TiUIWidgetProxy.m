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

- (TiUIView *)barButtonView
{
	isUsingBarButtonItem = YES;
	return [self view];
}

- (UIBarButtonItem *) barButtonItem
{
	if (barButtonItem == nil)
	{
		UIView * buttonView = [self barButtonView];
		if (CGRectIsEmpty([buttonView bounds]))
		{
			CGRect newBounds;
			newBounds.origin = CGPointZero;
			newBounds.size = [buttonView sizeThatFits:CGSizeZero];
			float width = [TiUtils floatValue:[self valueForKey:@"width"]];
			if (width > 1.0) {
				newBounds.size.width = width;
			}
			[buttonView setBounds:newBounds];
		}
		barButtonItem = [[UIBarButtonItem alloc] initWithCustomView:buttonView];
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
