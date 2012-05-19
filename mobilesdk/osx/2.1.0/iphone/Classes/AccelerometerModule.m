/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_ACCELEROMETER

#import "AccelerometerModule.h"


@implementation AccelerometerModule

-(void)_listenerAdded:(NSString *)type count:(int)count
{
	if (count == 1 && [type isEqualToString:@"update"])
	{
		[[UIAccelerometer sharedAccelerometer] setDelegate:self];
	}
}

-(void)_listenerRemoved:(NSString *)type count:(int)count
{
	if (count == 0 && [type isEqualToString:@"update"])
	{
		[[UIAccelerometer sharedAccelerometer] setDelegate:nil];
	}
}

#pragma mark Accelerometer Delegate

- (void)accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration
{
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
						   NUMFLOAT([acceleration x]), @"x",
						   NUMFLOAT([acceleration y]), @"y",
						   NUMFLOAT([acceleration z]), @"z",
						   NUMLONGLONG([acceleration timestamp] * 1000), @"timestamp",
						   nil];
	[self fireEvent:@"update" withObject:event];
}


@end

#endif