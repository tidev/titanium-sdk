/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIMAGEVIEW

#import "TiBase.h"
#import "TiUIImageView.h"
#import "TiUtils.h"
#import "ImageLoader.h"
#import "OperationQueue.h"
#import "TiViewProxy.h"
#import "TiProxy.h"
#import "TiBlob.h"
#import "TiFile.h"
#import "UIImage+Resize.h"
#import "TiUIImageViewProxy.h"

#define IMAGEVIEW_DEBUG 0

@implementation TiUIImageView

#pragma mark Internal

DEFINE_EXCEPTIONS

-(void)dealloc
{
	if (timer!=nil)
	{
		[timer invalidate];
	}
	RELEASE_TO_NIL(timer);
	RELEASE_TO_NIL(images);
	RELEASE_TO_NIL(container);
	RELEASE_TO_NIL(previous);
	RELEASE_TO_NIL(imageView);
	[super dealloc];
}

-(CGFloat)autoWidthForWidth:(CGFloat)suggestedWidth
{
	if (autoWidth > 0)
	{
		return autoWidth;
	}
	
	CGFloat calculatedWidth = TiDimensionCalculateValue(width, autoWidth);
	if (calculatedWidth > 0)
	{
		return calculatedWidth;
	}
	
	if (container!=nil)
	{
		return container.bounds.size.width;
	}
	
	return 0;
}

-(CGFloat)autoHeightForWidth:(CGFloat)width_
{
	if (autoHeight > 0)
	{
		return autoHeight;
	}
	
	CGFloat calculatedHeight = TiDimensionCalculateValue(height, autoHeight);
	if (calculatedHeight > 0)
	{
		return calculatedHeight;
	}
	
	if (container!=nil)
	{
		return container.bounds.size.height;
	}
	
	return 0;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	for (UIView *child in [self subviews])
	{
		[TiUtils setView:child positionRect:bounds];
	}
	if (container!=nil)
	{
		for (UIView *child in [container subviews])
		{
			[TiUtils setView:child positionRect:bounds];
		}
	}
    [super frameSizeChanged:frame bounds:bounds];
}

-(void)timerFired:(id)arg
{
	if (stopped) {
		return;
	}
	
	// don't let the placeholder stomp on our new images
	placeholderLoading = NO;
	
	NSInteger position = index % loadTotal;
	NSInteger nextIndex = (reverse) ? --index : ++index;
	
	if (position<0)
	{
		position=loadTotal-1;
		index=position-1;
	}
	UIView *view = [[container subviews] objectAtIndex:position];

	// see if we have an activity indicator... if we do, that means the image hasn't yet loaded
	// and we want to start the spinner to let the user know that we're still loading. we 
	// don't initially start the spinner when added since we don't want to prematurely show
	// the spinner (usually for the first image) and then immediately remove it with a flash
	UIView *spinner = [[view subviews] count] > 0 ? [[view subviews] objectAtIndex:0] : nil;
	if (spinner!=nil && [spinner isKindOfClass:[UIActivityIndicatorView class]])
	{
		[(UIActivityIndicatorView*)spinner startAnimating];
		[view bringSubviewToFront:spinner];
	}
	
	// the container sits on top of the image in case the first frame (via setUrl) is first
	[self bringSubviewToFront:container];
	
	view.hidden = NO;

	if (previous!=nil)
	{
		previous.hidden = YES;
		RELEASE_TO_NIL(previous);
	}
	
	previous = [view retain];

	if ([self.proxy _hasListeners:@"change"])
	{
		NSDictionary *evt = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:position] forKey:@"index"];
		[self.proxy fireEvent:@"change" withObject:evt];
	}
	
	if (repeatCount > 0 && ((reverse==NO && nextIndex == loadTotal) || (reverse && nextIndex==0)))
	{
		iterations++;
		if (iterations == repeatCount)
		{
			[timer invalidate];
			RELEASE_TO_NIL(timer);
			if ([self.proxy _hasListeners:@"stop"])
			{
				[self.proxy fireEvent:@"stop" withObject:nil];
			}
		}
	}
}

