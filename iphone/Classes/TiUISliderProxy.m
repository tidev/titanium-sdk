/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISLIDER

#import "TiUISliderProxy.h"

NSArray* sliderKeySequence;

@implementation TiUISliderProxy

-(NSArray *)keySequence
{
	if (sliderKeySequence == nil)
	{
		sliderKeySequence = [[NSArray arrayWithObjects:@"min",@"max",@"value",nil] retain];
	}
	return sliderKeySequence;
}

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~UIViewAutoresizingFlexibleHeight;
}

USE_VIEW_FOR_VERIFY_HEIGHT

@end

#endif