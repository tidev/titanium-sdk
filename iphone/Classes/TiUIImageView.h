/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIMAGEVIEW

#import "TiUIView.h"
#import "ImageLoader.h"

//
// this is a re-implementation (sort of) of the UIImageView object used for
// displaying animated images.  The UIImageView object sucks and is very
// problemmatic and we try and solve it here.
//

@interface TiUIImageView : TiUIView <ImageLoaderDelegate>
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
    BOOL canScale;
	TiDimension width;
	TiDimension height;
	CGFloat autoHeight;
	CGFloat autoWidth;
	NSInteger loadCount;
	NSInteger readyCount;
	NSInteger loadTotal;
	UIImageView * imageView;
}

-(void)start;
-(void)stop;
-(void)pause;

-(void)setImage_:(id)arg;


@end

#endif