/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSCOVERFLOWVIEW) || defined(USE_TI_UICOVERFLOWVIEW)
	
	

#import "TiUIiOSCoverFlowView.h"
#import "ImageLoader.h"
#import "TiBlob.h"
#import "AFOpenFlow/UIImageExtras.h"

@implementation TiUIiOSCoverFlowView


#pragma mark Framework

-(void)dealloc
{
	RELEASE_TO_NIL(view);
	
	RELEASE_TO_NIL(toLoad);
	[loadLock lock];
	for (NSString* requestKey in loading) {
		ImageLoaderRequest* request = [loading objectForKey:requestKey];
		[request cancel];
	}
	RELEASE_TO_NIL(loading);
	[loadLock unlock];
	
	RELEASE_TO_NIL(loadLock);
	[super dealloc];
}

-(id)init
{
	if (self = [super init]) {
		loadLock = [[NSRecursiveLock alloc] init];
		toLoad = [[NSMutableDictionary alloc] init];
		loading = [[NSMutableDictionary alloc] init];
	}
	return self;
}

-(AFOpenFlowView*)view
{
	if (view == nil)
	{
		view = [[AFOpenFlowView alloc] initWithFrame:[self bounds]];
		view.dataSource = self;
		view.viewDelegate = self;
		[view setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[self addSubview:view];
	}
	return view;
}

- (id)accessibilityElement
{
	return [self view];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	for (UIView *child in [self subviews])
	{
		[TiUtils setView:child positionRect:bounds];
	}
    [super frameSizeChanged:frame bounds:bounds];
}

// Largely stolen from TiUIImageView, but it's different enough that we can't make a common version...
// TODO: Or can we?
-(UIImage*)convertToUIImage:(id)arg
{
	UIImage *image = nil;
	
	if ([arg isKindOfClass:[NSDictionary class]]) {
		return [self convertToUIImage:[arg valueForKey:@"image"]];
	}
	if ([arg isKindOfClass:[TiBlob class]])
	{
		image = [(TiBlob*)arg image];
	}
	else if ([arg isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)arg;
		NSURL * fileUrl = [TiUtils toURL:[file path] proxy:self.proxy];
		image = [[ImageLoader sharedLoader] loadImmediateImage:fileUrl];
	}
	else if ([arg isKindOfClass:[NSString class]]) {
		NSURL *url_ = [TiUtils toURL:arg proxy:self.proxy];
		image = [[ImageLoader sharedLoader] loadImmediateImage:url_];
	}
	else if ([arg isKindOfClass:[UIImage class]])
	{
		// called within this class
		image = (UIImage*)arg;
	}
	
	return image;
}

-(UIImage*)cropAndScale:(UIImage*)image props:(NSDictionary*)props
{
	CGSize originalSize = [image size];	
	TiDimension widthDimension = TiDimensionFromObject([props valueForKey:@"width"]);
	TiDimension heightDimension = TiDimensionFromObject([props valueForKey:@"height"]);
	
	CGFloat width = (TiDimensionIsAuto(widthDimension) || TiDimensionIsUndefined(widthDimension)) ? 
						originalSize.width : TiDimensionCalculateValue(widthDimension, originalSize.width);
	CGFloat height = (TiDimensionIsAuto(heightDimension) || TiDimensionIsUndefined(heightDimension)) ? 
						originalSize.height : TiDimensionCalculateValue(heightDimension, originalSize.height);
	
	return [image cropCenterAndScaleImageToSize:CGSizeMake(width, height)];
}

#pragma mark Public APIs 

-(void)setSelected_:(id)arg
{
	int index = [TiUtils intValue:arg];
	AFOpenFlowView *flow = [self view];
	
	if (index >= 0 && index < [flow numberOfImages])
	{
		[flow setSelectedCover:index];
		[flow centerOnSelectedCover:YES];
	}
	else {
		DebugLog(@"[ERROR] attempt to select index: %d that is out of bounds. Number of images: %d",index,[flow numberOfImages]);
	}
}

-(void)setImages_:(id)args
{
	ENSURE_TYPE_OR_NIL(args, NSArray);
	AFOpenFlowView* flow = [self view];

	if (previous >= [args count]) {
		[self setSelected_:[NSNumber numberWithInt:[args count]-1]];
	}

	[flow setNumberOfImages:[args count]];
	for (int i=0; i < [flow numberOfImages]; i++) {
		[self setImage:[args objectAtIndex:i] forIndex:i];
	}
}

-(void)setImage:(id)image forIndex:(NSInteger)index
{
	AFOpenFlowView* flow = [self view];
	if (index>=0 && index < [flow numberOfImages])
	{
		[loadLock lock];
		ImageLoaderRequest* request = [loading valueForKey:[NUMINT(index) stringValue]];
		if (request != nil) {
			[request cancel];
			[loading removeObjectForKey:[NUMINT(index) stringValue]];
		}
		[loadLock unlock];
		UIImage* coverImage = [self convertToUIImage:image];
		if (coverImage != nil) {
			if ([image isKindOfClass:[NSDictionary class]]) {
				coverImage = [self cropAndScale:coverImage props:image];
			}
			[flow setImage:coverImage forIndex:index];
		}
		else {
			if ([image isKindOfClass:[NSString class]] || [image isKindOfClass:[NSDictionary class]]) {
				// Assume a remote URL
				[loadLock lock];
				[toLoad setValue:image forKey:[NUMINT(index) stringValue]];
				[loadLock unlock];
				
				// Here's the ugly part; if it's a visible cover, we have to manually force a data source
				// request to display the new image.
				[self openFlowView:flow requestImageForIndex:index];
			}
			else {
				[[self proxy] throwException:[NSString stringWithFormat:@"Bad image type (%@) for image at index %d",[image class], index]
								   subreason:nil
									location:CODELOCATION];
			}
		}
	}
	else
	{
		DebugLog(@"[ERROR] Attempted to set index: %d that is out of bounds. Number of images: %d",index,[flow numberOfImages]);
	}
}

#pragma mark ImageLoaderRequest Delegates

-(void)imageLoadSuccess:(ImageLoaderRequest*)request image:(UIImage*)image
{
	NSNumber* index = [[request userInfo] valueForKey:@"index"];
	[loadLock lock];
	[loading removeObjectForKey:[index stringValue]];
	[loadLock unlock];
	
	UIImage* coverImage = [self cropAndScale:image props:[request userInfo]];
	
	[[self view] setImage:coverImage forIndex:[index intValue]];
}

-(void)imageLoadFailed:(ImageLoaderRequest*)request error:(NSError*)error
{
	NSLog(@"[ERROR] Failed to load remote image at %@: %@", [[request userInfo] valueForKey:@"index"], [error localizedDescription]);
	[loadLock lock];
	[loading removeObjectForKey:[[[request userInfo] valueForKey:@"index"] stringValue]];
	[loadLock unlock];
}

#pragma mark OpenFlow Delegates

- (void)openFlowView:(AFOpenFlowView *)openFlowView selectionDidChange:(int)index
{
	if ([self.proxy _hasListeners:@"change"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(index),@"index",NUMINT(previous),@"previous",nil];
		[self.proxy fireEvent:@"change" withObject:event];
	}
	[self.proxy replaceValue:NUMINT(index) forKey:@"selected" notification:NO];
	previous = index;
}

- (void)openFlowView:(AFOpenFlowView *)openFlowView click:(int)index
{
	if ([self.proxy _hasListeners:@"click"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(index),@"index",NUMINT(previous),@"previous",nil];
		[self.proxy fireEvent:@"click" withObject:event];
	}
	[self.proxy replaceValue:NUMINT(index) forKey:@"selected" notification:NO];
	previous = index;
}

#pragma mark Datasource

- (void)openFlowView:(AFOpenFlowView *)openFlowView requestImageForIndex:(int)index
{
	[loadLock lock];
	id loadUrl = [toLoad valueForKey:[NUMINT(index) stringValue]];
	if (loadUrl != nil) {
		NSMutableDictionary* userInfo = [NSMutableDictionary dictionaryWithObject:NUMINT(index) forKey:@"index"];
		NSString* urlString = loadUrl;
		if ([loadUrl isKindOfClass:[NSDictionary class]]) {
			[userInfo setValue:[loadUrl valueForKey:@"height"] forKey:@"height"];
			[userInfo setValue:[loadUrl valueForKey:@"width"] forKey:@"width"];
			urlString = [loadUrl valueForKey:@"image"];
		}
		
		[loading setValue:[[ImageLoader sharedLoader] loadImage:[NSURL URLWithString:urlString]
														delegate:self
														userInfo:userInfo]
				   forKey:[NUMINT(index) stringValue]];
	}
	[loadLock unlock];
}

- (UIImage *)defaultImage
{
	return [UIImage imageNamed:@"modules/ui/images/photoDefault.png"];
}

@end

#endif