-(void)queueImage:(id)img index:(int)index_
{
	UIView *view = [[UIView alloc] initWithFrame:self.bounds];
	UIActivityIndicatorView *spinner = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
	
	spinner.center = view.center;
	spinner.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleBottomMargin;			
	
	[view addSubview:spinner];
	[container addSubview:view];
	[view release];
	[spinner release];
	
	[images addObject:img];
	[[OperationQueue sharedQueue] queue:@selector(loadImageInBackground:) target:self arg:[NSNumber numberWithInt:index_] after:nil on:nil ui:NO];
}

-(void)startTimerWithEvent:(NSString *)eventName
{
	RELEASE_TO_NIL(timer);
	if (stopped)
	{
		return;
	}
	timer = [[NSTimer scheduledTimerWithTimeInterval:interval target:self selector:@selector(timerFired:) userInfo:nil repeats:YES] retain]; 
	if ([self.proxy _hasListeners:eventName])
	{
		[self.proxy fireEvent:eventName withObject:nil];
	}
}

-(void)stopTimerWithEvent:(NSString *)eventName
{
    if (!stopped) {
        return;
    }
	if (timer != nil) {
		[timer invalidate];
		RELEASE_TO_NIL(timer);
		if ([self.proxy _hasListeners:eventName]) {
			[self.proxy fireEvent:eventName withObject:nil];
		}
	}
}

-(void)fireLoadEventWithState:(NSString *)stateString
{
	if (![self.proxy _hasListeners:@"load"])
	{
		return;
	}

	NSDictionary *event = [NSDictionary dictionaryWithObject:stateString forKey:@"state"];
	[self.proxy fireEvent:@"load" withObject:event];
}

-(UIImage*)scaleImageIfRequired:(UIImage*)theimage
{
	UIImage* newImage = theimage;
	// attempt to scale the image
	
	CGFloat calculatedWidth;
	CGFloat calculatedHeight;
	
	if (!TiDimensionIsUndefined(width) || !TiDimensionIsUndefined(height))
	{
		if (!(calculatedWidth = TiDimensionCalculateValue(width, autoWidth))) {
			calculatedWidth = autoWidth;
		}
		
		if (!(calculatedHeight = TiDimensionCalculateValue(height, autoHeight))) {
			calculatedHeight = autoHeight;
		}
		
		calculatedWidth = (calculatedWidth != 0.0) ? calculatedWidth : newImage.size.width;
		calculatedHeight = (calculatedHeight != 0.0) ? calculatedHeight : newImage.size.height;
		newImage = [UIImageResize resizedImage:CGSizeMake(calculatedWidth, calculatedHeight) 
						  interpolationQuality:kCGInterpolationDefault 
										 image:theimage
										 hires:[TiUtils boolValue:[[self proxy] valueForKey:@"hires"]]];
	}
	return newImage;
}

-(void)setImageOnUIThread:(NSArray*)args
{
	UIImage *theimage = [self scaleImageIfRequired:[args objectAtIndex:0]];
	NSNumber *pos = [args objectAtIndex:1];
	int position = [TiUtils intValue:pos];
	
	UIView *view = [[container subviews] objectAtIndex:position];
	UIImageView *newImageView = [[UIImageView alloc] initWithImage:theimage];
	
	// remove the spinner now that we've loaded our image
	UIView *spinner = [[view subviews] count] > 0 ? [[view subviews] objectAtIndex:0] : nil;
	if (spinner!=nil && [spinner isKindOfClass:[UIActivityIndicatorView class]])
	{
		[spinner removeFromSuperview];
	}
	
	[view addSubview:newImageView];
	[newImageView release];
	view.hidden = YES;
	
#if IMAGEVIEW_DEBUG	== 1
	UILabel *label = [[UILabel alloc] initWithFrame:CGRectMake(10, 10, 50, 20)];
	label.text = [NSString stringWithFormat:@"%d",position];
	label.font = [UIFont boldSystemFontOfSize:28];
	label.textColor = [UIColor redColor];
	label.backgroundColor = [UIColor clearColor];
	[view addSubview:label];
	[view bringSubviewToFront:label];
	[label release];
#endif	
	
	loadCount++;
	if (loadCount==loadTotal)
	{
		[self fireLoadEventWithState:@"images"];
	}
	
	if (ready)
	{
		//NOTE: for now i'm just making sure you have at least one frame loaded before starting the timer
		//but in the future we may want to be more sophisticated
		int min = 1;  
		readyCount++;
		if (readyCount >= min)
		{
			readyCount = 0;
			ready = NO;
			
			[self startTimerWithEvent:@"start"];
		}
	}
}

