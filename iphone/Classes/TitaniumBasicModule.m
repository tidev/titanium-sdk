/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TitaniumBasicModule.h"

#define VAL_OR_NSNULL(foo)	(((foo) != nil)?((id)foo):[NSNull null])


@implementation TitaniumBasicModule

- (void) dealloc 
{
	[host release];
	[pageToken release];
	[super dealloc];
}

- (void) configure 
{
}

- (NSString*)moduleName 
{
	NSString *className = NSStringFromClass([self class]);
	return [className stringByReplacingOccurrencesOfString:@"Module" withString:@""];
}

- (BOOL) startModule
{
	dictionary = [[NSMutableDictionary alloc] init];
	host = [[TitaniumHost sharedHost] retain];
	[self configure];
	if ([self wantsNotifications])
	{
		[host registerListener:self];
	}
	[host bindObject:dictionary toKeyPath:[self moduleName]];
	[dictionary release];
	dictionary = nil;
	return YES;
}

- (BOOL) endModule
{
	if ([self wantsNotifications])
	{
		[host unregisterListener:self];
	}
	return YES;
}

- (void) bindAccessor:(NSString*)key method:(SEL)method
{
	TitaniumAccessorTuple * accessor = [[[TitaniumAccessorTuple alloc] init] autorelease];
	[accessor setGetterTarget:self];
	[accessor setGetterSelector:method];
	[dictionary setValue:accessor forKey:key];
}

- (void) bindProperty:(NSString*)key value:(id)value
{
	[dictionary setValue:VAL_OR_NSNULL(value) forKey:key];
}

- (void) bindCode:(NSString*)key code:(NSString*)code 
{
	[dictionary setValue:[TitaniumJSCode codeWithString:code] forKey:key];
}

- (void) bindFunction:(NSString*)key method:(SEL)method
{
	NSMethodSignature * methodSignature = [self methodSignatureForSelector:method];
	NSInvocation * result = [NSInvocation invocationWithMethodSignature:methodSignature];
	[result setSelector:method]; 
	[result setTarget:self];
	[dictionary setValue:result forKey:key];
}

- (void) bindInitializer:(NSString *)code
{
	TitaniumJSCode *js = [TitaniumJSCode codeWithString:@"{};"];
	[js setEpilogueCode:code];
	[dictionary setValue:js forKey:@"__INIT"];
}

- (void)registerContentViewController: (Class)controller forToken:(NSString*)token
{
	[TitaniumContentViewController registerContentViewController:controller forToken:token];
}

- (void) evaluateJavascript:(NSString *) code token:(NSString*)token
{
	if (token == nil)
	{
		token = [self getPageToken];
	}
	[host sendJavascript:code toPageWithToken:token];
}

- (void) setPageToken: (NSString *)token
{
	if ([token isEqualToString:pageToken]) {
		return;
	}
	[pageToken release];
	pageToken = [token retain];
}

- (NSString*) getPageToken
{
	return pageToken;
}

- (NSString*) toJSON:(id)jsonObj
{
	SBJSON *json = [[[SBJSON alloc] init] autorelease];
	return [json stringWithObject:jsonObj error:nil];
}

- (id) fromJSON:(NSString*)json
{
	SBJSON *j = [[[SBJSON alloc] init] autorelease];
	return [j objectWithString:json error:nil];
}

- (BOOL) wantsNotifications
{
	return NO;
}

@end



