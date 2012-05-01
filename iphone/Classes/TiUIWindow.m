/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIWindow.h"
#import "TiUIWindowProxy.h"

@implementation TiUIWindow

- (void) dealloc
{
	RELEASE_TO_NIL(gradientWrapperView);
	[super dealloc];
}


-(UIView *)gradientWrapperView
{
	if (gradientWrapperView == nil)
	{
		gradientWrapperView = [[UIView alloc] initWithFrame:[self bounds]];
		[gradientWrapperView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
		[self insertSubview:gradientWrapperView atIndex:0];
	}

	return gradientWrapperView;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    [super frameSizeChanged:frame bounds:bounds];
    //If we have a titleControl it needs to be resized for new navbar bounds
    id titleControlProxy = [[self proxy] valueForKey:@"titleControl"];
    if ([titleControlProxy isKindOfClass:[TiViewProxy class]]) {
        //Need the delay so that we get the right navbar bounds
        [(TiUIWindowProxy*)[self proxy] performSelector:@selector(_updateTitleView) withObject:nil afterDelay:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration] ];
    }
}


@end

