/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA
#import "TiMediaItem.h"


@implementation TiMediaItem

#pragma mark Internal

-(id)_initWithPageContext:(id<TiEvaluator>)context item:(MPMediaItem*)item_
{
	if (self = [super _initWithPageContext:context]) {
		item = [item_ retain];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(item);
	[super dealloc];
}

-(MPMediaItem*)item
{
	return item;
}

#pragma mark Properties

-(TiBlob*)artwork
{
	MPMediaItemArtwork* artwork = [item valueForProperty:MPMediaItemPropertyArtwork];
	if (artwork != nil) {
		return [[[TiBlob alloc] initWithImage:[artwork imageWithSize:[artwork imageCropRect].size]] autorelease];
	}
	return nil;
}

// This is a sleazy way of getting properties so that I don't have to write 15 functions.
-(void)forwardInvocation:(NSInvocation *)anInvocation
{
	NSString* selectorName = NSStringFromSelector([anInvocation selector]);
	NSString* propertyName = [NSString stringWithFormat:@"MPMediaItemProperty%@%@", [[selectorName substringToIndex:1] uppercaseString], [selectorName substringFromIndex:1]];
	[anInvocation setSelector:@selector(valueForProperty:)];
	[anInvocation setArgument:propertyName atIndex:2];
	[anInvocation invokeWithTarget:item];
}

@end

#endif