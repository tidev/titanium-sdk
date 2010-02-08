/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ListenerEntry.h"


@implementation ListenerEntry

-(void)contextShutdown:(NSNotification*)note
{
	[[self retain] autorelease];
	[proxy removeEventListener:[NSArray arrayWithObjects:type,listener,nil]];
}

-(id)initWithListener:(id)listener_ context:(id<TiEvaluator>)context_ proxy:(TiProxy*)proxy_ type:(NSString*)type_
{
	if (self = [super init])
	{
		assert(context_);
		listener = [listener_ retain];
		context = context_;// don't retain
		proxy = proxy_; // don't retain
		type = [type_ retain];
		// since a context can get shutdown while we're holding him.. we listener for shutdown events so we can automatically remove ourselves
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(contextShutdown:) name:kKrollShutdownNotification object:context];
	}
	return self;
}

-(void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self name:kKrollShutdownNotification object:context];
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
