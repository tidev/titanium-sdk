/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <objc/runtime.h>

#import "TiModule.h"
#import "TiProxy.h"
#import "TiUtils.h"
#import "TiHost.h"
#import "KrollBridge.h"

@implementation TiModule

-(void)unregisterForNotifications
{
	[[NSNotificationCenter defaultCenter] removeObserver:self];
}

-(void)dealloc
{	
    // Have to jump through a hoop here to keep the dealloc block from
    // retaining 'self' by creating a __block access ref. Note that
    // this is only safe as long as the block until completion is YES.
    __block id bself = self;
	TiThreadPerformOnMainThread(^{
        [bself unregisterForNotifications];
    }, YES);
    
	RELEASE_TO_NIL(host);
	if (classNameLookup != NULL)
	{
		CFRelease(classNameLookup);
	}
	RELEASE_TO_NIL(moduleName);
	RELEASE_TO_NIL(moduleAssets);
	[super dealloc];
}

-(void)contextShutdown:(id)sender
{
	id<TiEvaluator> context = (id<TiEvaluator>)sender;

	[self contextWasShutdown:context];
	if(pageContext == context){
		pageContext = nil;
		pageKrollObject = nil;
	}
	//DO NOT run super shutdown here, as we want to change the behavior that TiProxy does.
}

-(void)setPageContext:(id<TiEvaluator>)evaluator
{
	pageContext = evaluator; // don't retain
	pageKrollObject = nil;
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

-(void)paused:(id)sender
{
}

-(void)suspend:(id)sender
{
}

-(void)resume:(id)sender
{
}

// Different from resume - there's some information we can only update AFTER the app has popped to the foreground.
-(void)resumed:(id)sender
{
}

-(void)registerForNotifications
{
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(shutdown:) name:kTiShutdownNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(suspend:) name:kTiSuspendNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(paused:) name:kTiPausedNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(resume:) name:kTiResumeNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(resumed:) name:kTiResumedNotification object:nil];
}

-(void)startup
{
	if (classNameLookup == NULL)
	{
		classNameLookup = CFDictionaryCreateMutable(kCFAllocatorDefault, 1, &kCFTypeDictionaryKeyCallBacks, NULL);
		//We do not retain the Class, but simply assign them.
	}
	TiThreadPerformOnMainThread(^{[self registerForNotifications];}, NO);
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
			DebugLog(@"[WARN] Attempted to load %@: Could not find class definition.",className);
			@throw [NSException exceptionWithName:@"org.appcelerator.module" 
										   reason:[NSString stringWithFormat:@"invalid method (%@) passed to %@",name,[self class]] 
										 userInfo:nil];
		}
		CFDictionarySetValue(classNameLookup, name, resultClass);		
	}

	return [[[resultClass alloc] _initWithPageContext:context args:args] autorelease];
}


-(NSString*)moduleId
{
	// by default, base modules don't have a module id - but custom modules will
	return nil;
}

-(void)loadAssets
{
    if (moduleAssets == nil) {
        NSString *moduleName_ = [NSString stringWithCString:class_getName([self class]) encoding:NSUTF8StringEncoding];
        NSString *moduleAsset = [NSString stringWithFormat:@"%@Assets",moduleName_];
        id cls = NSClassFromString(moduleAsset);
        if (cls!=nil)
        {
            moduleAssets = [[cls alloc] init];
        }
    }    
}

-(NSData*)moduleJS
{
    [self loadAssets];
    
    if (moduleAssets!=nil)
    {
        return [moduleAssets performSelector:@selector(moduleAsset)];
    }
	return nil;
}

-(NSData*)loadModuleAsset:(NSString*)fromPath
{
    [self loadAssets];
    if ([moduleAssets respondsToSelector:@selector(resolveModuleAsset:)]) {
        NSString* assetID = [fromPath stringByReplacingOccurrencesOfString:@"." withString:@"_"];
        return [moduleAssets performSelector:@selector(resolveModuleAsset:) withObject:assetID];
    }
    return nil;
}

-(BOOL)isJSModule
{
	NSString *moduleId = [self moduleId];
	if (moduleId!=nil)
	{
		// if we have module js than we're a JS native module
		return [self moduleJS]!=nil;	
	}
	return NO;
}

-(NSURL*)moduleResourceURL:(NSString*)name
{
	NSString *resourceurl = [TiHost resourcePath];
	NSURL *path = [NSURL fileURLWithPath:[NSString stringWithFormat:@"%@/modules/%@/%@",resourceurl,[self moduleId],name]];
	return path;
}

-(id)bindCommonJSModule:(NSString*)code
{
	NSString *js = [[NSString alloc] initWithFormat:TitaniumModuleRequireFormat,code];
	
	id result = [[self pageContext] evalJSAndWait:js];
	[js release];
	if ([result isKindOfClass:[NSDictionary class]])
	{
		for (id key in result)
		{
			[self replaceValue:[result objectForKey:key] forKey:key notification:NO];
		}
	}
	return result;
}

-(id)bindCommonJSModuleForPath:(NSURL*)path
{
	NSString *code = [NSString stringWithContentsOfURL:path encoding:NSUTF8StringEncoding error:nil];
	if (code!=nil)
	{
		return [self bindCommonJSModule:code];
	}
	return nil;
}

-(void)didReceiveMemoryWarning:(NSNotification *)notification
{
	[super didReceiveMemoryWarning:notification];
	RELEASE_TO_NIL(moduleAssets);
}

@end
