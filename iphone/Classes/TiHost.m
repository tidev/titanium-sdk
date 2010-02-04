/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiHost.h"
#import "TiProxy.h"
#import "TiModule.h"
#import "SBJSON.h"

#ifdef DEBUG
#define DEBUG_EVENTS 0
#endif

@implementation TiHost

-(id)init
{
	if (self = [super init])
	{
		modules = [[NSMutableDictionary alloc] init];
		contexts = [[NSMutableDictionary alloc] init];
		 
		NSString *path = [[NSBundle mainBundle] bundlePath];
		NSString *fn = @"app.js";
		const char *start = getenv("TI_STARTPAGE");
		if (start!=NULL)
		{
			fn = [NSString stringWithCString:start encoding:NSUTF8StringEncoding];
		}
		NSString *fullpath = [NSString stringWithFormat:@"%@/%@",path,fn];
		NSString *dir = [fullpath stringByDeletingLastPathComponent];
		startURL = [[NSURL fileURLWithPath:fullpath] retain];
		baseURL = [[NSURL fileURLWithPath:dir] retain];
	}
	return self;
}

-(NSString*)appID
{
	//FIXME this will be compiled in
	return @"foo.bar";
}

-(NSURL*)baseURL
{
	return baseURL;
}

-(NSURL*)startURL
{
	return startURL;
}

-(void)dealloc
{
	RELEASE_TO_NIL(modules);
	RELEASE_TO_NIL(proxies);
	RELEASE_TO_NIL(contexts);
	RELEASE_TO_NIL(baseURL);
	RELEASE_TO_NIL(startURL);
	[super dealloc];
}

-(void)registerContext:(id<TiEvaluator>)context forToken:(NSString*)token
{
	[contexts setValue:context forKey:token];
}

-(void)unregisterContext:(id<TiEvaluator>)context forToken:(NSString*)token
{
	[contexts removeObjectForKey:token];

	// we need to clean up all our proxy objects
	for (id key in [proxies allKeys])
	{
		TiProxy *proxy = (TiProxy*)[proxies objectForKey:key];
		id<TiEvaluator> c = [proxy pageContext];
		if (c == context)
		{
			[self unregisterProxy:key];
			[proxy _contextDestroyed];
		}
	}
}

-(id) moduleNamed:(NSString*)name
{
	TiModule *m = [modules objectForKey:name];
	if (m == nil)
	{
		Class moduleClass = NSClassFromString([NSString stringWithFormat:@"%@Module",name]);
		if (moduleClass!=nil)
		{
			m = [[moduleClass alloc]init];
			[m setHost:self];
			[modules setObject:m forKey:name];
			[m release];
		}
	}
	return m;
}

-(void)registerProxy:(TiProxy*)proxy
{
	//FIXME: this should be reworked to only be done for non-Kroll based evaluator
	if (proxies==nil)
	{
//		proxies = [[NSMutableDictionary alloc] init];
	}
//	[proxies setObject:proxy forKey:[proxy proxyId]];
}

-(void)unregisterProxy:(NSString*)proxyid
{
	if (proxies!=nil)
	{
		if (proxyid!=nil)
		{
			[proxies removeObjectForKey:proxyid];
		}
		if ([proxies count]==0)
		{
			RELEASE_TO_NIL(proxies);
		}
	}
}

-(TiProxy*)proxyForId:(NSString*)proxyid
{
	if (proxies!=nil)
	{
		return [proxies objectForKey:proxyid];
	}
	return nil;
}

-(void)evaluateJS:(NSString*)js context:(id<TiEvaluator>)evaluator
{
	[evaluator evalJS:js];
}	

-(void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn context:(id<TiEvaluator>)evaluator thisObject:(TiProxy*)thisObject_
{
#if DEBUG_EVENTS==1
	NSLog(@"fireEvent: %@, object: %@",listener,obj);
#endif	
	[evaluator fireEvent:listener withObject:obj remove:yn thisObject:thisObject_];
}

-(void)removeListener:(id)listener context:(id<TiEvaluator>)context
{
	// we do have other types that are registered listeners such as a FunctionProxy
	// which actually doesn't extend the TiProxy class since it's just a wrapping object for native<->js
	if ([listener isKindOfClass:[TiProxy class]])
	{
		NSString *proxyid = [listener proxyId];
		if (proxyid!=nil)
		{
			[proxies removeObjectForKey:proxyid];
		}
	}
}

@end
