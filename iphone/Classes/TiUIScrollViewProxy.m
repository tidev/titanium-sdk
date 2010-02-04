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


-(void)layoutChild:(TiViewProxy*)child bounds:(CGRect)bounds
{
	if (![self viewAttached])
	{
		return;
	}

	// layout out ourself
	UIView *childView = [child view];

//	if ([childView superview]!=view)
//	{
//		[view addSubview:childView];
//	}
	
	LayoutConstraint layout;
	ReadConstraintFromDictionary(&layout,[child allProperties],NULL);
	[[child view] updateLayout:&layout withBounds:bounds];
	
	// tell our children to also layout
	[child layoutChildren:childView.bounds];
}


@end
