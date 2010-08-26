/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_NETWORK

#import "TiNetworkHTTPClientResultProxy.h"
#import "KrollMethod.h"
#import "KrollMethodDelegate.h"
#import "KrollPropertyDelegate.h"

@implementation TiNetworkHTTPClientResultProxy

// NOTE: When we use dynprops here, we must respect the rwlock.

-(void)makeMethod:(SEL)selector args:(BOOL)args key:(NSString*)key
{
	KrollMethodDelegate *method = [[KrollMethodDelegate alloc] initWithTarget:delegate selector:selector args:args];
	
	pthread_rwlock_wrlock(&dynpropsLock);
	[dynprops setObject:method forKey:key];
	pthread_rwlock_unlock(&dynpropsLock);
	
	[method release];
}

-(void)makeDynamicProperty:(SEL)selector key:(NSString*)key
{
	KrollPropertyDelegate *prop = [[KrollPropertyDelegate alloc] initWithTarget:delegate selector:selector];
	
	pthread_rwlock_wrlock(&dynpropsLock);
	[dynprops setObject:prop forKey:key];
	pthread_rwlock_unlock(&dynpropsLock);
	
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
		
		pthread_rwlock_wrlock(&dynpropsLock);
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
		pthread_rwlock_unlock(&dynpropsLock);
	}
	return self;
}

-(void)dealloc
{
	pthread_rwlock_wrlock(&dynpropsLock);
	[dynprops removeAllObjects];
	pthread_rwlock_unlock(&dynpropsLock);
	
	RELEASE_TO_NIL(delegate);
	[super dealloc];
}

- (id) valueForUndefinedKey: (NSString *) key
{
	pthread_rwlock_rdlock(&dynpropsLock);
	id value = [dynprops objectForKey:key];
	pthread_rwlock_unlock(&dynpropsLock);
	
	if (value!=nil)
	{
		return value;
	}
	return [delegate valueForKey:key];
}

@end

#endif