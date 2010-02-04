/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUICoverFlowViewProxy.h"
#import "TiUtils.h"
#import "ImageLoader.h"

@implementation TiUICoverFlowViewProxy

-(void)setImages:(NSArray *)newImages
{
	ENSURE_TYPE_OR_NIL(newImages,NSArray);
	[imageUrls release];
	imageUrls = [newImages mutableCopy];
	//Trigger update.
}

-(NSArray *)images
{
	return [[imageUrls copy] autorelease];
}

-(void)setURL:(int)index withObject:(id)newUrl
{
	


}

- (void)openFlowView:(AFOpenFlowView *)openFlowView event:(int)index eventType:(NSString *)eventType
{
	NSNumber * newIndex = [NSNumber numberWithInt:index];
	if (![self _hasListeners:eventType])
	{
		[self replaceValue:newIndex forKey:@"selected" notification:NO];
		return;
	}

	NSNumber * oldIndex = [self valueForKey:@"selected"];
	if (IS_NULL_OR_NIL(oldIndex)) {
		oldIndex = [NSNumber numberWithInt:-1];
	}

	[self replaceValue:newIndex forKey:@"selected" notification:NO];

	NSDictionary * eventDict = [NSDictionary dictionaryWithObjectsAndKeys:newIndex,@"index",oldIndex,@"previous",nil];
	[self fireEvent:eventType withObject:eventDict];
}

- (void)openFlowView:(AFOpenFlowView *)openFlowView selectionDidChange:(int)index
{
	[self openFlowView:openFlowView event:index eventType:@"change"];
}

- (void)openFlowView:(AFOpenFlowView *)openFlowView click:(int)index
{
	[self openFlowView:openFlowView event:index eventType:@"click"];
}

- (UIImage *)defaultImage
{
	return nil;
}

- (void)openFlowView:(AFOpenFlowView *)openFlowView requestImageForIndex:(int)index
{
	NSURL * imageUrl = [TiUtils toURL:[imageUrls objectAtIndex:index] proxy:self];	
	ImageLoader * theLoader = [ImageLoader sharedLoader];

	UIImage *image = [theLoader loadImmediateImage:imageUrl];
	if (image==nil)
	{
		if (imageUrl != nil)
		{
//			[theLoader loadImage:imageUrl callback:self selector:<#(SEL)selector#>
		}
		image = [self defaultImage];
	}
	[openFlowView setImage:image forIndex:index];
}


@end
