/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumImageViewController.h"
#import "TweakedScrollView.h"
#import "TitaniumHost.h"
#import "TitaniumBlobWrapper.h"

@implementation TitaniumImageView
@synthesize delegate;

- (id) initWithFrame: (CGRect) newFrame;
{
	self = [super initWithFrame:newFrame];
	if (self != nil) {
		[self setUserInteractionEnabled:YES];
	}
	return self;
}


- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{	
	if([delegate respondsToSelector:@selector(imageView:touchesEnded:withEvent:)])
		[delegate imageView:self touchesEnded:touches withEvent:event];
}


@end


@implementation TitaniumImageViewController
@synthesize singleImageBlob;

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}

- (void)dealloc {
	[imageView release];
    [super dealloc];
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	if(![inputState isKindOfClass:[NSDictionary class]])return;
	
	TitaniumBlobWrapper * newImageBlob = [inputState objectForKey:@"image"];
	if([newImageBlob isKindOfClass:[TitaniumBlobWrapper class]]){
		[self setSingleImageBlob:newImageBlob];
	} else {
		id imageUrlObject = [inputState objectForKey:@"url"];
		if([imageUrlObject isKindOfClass:[NSString class]]){
			NSURL * singleImageUrl = [NSURL URLWithString:imageUrlObject relativeToURL:baseUrl];
			[self setUrl:singleImageUrl];
		}
	}

	NSNumber * canScaleObject = [inputState objectForKey:@"canScale"];
	scrollEnabled = [canScaleObject respondsToSelector:@selector(boolValue)] && [canScaleObject boolValue];
}

#pragma mark Accessors
- (UIImage *) singleImage;
{
	UIImage * result = [singleImageBlob imageBlob];
	
	if(result == nil){
		//Add listener!
	}
	
	if(imageSize.width > 1.0){
		//Reshape!
	}
	return result;
}


- (UIView *) view;
{
	CGRect viewFrame;
	viewFrame.origin = CGPointZero;
	viewFrame.size = preferredViewSize;
	if(imageView==nil){
		imageView = [[TitaniumImageView alloc] initWithFrame:viewFrame];
		[imageView setDelegate:self];
		[imageView setImage:[self singleImage]];
	}
	if(!scrollEnabled){
		[imageView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		return imageView;
	}
	if(scrollView==nil){
		scrollView = [[TweakedScrollView alloc] initWithFrame:viewFrame];
		viewFrame.size = [[imageView image] size];
		[scrollView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[scrollView setContentSize:viewFrame.size];
		[imageView setFrame:viewFrame];
		[scrollView addSubview:imageView];
		
		[scrollView setMultipleTouchEnabled:YES];
		[scrollView setDelegate:self];
	}
	
	return scrollView;
}

- (void) setView: (UIView *) newView;
{
	if(newView==nil){
		[scrollView release];
		scrollView = nil;
		[imageView release];
		imageView = nil;
	}
}

#pragma mark Graphics

- (void)updateLayout: (BOOL)animated;
{
	if(dirtyImage){
		UIImage * newImage = [self singleImage];
		[imageView setImage:newImage];
		
		if(scrollEnabled){
			CGRect imageRect;
			imageRect.origin = CGPointZero;
			imageRect.size = [newImage size];
			
			[scrollView setContentSize:imageRect.size];
			[imageView setFrame:imageRect];
		}
		dirtyImage = NO;
	}

	if(scrollEnabled){
		[scrollView setMaximumZoomScale:4.0];
		CGSize contentSize = [scrollView contentSize];
		CGSize frameSize = [scrollView frame].size;
		float minZoom = 0;
		if (contentSize.width > 1) minZoom = frameSize.width/contentSize.width;
		if (contentSize.height > 1) minZoom = MAX(minZoom,frameSize.height/contentSize.height);
		minZoom = MIN(1.0,minZoom);
		[scrollView setMinimumZoomScale:minZoom];
	}
}

#pragma mark Callbacks

- (void) imageView: (TitaniumImageView *)touchedImage touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event;
{
	UITouch * ourTouch = [[event touchesForView:imageView] anyObject];
	CGPoint ourTouchLocation = [ourTouch locationInView:imageView];
	CGRect ourBounds = [imageView bounds];
	if(!CGRectContainsPoint(ourBounds, ourTouchLocation))return;
	
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	NSString * pathString = [self javaScriptPath];
	NSString * commandString = [NSString stringWithFormat:@"%@.doEvent('click',{type:'click'});",pathString];	
	[theHost sendJavascript:commandString toPagesWithTokens:listeningWebContextTokens update:YES];
}

- (UIView *)viewForZoomingInScrollView:(UIScrollView *)scrollView;     // return a view that will be scaled. if delegate returns nil, nothing happens
{
	return imageView;
}

#pragma mark Javascript entrances

- (void) setUrl: (NSURL *) newUrl;
{
	[self setSingleImageBlob:[[TitaniumHost sharedHost] blobForUrl:newUrl]];
	if(imageView != nil){
		dirtyImage = YES;
		if(![NSThread isMainThread]){
			[self performSelectorOnMainThread:@selector(updateLayout:) withObject:nil waitUntilDone:NO];
		} else {
			[self updateLayout:NO];
		}
	}
}





@end
