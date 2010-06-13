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
	if (classNameLookup != NULL)
	{
		CFRelease(classNameLookup);
	}
	RELEASE_TO_NIL(moduleName);
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

-(void)suspend:(id)sender
{
}

-(void)resume:(id)sender
{
}

-(void)startup
{
	if (classNameLookup == NULL)
	{
		classNameLookup = CFDictionaryCreateMutable(kCFAllocatorDefault, 10, &kCFTypeDictionaryKeyCallBacks, NULL);
		//We do not retain the Class, but simply assign them.
	}

	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(shutdown:) name:kTiShutdownNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(suspend:) name:kTiSuspendNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(resume:) name:kTiResumeNotification object:nil];
}

-(void)_configure
{
	[self startup];
	[super _configure];
}

-(void)_setName:(NSString*)name_
{
	moduleName = [name_ retain];
}

//
// we dynamically create proxies so we don't create an unnecessary
// compile-time dependency on our sub module classes
//
-(id)createProxy:(NSArray*)args forName:(NSString*)name context:(id<TiEvaluator>)context
{
	Class resultClass = (Class)CFDictionaryGetValue(classNameLookup, name);
	if (resultClass == NULL)
	{
		NSRange range = [name rangeOfString:@"create"];
		if (range.location==NSNotFound)
		{
			return nil;
		}
		
		// this is a magic check to see if we're inside a compiled code or not
		// and if so, drop the prefix
		NSString *prefix = @"Ti";
		NSString *moduleName_ = nil;
		if (moduleName==nil)
		{
			moduleName_ = [NSString stringWithCString:class_getName([self class]) encoding:NSUTF8StringEncoding];
		}
		else 
		{
			// this is only set in the case of a Plus Module
			moduleName_ = moduleName;
			prefix = @"";
		}
		moduleName_ = [moduleName_ stringByReplacingOccurrencesOfString:@"Module" withString:@""];
		NSString *className = [NSString stringWithFormat:@"%@%@%@Proxy",prefix,moduleName_,[name substringFromIndex:range.location+6]];	
		resultClass = NSClassFromString(className);
		if (resultClass==nil)
		{
			NSLog(@"[WARN] attempted to load: %@",className);
			@throw [NSException exceptionWithName:@"org.appcelerator.module" 
										   reason:[NSString stringWithFormat:@"invalid method (%@) passed to %@",name,[self class]] 
										 userInfo:nil];
		}
		CFDictionarySetValue(classNameLookup, name, resultClass);		
	}

	TiProxy *proxy = [resultClass alloc];
	return [[proxy _initWithPageContext:context args:args] autorelease];
}



@end