-(void)animationCompleted:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context
{
	for (UIView *view in [self subviews])
	{
		// look for our alpha view which is the placeholder layer
		if (view.alpha == 0)
		{
			[view removeFromSuperview];
			break;
		}
	}
}


-(UIImageView *)imageView
{
	if (imageView==nil)
	{
		imageView = [[UIImageView alloc] initWithFrame:[self bounds]];
		[imageView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[imageView setContentMode:UIViewContentModeScaleAspectFit];
		[self addSubview:imageView];
	}
	return imageView;
}

-(void)setURLImageOnUIThread:(UIImage*)image
{
	ENSURE_UI_THREAD(setURLImageOnUIThread,image);
	if (self.proxy==nil)
	{
		// this can happen after receiving an async callback for loading the image
		// but after we've detached our view.  In which case, we need to just ignore this
		return;
	}
	UIImageView *iv = [self imageView];
	iv.image = image;
	if (placeholderLoading)
	{
		iv.autoresizingMask = UIViewAutoresizingNone;
		iv.contentMode = UIViewContentModeScaleAspectFit;
		iv.alpha = 0;
		
		[(TiViewProxy *)[self proxy] contentsWillChange];
		
		// do a nice fade in animation to replace the new incoming image
		// with our placeholder
		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationDuration:0.5];
		[UIView setAnimationDelegate:self];
		[UIView setAnimationDidStopSelector:@selector(animationCompleted:finished:context:)];
		
		for (UIView *view in [self subviews])
		{
			if (view!=iv)
			{	
				[view setAlpha:0];
			}
		}
		
		iv.alpha = 1;
		
		[UIView commitAnimations];
		
		placeholderLoading = NO;
		[self fireLoadEventWithState:@"url"];
	}
}

