/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import "TiMediaVideoPlayer.h"
#import "TiUtils.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

@implementation TiMediaVideoPlayer

-(id)initWithPlayer:(MPMoviePlayerController*)controller_ proxy:(TiProxy*)proxy_
{
	if (self = [super initWithFrame:CGRectZero])
	{
		[self setProxy:proxy_];
		[self setMovie:controller_];
	}
	return self;
}

-(void)animationCompleted:(id)note
{
	if (spinner!=nil)
	{
		[spinner stopAnimating];
		[spinner removeFromSuperview];
		RELEASE_TO_NIL(spinner);
	}
}

-(void)movieLoaded
{
	if (spinner!=nil)
	{
		[UIView beginAnimations:@"movieAnimation" context:NULL];
		[UIView setAnimationDelegate:self];
		[UIView setAnimationDidStopSelector:@selector(animationCompleted:)];
		[UIView setAnimationDuration:0.7];
		[spinner setAlpha:0];
		[UIView commitAnimations];
	}
}

-(void)setMovie:(MPMoviePlayerController*)controller_
{
	if (controller!=nil)
	{
		if ([controller_ isEqual:controller])
		{
			// don't add the movie more than once if the same
			return;
		}
		[[controller view] removeFromSuperview];
	}
	RELEASE_TO_NIL(controller);
	controller = [controller_ retain];
	
	[TiUtils setView:[controller view] positionRect:self.bounds];
	[self addSubview:[controller view]];
	[self sendSubviewToBack:[controller view]];

	// show a spinner while the movie is loading so that the user
	// will know something is happening...
	RELEASE_TO_NIL(spinner);
	spinner = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
	spinner.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
	[spinner sizeToFit];
	[spinner setHidesWhenStopped:NO];
	[spinner startAnimating];
	spinner.center = [[controller view] center];
	[[controller view] addSubview:spinner];
}

-(void)dealloc
{
	if (controller!=nil)
	{
		[[controller view] removeFromSuperview];
	}
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(spinner);
	[super dealloc];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	self.frame = CGRectIntegral(self.frame);
	[TiUtils setView:[controller view] positionRect:bounds];
}

@end

#endif

#endif