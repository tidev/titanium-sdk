/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUISliderProxy.h"

@implementation TiUISliderProxy

- (IBAction)sliderChanged:(id)sender
{
	NSNumber * newValue = [NSNumber numberWithFloat:[(UISlider *)sender value]];
	[self replaceValue:newValue forKey:@"value" notification:NO];

	//No need to setValue, because it's already been set.
	if ([self _hasListeners:@"change"])
	{
		[self fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
	}
}

@end