-(void)loadURLImageInBackground:(NSURL*)url
{
	UIImage *image = [[ImageLoader sharedLoader] loadRemote:url];
	
	CGSize fullSize = [[ImageLoader sharedLoader] fullImageSize:url];
	autoHeight = fullSize.height;
	autoWidth = fullSize.width;
	
	image = [self scaleImageIfRequired:image];
	[self performSelectorOnMainThread:@selector(setURLImageOnUIThread:) withObject:image waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
}

-(void)loadImageInBackground:(NSNumber*)pos
{
	int position = [TiUtils intValue:pos];
	NSURL *theurl = [TiUtils toURL:[images objectAtIndex:position] proxy:self.proxy];
	UIImage *theimage = [[ImageLoader sharedLoader] loadImmediateImage:theurl];
	if (theimage==nil)
	{
		theimage = [[ImageLoader sharedLoader] loadRemote:theurl];
	}
	if (theimage!=nil)
	{
		[self performSelectorOnMainThread:@selector(setImageOnUIThread:)
				withObject:[NSArray arrayWithObjects:theimage,pos,nil]
				waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
	}
	else 
	{
		NSLog(@"[ERROR] couldn't load imageview image: %@ at position: %d",theurl,position);
	}
}

-(void)removeAllImagesFromContainer
{
	// remove any existing images
	if (container!=nil)
	{
		for (UIView *view in [container subviews])
		{
			[view removeFromSuperview];
		}
	}
	if (imageView!=nil)
	{
		imageView.image = nil;
	}
}

-(void)cancelPendingImageLoads
{
	// cancel a pending request if we have one pending
	[(TiUIImageViewProxy *)[self proxy] cancelPendingImageLoads];
	placeholderLoading = NO;
}

-(void)loadUrl:(id)img
{
	[self cancelPendingImageLoads];
	
	if (img!=nil)
	{
		[self removeAllImagesFromContainer];
		
		NSURL *url_ = [TiUtils toURL:[img absoluteString] proxy:self.proxy];
		
		// NOTE: Loading from URL means we can't pre-determine any % value.
		CGSize imageSize = CGSizeMake(TiDimensionCalculateValue(width, 0.0), 
									  TiDimensionCalculateValue(height,0.0));
		if ([TiUtils boolValue:[[self proxy] valueForKey:@"hires"]])
		{
			imageSize.width *= 2;
			imageSize.height *= 2;
		}
		
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url_ withSize:imageSize];
		if (image==nil)
		{
			// use a placeholder image - which the dev can specify with the
			// defaultImage property or we'll provide the Titanium stock one
			// if not specified
			NSURL *defURL = [TiUtils toURL:[self.proxy valueForKey:@"defaultImage"] proxy:self.proxy];
			
			if ((defURL == nil) && ![TiUtils boolValue:[self.proxy valueForKey:@"preventDefaultImage"] def:NO])
			{	//This is a special case, because it IS built into the bundle despite being in the simulator.
				NSString * filePath = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:@"modules/ui/images/photoDefault.png"];
				defURL = [NSURL fileURLWithPath:filePath];
			}
			if (defURL!=nil)
			{
				UIImage *poster = [[ImageLoader sharedLoader] loadImmediateImage:defURL withSize:imageSize];
				
				// TODO: Use the full image size here?  Auto width/height is going to be changed once the image is loaded.
				autoWidth = poster.size.width;
				autoHeight = poster.size.height;
				[self imageView].image = poster;
			}
			placeholderLoading = YES;
			[(TiUIImageViewProxy *)[self proxy] startImageLoad:url_];
			return;
		}
		if (image!=nil)
		{
            [(TiUIImageViewProxy*)[self proxy] setImageURL:url_];
			CGSize fullSize = [[ImageLoader sharedLoader] fullImageSize:img];
			autoWidth = fullSize.width;
			autoHeight = fullSize.height;
			
			[self imageView].image = image;
			[self fireLoadEventWithState:@"url"];
		}
		else 
		{
			NSLog(@"[ERROR] couldn't find image for ImageView at: %@",img);
		}
	}
}


-(UIView*)container
{
	if (container==nil)
	{
		// we use a separate container view so we can both have an image
		// and a set of images
		container = [[UIView alloc] initWithFrame:self.bounds];
		container.userInteractionEnabled = NO;
		[self addSubview:container];
	}
	return container;
}

