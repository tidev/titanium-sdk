/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <objc/runtime.h>

#import "TiModule.h"
#import "TiProxy.h"

@implementation TiModule

-(void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	RELEASE_TO_NIL(host);
	[super dealloc];
}

-(void)setPageContext:(id<TiEvaluator>)evaluator
{
	pageContext = evaluator; // don't retain
}

-(void)setHost:(TiHost*)host_
{
	RELEASE_TO_NIL(host);
	host = [host_ retain];
}

-(TiHost*)_host
{
	return host;
}

-(void)shutdown:(id)sender
{
}

-(void)startup
{
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(shutdown:) name:kTitaniumShutdownNotification object:nil];
}

-(id)init
{
	if (self = [super init])
	{
		[self startup];
	}
	return self;
}

//
// we dynamically create proxies so we don't create an unnecessary
// compile-time dependency on our sub module classes
//
-(id)createProxy:(NSArray*)args forName:(NSString*)name context:(id<TiEvaluator>)context
{
	NSRange range = [name rangeOfString:@"create"];
	if (range.location!=NSNotFound)
	{
		NSString *moduleName = [NSString stringWithCString:class_getName([self class]) encoding:NSUTF8StringEncoding];
		moduleName = [moduleName stringByReplacingOccurrencesOfString:@"Module" withString:@""];
		NSString *className = [NSString stringWithFormat:@"Ti%@%@Proxy",moduleName,[name substringFromIndex:range.location+6]];	
		Class moduleClass = NSClassFromString(className);
		if (moduleClass!=nil)
		{
			TiProxy *proxy = [moduleClass alloc];
			return [[proxy _initWithPageContext:context args:args] autorelease];
		}
		else 
		{
			@throw [NSException exceptionWithName:@"org.appcelerator.module" 
										   reason:[NSString stringWithFormat:@"invalid method (%@) passed to %@",name,[self class]] 
										 userInfo:nil];
		}
		
	}
	return nil;
}



@end
