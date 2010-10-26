/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UICOVERFLOWVIEW

#import "TiUICoverFlowView.h"
#import "ImageLoader.h"
#import "TiBlob.h"

@implementation TiUICoverFlowView

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

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	for (UIView *child in [self subviews])
	{
		[TiUtils setView:child positionRect:bounds];
	}
}

// Largely stolen from TiUIImageView, but it's different enough that we can't make a common version...
// TODO: Or can we?
-(UIImage*)convertToUIImage:(id)arg
{
	UIImage *image = nil;
	
	if ([arg isKindOfClass:[TiBlob class]])
	{
		image = [(TiBlob*)arg image];
	}
	else if ([arg isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)arg;
		NSURL * fileUrl = [NSURL fileURLWithPath:[file path]];
		
		CGSize fullSize = [[ImageLoader sharedLoader] fullImageSize:fileUrl];
		// AFOpenFlow demo seems to indicate that 225 is a "magic" size?
		image = [[ImageLoader sharedLoader] loadImmediateImage:fileUrl withSize:CGSizeMake(225,225)];
	}
	else if ([arg isKindOfClass:[NSString class]]) {
		NSURL *url_ = [TiUtils toURL:arg proxy:self.proxy];
		image = [[ImageLoader sharedLoader] loadImmediateImage:url_ withSize:CGSizeMake(225, 225)];
	}
	else if ([arg isKindOfClass:[UIImage class]])
	{
		// called within this class
		image = (UIImage*)arg;
	}
	
	return image;
}

#pragma mark Public APIs 

-(void)setImages_:(id)args
{
	ENSURE_TYPE_OR_NIL(args, NSArray);
	AFOpenFlowView* flow = [self view];

	if (previous >= [args count]) {
		[self setSelected_:[args count]-1];
	}

	[flow setNumberOfImages:[args count]];
	for (int i=0; i < [flow numberOfImages]; i++) {
		[self setImage:[args objectAtIndex:i] forIndex:i];
	}
}

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
		NSLog(@"[ERROR] attempt to select index: %d that is out of bounds. Number of images: %d",index,[flow numberOfImages]);
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
			[flow setImage:coverImage forIndex:index];
		}
		else {
			if ([image isKindOfClass:[NSString class]]) {
				// Assume a remote URL
				[loadLock lock];
				[toLoad setValue:image forKey:[NUMINT(index) stringValue]];
				[loadLock unlock];
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
		NSLog(@"[ERROR] attempt to set index: %d that is out of bounds. number of images: %d",index,[flow numberOfImages]);
	}
}

#pragma mark ImageLoaderRequest Delegates

-(void)imageLoadSuccess:(ImageLoaderRequest*)request image:(UIImage*)image
{
	NSNumber* index = [[request userInfo] valueForKey:@"index"];
	[loadLock lock];
	[loading removeObjectForKey:[index stringValue]];
	[loadLock unlock];
	
	[[self view] setImage:image forIndex:[index intValue]];
}

-(void)imageLoadFailed:(ImageLoaderRequest*)request error:(NSError*)error
{
	NSLog(@"[ERROR] Failed to load remote image at %@: %@", [[request userInfo] valueForKey:@"index"], [error localizedDescription]);
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
		[loading setValue:[[ImageLoader sharedLoader] loadImage:[NSURL URLWithString:loadUrl]
														delegate:self
														userInfo:[NSDictionary dictionaryWithObject:NUMINT(index) forKey:@"index"]]
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