-(UIImage*)convertToUIImage:(id)arg
{
	UIImage *image = nil;
	
	if ([arg isKindOfClass:[TiBlob class]])
	{
		TiBlob *blob = (TiBlob*)arg;
		
		autoHeight = [[blob image] size].height;
		autoWidth = [[blob image] size].width;
		
		image = [self scaleImageIfRequired:[blob image]];
	}
	else if ([arg isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)arg;
		NSURL * fileUrl = [NSURL fileURLWithPath:[file path]];
		
		CGSize fullSize = [[ImageLoader sharedLoader] fullImageSize:fileUrl];
		autoHeight = fullSize.height;
		autoWidth = fullSize.width;
		
		image = [[ImageLoader sharedLoader] loadImmediateImage:fileUrl withSize:CGSizeMake(TiDimensionCalculateValue(width, autoWidth),
																						   TiDimensionCalculateValue(height, autoHeight))];
	}
	else if ([arg isKindOfClass:[NSString class]]) {
		NSURL *url_ = [TiUtils toURL:arg proxy:self.proxy];

//	TODO: Move this over into ImageLoader or some other way to more intellegently cache large files.
		UIImage * testImage = [UIImage imageWithContentsOfFile:[url_ path]];
		if (testImage != nil)
		{
			CGSize fullSize = [testImage size];
			autoHeight = fullSize.height;
			autoWidth = fullSize.width;
			return testImage;
		}
//	END TODO

		CGSize fullSize = [[ImageLoader sharedLoader] fullImageSize:url_];
		autoHeight = fullSize.height;
		autoWidth = fullSize.width;
		
		image = [[ImageLoader sharedLoader] loadImmediateImage:url_ withSize:CGSizeMake(TiDimensionCalculateValue(width, autoWidth), 
																						TiDimensionCalculateValue(height, autoHeight))];
        
        if (image != nil) {
            [(TiUIImageViewProxy*)[self proxy] setImageURL:url_];
        }
	}
	else if ([arg isKindOfClass:[UIImage class]])
	{
		// called within this class
		image = (UIImage*)arg; 
		image = [self scaleImageIfRequired:image];
	}
	
	return image;
}

#pragma mark Public APIs

-(void)stop
{
	stopped = YES;
    [self stopTimerWithEvent:@"stop"];
	ready = NO;
	index = -1;
	[self.proxy replaceValue:NUMBOOL(NO) forKey:@"animating" notification:NO];
}

-(void)start
{
	stopped = NO;
	
	if (interval <= 0)
	{
		// use a (bad) calculation to determine how fast to rotate assuming 30 frames
		// and then figuring out how many frames they have evenly.  this really just
		// means the developers need to give us the frame rate or we'll do a poor job
		// of guessing
		interval = (1.0/30.0)*(30.0/loadTotal);
	}
	
	[self.proxy replaceValue:NUMBOOL(NO) forKey:@"paused" notification:NO];
	
	if (iterations<0)
	{
		iterations = 0;
	}
	
	if (index<0)
	{
		if (reverse)
		{
			index = loadTotal-1;
		}
		else
		{
			index = 0;
		}
	}
	
	
	// refuse to start animation if you don't have any images
	if (loadTotal > 0)
	{
		ready = YES;
		[self.proxy replaceValue:NUMBOOL(YES) forKey:@"animating" notification:NO];
		
		if (timer==nil)
		{
			readyCount = 0;
			ready = NO;
			[self startTimerWithEvent:@"start"];
		}
	}
}

-(void)pause
{
	stopped = YES;
	[self.proxy replaceValue:NUMBOOL(YES) forKey:@"paused" notification:NO];
	[self.proxy replaceValue:NUMBOOL(NO) forKey:@"animating" notification:NO];
    [self stopTimerWithEvent:@"pause"];
}

-(void)resume
{
	stopped = NO;
	[self.proxy replaceValue:NUMBOOL(NO) forKey:@"paused" notification:NO];
	[self.proxy replaceValue:NUMBOOL(YES) forKey:@"animating" notification:NO];
    [self startTimerWithEvent:@"resume"];
}

-(void)setWidth_:(id)width_
{
	width = TiDimensionFromObject(width_);
	if (imageView != nil) {
		[self setImage_:[self scaleImageIfRequired:[imageView image]]];
	}
}

-(void)setHeight_:(id)height_
{
	height = TiDimensionFromObject(height_);
	if (imageView != nil) {
		[self setImage_:[self scaleImageIfRequired:[imageView image]]];
	}
}

