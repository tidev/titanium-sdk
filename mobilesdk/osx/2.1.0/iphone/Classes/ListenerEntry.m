/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ListenerEntry.h"


@implementation ListenerEntry

@synthesize type;

-(id)initWithListener:(id)listener_ context:(id<TiEvaluator>)context_ proxy:(TiProxy*)proxy_
{
	if (self = [super init])
	{
		NSAssert(context_,@"context was nil");
		listener = [listener_ retain];
		context = context_;	// since the context is held by proxy, we don't need to hold
		proxy = proxy_;	// this object is already held by proxy so don't hold twice
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(listener);
	RELEASE_TO_NIL(type);
	[super dealloc];
}

-(id<TiEvaluator>)context
{
	return context;
}

-(id)listener
{
	return listener;
}

@end
