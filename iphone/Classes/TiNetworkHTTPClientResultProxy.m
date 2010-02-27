/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiNetworkHTTPClientResultProxy.h"
#import "KrollMethod.h"
#import "KrollMethodDelegate.h"
#import "KrollPropertyDelegate.h"

@implementation TiNetworkHTTPClientResultProxy

-(void)makeMethod:(SEL)selector args:(BOOL)args key:(NSString*)key
{
	KrollMethodDelegate *method = [[KrollMethodDelegate alloc] initWithTarget:delegate selector:selector args:args];
	[dynprops setObject:method forKey:key];
	[method release];
}

-(void)makeDynamicProperty:(SEL)selector key:(NSString*)key
{
	KrollPropertyDelegate *prop = [[KrollPropertyDelegate alloc] initWithTarget:delegate selector:selector];
	[dynprops setObject:prop forKey:key];
	[prop release];
}

-(id)initWithDelegate:(TiNetworkHTTPClientProxy*)proxy
{
	if (self = [super _initWithPageContext:[proxy pageContext]])
	{
		delegate = [proxy retain];
		// set the immutable properties we want to be set when this result is proxied
		// back as a this pointer in JS land ... all others will be delegated directly
		// to our delegate
		dynprops = [[NSMutableDictionary alloc] init];
		[dynprops setObject:NUMINT([delegate readyState]) forKey:@"readyState"];
		[dynprops setObject:NUMINT([delegate status]) forKey:@"status"];
		[dynprops setObject:NUMBOOL([delegate connected]) forKey:@"connected"];
		[dynprops setObject:NUMINT([delegate UNSENT]) forKey:@"UNSENT"];
		[dynprops setObject:NUMINT([delegate OPENED]) forKey:@"OPENED"];
		[dynprops setObject:NUMINT([delegate HEADERS_RECEIVED]) forKey:@"HEADERS_RECEIVED"];
		[dynprops setObject:NUMINT([delegate LOADING]) forKey:@"LOADING"];
		[dynprops setObject:NUMINT([delegate DONE]) forKey:@"DONE"];
		
		[self makeMethod:@selector(abort) args:NO key:@"abort"];
		[self makeMethod:@selector(open:) args:YES key:@"open"];
		[self makeMethod:@selector(setRequestHeader:) args:YES key:@"setRequestHeader"];
		[self makeMethod:@selector(setTimeout:) args:YES key:@"setTimeout"];
		[self makeMethod:@selector(getResponseHeader:) args:YES key:@"getResponseHeader"];
		
		[self makeDynamicProperty:@selector(responseText) key:@"responseText"];
		[self makeDynamicProperty:@selector(responseXML) key:@"responseXML"];
		[self makeDynamicProperty:@selector(responseData) key:@"responseData"];
	}
	return self;
}

-(void)dealloc
{
	[dynprops removeAllObjects];
	RELEASE_TO_NIL(delegate);
	[super dealloc];
}

- (id) valueForUndefinedKey: (NSString *) key
{
	id value = [dynprops objectForKey:key];
	if (value!=nil)
	{
		return value;
	}
	return [delegate valueForKey:key];
}

@end