-(void)setImage_:(id)arg
{
	id currentImage = [self.proxy valueForUndefinedKey:@"image"];
	
	UIImageView *imageview = [self imageView];
	
	[self removeAllImagesFromContainer];
	[self cancelPendingImageLoads];
	
	if (arg==nil || arg==imageview.image || [arg isEqual:@""])
	{
		return;
	}
	
	BOOL replaceProperty = YES;
	UIImage *image = nil;
	
	if ([arg isKindOfClass:[UIImage class]]) 
	{
		// called within this class
		image = (UIImage*)arg;
		image = [self scaleImageIfRequired:image];
        
        autoWidth = image.size.width;
        autoHeight = image.size.height;
	}
	else 
	{
		image = [self convertToUIImage:arg];
	}
	
	if (image == nil) 
	{
		if ([arg isKindOfClass:[NSString class]])
		{
			[self loadUrl:[NSURL URLWithString:arg]];
			return;
		}
		if ([arg isKindOfClass:[NSURL class]])
		{
			[self loadUrl:arg];
			return;
		}
		[self throwException:@"invalid image type" subreason:[NSString stringWithFormat:@"expected either TiBlob or TiFile, was: %@",[arg class]] location:CODELOCATION];
		return;
	}
	
	[imageview setImage:image];
	[(TiViewProxy*)[self proxy] contentsWillChange]; // Have to resize the proxy view to fit new subview size, if necessary
	
	if (currentImage!=image)
	{
		[self fireLoadEventWithState:@"url"];
	}
}

-(void)setImages_:(id)args
{
	BOOL running = (timer!=nil);
	
	[self stop];
	
	if (imageView!=nil)
	{
		imageView.image = nil;
	}
	
	// remove any existing images
	[self removeAllImagesFromContainer];
	
	RELEASE_TO_NIL(images);
	ENSURE_TYPE_OR_NIL(args,NSArray);

	if (args!=nil)
	{
		[self container];
		images = [[NSMutableArray alloc] initWithCapacity:[args count]];
		loadTotal = [args count];
		for (size_t c = 0; c < [args count]; c++)
		{
			[self queueImage:[args objectAtIndex:c] index:c];
		}
	}
	else
	{
		RELEASE_TO_NIL(container);
	}
	
	// if we were running, re-start it
	if (running)
	{
		[self start];
	}
}

// we can't have dualing properties that do the same thing or we get into big
// trouble in tableview repaints
-(void)setUrl_:(id)img
{
	NSLog(@"[WARN] the 'url' property on ImageView has been deprecated. Please use 'image' instead");
	// setImage_ does the property replacement for us; no need to do it twice.
	[self setImage_:img];
	return;
}


-(void)setDuration_:(id)duration
{
	interval = [TiUtils floatValue:duration]/1000;
}

-(void)setRepeatCount_:(id)count
{
	repeatCount = [TiUtils intValue:count];
}

-(void)setReverse_:(id)value
{
	reverse = [TiUtils boolValue:value];
}


#pragma mark ImageLoader delegates

-(void)imageLoadSuccess:(ImageLoaderRequest*)request image:(UIImage*)image
{
	CGSize fullSize = [[ImageLoader sharedLoader] fullImageSize:[request url]];
	autoWidth = fullSize.width;
	autoHeight = fullSize.height;
	
	CGFloat computedWidth = TiDimensionCalculateValue(width, autoWidth);
	CGFloat computedHeight = TiDimensionCalculateValue(height, autoHeight);
	if ([TiUtils boolValue:[[self proxy] valueForKey:@"hires"]])
	{
		computedWidth *= 2;
		computedHeight *= 2;
	}
	
	UIImage * bestImage = [[ImageLoader sharedLoader] loadImmediateImage:[request url] withSize:CGSizeMake(computedWidth, computedHeight)];
	if (bestImage != nil)
	{
		image = bestImage;
	}
	else
	{
		image = [self scaleImageIfRequired:image];
	}
	[self performSelectorOnMainThread:@selector(setURLImageOnUIThread:) withObject:image waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
}

-(void)imageLoadFailed:(ImageLoaderRequest*)request error:(NSError*)error
{
	NSLog(@"[ERROR] Failed to load image: %@, Error: %@",[request url], error);
}

@end

#endif
