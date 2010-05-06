/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UICOVERFLOWVIEW

#import "TiBase.h"
#import "TiUICoverFlowView.h"
#import "ImageLoader.h"
#import "TiUtils.h"
#import "TiProxy.h"
#import "OperationQueue.h"

@implementation TiUICoverFlowView

#pragma mark Framework

-(void)dealloc
{
	RELEASE_TO_NIL(view);
	RELEASE_TO_NIL(images);
	[super dealloc];
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

#pragma mark Public APIs 

-(void)setImages_:(id)args
{
	RELEASE_TO_NIL(images);
	images = [args retain];
	previous = -1;
	[self.proxy replaceValue:NUMINT(0) forKey:@"selected" notification:NO];
	[[self view] setNumberOfImages:[images count]];
}

-(void)setSelected_:(id)arg
{
	int index = [TiUtils intValue:arg];
	if (index >= 0 && index < [images count])
	{
		AFOpenFlowView *flow = [self view];
		[flow setSelectedCover:index];
		[flow centerOnSelectedCover:YES];
		[self openFlowView:flow selectionDidChange:index];
	}
}

-(void)setURL:(id)urlstr forIndex:(NSInteger)index
{
	NSString *newurl = [TiUtils stringValue:urlstr];
	if (index>=0 && index < [images count])
	{
		[images replaceObjectAtIndex:index withObject:newurl]; 
		[self openFlowView:[self view] requestImageForIndex:index];
	}
	else
	{
		NSLog(@"[ERROR] attempt to set index: %d that is out of bounds. number of images: %d",index,[images count]);
	}
}

#pragma mark Delegates

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

-(NSArray*)loadRemote:(NSArray*)args
{
	NSMutableArray *result = [NSMutableArray arrayWithArray:args];
	UIImage *image = [[ImageLoader sharedLoader] loadRemote:[args objectAtIndex:0]];
	if (image==nil)
	{
		NSLog(@"[ERROR] Couldn't load coverflow image url: %@",[args objectAtIndex:0]);
		return nil;
	}
	[result addObject:image];
	return result;
}

-(void)changeImage:(NSArray*)args
{
	if (args!=nil)
	{
		int index = [TiUtils intValue:[args objectAtIndex:1]];
		UIImage *image = [args objectAtIndex:2];
		[[self view] setImage:image forIndex:index];
	}
}

- (void)openFlowView:(AFOpenFlowView *)openFlowView requestImageForIndex:(int)index
{
	NSString *urlstr = [images objectAtIndex:index];
	NSURL *url = [TiUtils toURL:urlstr proxy:(TiProxy*)self.proxy];
	UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
	if (image!=nil)
	{
		[openFlowView setImage:image forIndex:index];
	}
	else
	{
		[[OperationQueue sharedQueue] queue:@selector(loadRemote:) 
									 target:self 
										arg:[NSArray arrayWithObjects:url,NUMINT(index),nil] 
									  after:@selector(changeImage:) 
										 on:self 
										 ui:YES];
	}
}

- (UIImage *)defaultImage
{
	return [UIImage imageNamed:@"modules/ui/images/photoDefault.png"];
}

@end

#endif