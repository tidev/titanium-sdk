/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiMediaVideoPlayer.h"

#import "TiUtils.h"

#ifdef IPAD

@implementation TiMediaVideoPlayer

-(id)initWithPlayer:(MPMoviePlayerController*)controller_
{
	if (self = [super initWithFrame:CGRectZero])
	{
		controller = [controller_ retain];
		[self addSubview:[controller view]];
		[self sendSubviewToBack:[controller view]];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(controller);
	[super dealloc];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	self.frame = CGRectIntegral(self.frame);
	[TiUtils setView:[controller view] positionRect:bounds];
}

@end

#endif
