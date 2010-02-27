/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"


//
// this is a re-implementation (sort of) of the UIImageView object used for
// displaying animated images.  The UIImageView object sucks and is very
// problemmatic and we try and solve it here.
//

@interface TiUIImageView : TiUIView 
{
@private
	NSMutableArray *images;
	NSTimer *timer;
	NSTimeInterval interval;
	NSInteger repeatCount;
	NSInteger index;
	NSInteger iterations;
	UIView *previous;
	UIView *container;
	BOOL ready;
	BOOL stopped;
	BOOL reverse;
	BOOL paused;
	BOOL placeholderLoading;
	CGFloat width;
	CGFloat height;
	CGFloat autoHeight;
	CGFloat autoWidth;
	NSInteger loadCount;
	NSInteger readyCount;
	NSInteger loadTotal;
}

-(void)start;
-(void)stop;
-(void)pause;

@end
