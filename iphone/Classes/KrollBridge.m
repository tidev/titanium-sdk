/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "KrollBridge.h"
#import "KrollCallback.h"
#import "KrollObject.h"
#import "TiHost.h"
#import "TopTiModule.h"
#import "TiUtils.h"
#import "TiApp.h"
#import "ApplicationMods.h"
#import <libkern/OSAtomic.h>
#import "KrollContext.h"
#import "TiDebugger.h"
#import "TiConsole.h"

#ifdef KROLL_COVERAGE
# include "KrollCoverage.h"
#endif

extern BOOL const TI_APPLICATION_ANALYTICS;

NSString * TitaniumModuleRequireFormat = @"(function(exports){"
		"var __OXP=exports;var module={'exports':exports};%@;\n"
		"if(module.exports !== __OXP){return module.exports;}"
		"return exports;})({})";


@implementation TitaniumObject

-(NSDictionary*)modules
{
	return modules;
}

-(id)initWithContext:(KrollContext*)context_ host:(TiHost*)host_ context:(id<TiEvaluator>)pageContext_ baseURL:(NSURL*)baseURL_
{
	TopTiModule *module = [[[TopTiModule alloc] _initWithPageContext:pageContext_] autorelease];
	[module setHost:host_];
	[module _setBaseURL:baseURL_];
	
	pageContext = pageContext_;
	
	if (self = [super initWithTarget:module context:context_])
	{
		modules = [[NSMutableDictionary alloc] init];
		host = [host_ retain];
		[(KrollBridge *)pageContext_ registerProxy:module krollObject:self];
		
		// pre-cache a few modules we always use
		TiModule *ui = [host moduleNamed:@"UI" context:pageContext_];
		[self addModule:@"UI" module:ui];
		TiModule *api = [host moduleNamed:@"API" context:pageContext_];
		[self addModule:@"API" module:api];
		
		if (TI_APPLICATION_ANALYTICS)
		{
			// force analytics to load on startup
			[host moduleNamed:@"Analytics" context:pageContext_];
		}
	}
	return self;
}

#if KROLLBRIDGE_MEMORY_DEBUG==1
-(id)retain
{
	NSLog(@"[MEMRORY DEBUG] RETAIN: %@ (%d)",self,[self retainCount]+1);
	return [super retain];
}
-(oneway void)release 
{
	NSLog(@"[MEMORY DEBUG] RELEASE: %@ (%d)",self,[self retainCount]-1);
	[super release];
}
#endif

-(void)dealloc
{
	RELEASE_TO_NIL(host);
	RELEASE_TO_NIL(modules);
	RELEASE_TO_NIL(dynprops);
	[super dealloc];
}

-(void)gc
{
}

-(id)valueForKey:(NSString *)key
{
	// allow dynprops to override built-in modules
	// in case you want to re-define them
	if (dynprops!=nil)
	{
		id result = [dynprops objectForKey:key];
		if (result!=nil)
		{
			if (result == [NSNull null])
			{
				return nil;
			}
			return result;
		}
	}
	id module = [modules objectForKey:key];
	if (module!=nil)
	{
		return module;
	}
	module = [host moduleNamed:key context:pageContext];
	if (module!=nil)
	{
		return [self addModule:key module:module];
	}
	//go against module
	return [super valueForKey:key];
}

-(void)setValue:(id)value forKey:(NSString *)key
{
	if (dynprops==nil)
	{
		dynprops = [[NSMutableDictionary dictionary] retain];
	}
	if (value == nil)
	{
		value = [NSNull null];
	}
	[dynprops setValue:value forKey:key];
}

- (id) valueForUndefinedKey: (NSString *) key
{
	if ([key isEqualToString:@"toString"] || [key isEqualToString:@"valueOf"])
	{
		return [self description];
	}
	if (dynprops != nil)
	{
		return [dynprops objectForKey:key];
	}
	//NOTE: we need to return nil here since in JS you can ask for properties
	//that don't exist and it should return undefined, not an exception
	return nil;
}

-(id)addModule:(NSString*)name module:(TiModule*)module
{
	// Have we received a JS Module?
	if (![module respondsToSelector:@selector(unboundBridge:)])
	{
		[modules setObject:module forKey:name];
		return module;
	}
	KrollObject *ko = [pageContext registerProxy:module];
	if (ko == nil)
	{
		return nil;
	}
	[self noteKrollObject:ko forKey:name];	
	[modules setObject:ko forKey:name];
	return ko;
}

-(TiModule*)moduleNamed:(NSString*)name context:(id<TiEvaluator>)context
{
	return [modules objectForKey:name];
}

@end

OSSpinLock krollBridgeRegistryLock = OS_SPINLOCK_INIT;
CFMutableSetRef	krollBridgeRegistry = nil;

@implementation KrollBridge

+(void)initialize
{
	if (krollBridgeRegistry == nil)
	{
		CFSetCallBacks doNotRetain = kCFTypeSetCallBacks;
		doNotRetain.retain = NULL;
		doNotRetain.release = NULL;
		krollBridgeRegistry = CFSetCreateMutable(NULL, 3, &doNotRetain);
	}
}
@synthesize currentURL;

-(void)registerForMemoryWarning
{
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] addObserver:self
			selector:@selector(didReceiveMemoryWarning:)
			name:UIApplicationDidReceiveMemoryWarningNotification  
			object:nil]; 
}

-(void)unregisterForMemoryWarning
{
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
}

-(id)init
{
	if (self = [super init])
	{
#if KROLLBRIDGE_MEMORY_DEBUG==1
		NSLog(@"[DEBUG] INIT: %@",self);
#endif		
		modules = [[NSMutableDictionary alloc] init];
		proxyLock = OS_SPINLOCK_INIT;
		OSSpinLockLock(&krollBridgeRegistryLock);
		CFSetAddValue(krollBridgeRegistry, self);
		OSSpinLockUnlock(&krollBridgeRegistryLock);
		TiThreadPerformOnMainThread(^{[self registerForMemoryWarning];}, NO);
	}
	return self;
}

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
    OSSpinLockLock(&proxyLock);
    if (registeredProxies == NULL) {
        OSSpinLockUnlock(&proxyLock);
        [self gc];
        return;
    }
    
    BOOL keepWarning = YES;    
    int proxiesCount = CFDictionaryGetCount(registeredProxies);
    OSSpinLockUnlock(&proxyLock);
        
    //During a memory panic, we may not get the chance to copy proxies.
    while (keepWarning)
    {
        keepWarning = NO;
        
        for (id proxy in (NSDictionary *)registeredProxies)
        {
            [proxy didReceiveMemoryWarning:notification];
            
            OSSpinLockLock(&proxyLock);
            if (registeredProxies == NULL) {
                OSSpinLockUnlock(&proxyLock);
                break;
            }
            
            int newCount = CFDictionaryGetCount(registeredProxies);
            OSSpinLockUnlock(&proxyLock);

            if (newCount != proxiesCount)
            {
                proxiesCount = newCount;
                keepWarning = YES;
                break;
            }
        }
    }
	
	[self gc];
}


#if KROLLBRIDGE_MEMORY_DEBUG==1
-(id)retain
{
	NSLog(@"[MEMORY DEBUG] RETAIN: %@ (%d)",self,[self retainCount]+1);
	return [super retain];
}
-(oneway void)release 
{
	NSLog(@"[MEMORY DEBUG] RELEASE: %@ (%d)",self,[self retainCount]-1);
	[super release];
}
#endif

-(void)removeProxies
{
	OSSpinLockLock(&proxyLock);
	CFDictionaryRef oldProxies = registeredProxies;
	registeredProxies = NULL;
	OSSpinLockUnlock(&proxyLock);
	
	for (id thisProxy in (NSDictionary *)oldProxies)
	{
		KrollObject * thisKrollObject = (id)CFDictionaryGetValue(oldProxies, thisProxy);
		[thisProxy contextShutdown:self];
		[thisKrollObject unprotectJsobject];
	}

	if (oldProxies != NULL)
	{
		CFRelease(oldProxies);
	}

	for (NSString * thisModuleKey in modules) {
		id thisModule = [modules objectForKey:thisModuleKey];
		if ([thisModule respondsToSelector:@selector(unprotectJsobject)]) {
			[thisModule unprotectJsobject];
		}
	}
	RELEASE_TO_NIL(modules);
}

-(void)dealloc
{
#if KROLLBRIDGE_MEMORY_DEBUG==1
	NSLog(@"[MEMORY DEBUG] DEALLOC: %@",self);
#endif
		
	[self removeProxies];
	RELEASE_TO_NIL(preload);
	RELEASE_TO_NIL(context);
	RELEASE_TO_NIL(titanium);
	OSSpinLockLock(&krollBridgeRegistryLock);
	CFSetRemoveValue(krollBridgeRegistry, self);
	OSSpinLockUnlock(&krollBridgeRegistryLock);
	[super dealloc];
}

- (TiHost*)host
{
	return host;
}

- (KrollContext*) krollContext
{
	return context;
}

- (id)preloadForKey:(id)key name:(id)name
{
	if (preload!=nil)
	{
		NSDictionary* dict = [preload objectForKey:name];
		if (dict!=nil)
		{
			return [dict objectForKey:key];
		}
	}
	return nil;
}

- (void)boot:(id)callback url:(NSURL*)url_ preload:(NSDictionary*)preload_
{
	preload = [preload_ retain];
	[super boot:callback url:url_ preload:preload_];
	context = [[KrollContext alloc] init];
	context.delegate = self;
	[context start];
}

- (void)evalJSWithoutResult:(NSString*)code
{
	[context evalJS:code];
}

// NOTE: this must only be called on the JS thread or an exception will be raised
- (id)evalJSAndWait:(NSString*)code
{
	return [context evalJSAndWait:code];
}

- (void)scriptError:(NSString*)message
{
    evaluationError = YES;
	[[TiApp app] showModalError:message];
}

-(BOOL)evaluationError
{
    return evaluationError;
}

- (void)evalFileOnThread:(NSString*)path context:(KrollContext*)context_ 
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
	NSError *error = nil;
	TiValueRef exception = NULL;
	
	TiContextRef jsContext = [context_ context];
	
	NSURL *url_ = [path hasPrefix:@"file:"] ? [NSURL URLWithString:path] : [NSURL fileURLWithPath:path];
	
	if (![path hasPrefix:@"/"] && ![path hasPrefix:@"file:"])
	{
		url_ = [NSURL URLWithString:path relativeToURL:url];
	}
	
	NSString *jcode = nil;
	
	if ([url_ isFileURL])
	{
		NSData *data = [TiUtils loadAppResource:url_];
		if (data==nil)
		{
			jcode = [NSString stringWithContentsOfFile:[url_ path] encoding:NSUTF8StringEncoding error:&error];
		}
		else
		{
			jcode = [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
		}
	}
	else
	{
		jcode = [NSString stringWithContentsOfURL:url_ encoding:NSUTF8StringEncoding error:&error];
	}
	
	if (error!=nil)
	{
		NSLog(@"[ERROR] Error loading path: %@, %@",path,error);
		
		// check for file not found a give a friendlier message
		if ([error code]==260 && [error domain]==NSCocoaErrorDomain)
		{
			[self scriptError:[NSString stringWithFormat:@"Could not find the file %@",[path lastPathComponent]]];
		}
		else 
		{
			[self scriptError:[NSString stringWithFormat:@"Error loading script %@. %@",[path lastPathComponent],[error description]]];
		}
		return;
	}
	
	const char *urlCString = [[url_ absoluteString] UTF8String];
	
	TiStringRef jsCode = TiStringCreateWithCFString((CFStringRef) jcode);
	TiStringRef jsURL = TiStringCreateWithUTF8CString(urlCString);
	
	// validate script
	// TODO: we do not need to do this in production app
	if (!TiCheckScriptSyntax(jsContext,jsCode,jsURL,1,&exception))
	{
		id excm = [KrollObject toID:context value:exception];
		DebugLog(@"[ERROR] Syntax Error = %@",[TiUtils exceptionMessage:excm]);
		[self scriptError:[TiUtils exceptionMessage:excm]];
	}
	
	// only continue if we don't have any exceptions from above
	if (exception == NULL)
	{
        if ([[self host] debugMode]) {
            TiDebuggerBeginScript(context_,urlCString);
        }
		
		TiEvalScript(jsContext, jsCode, NULL, jsURL, 1, &exception);
		
        if ([[self host] debugMode]) {
            TiDebuggerEndScript(context_);
        }

		if (exception!=NULL)
		{
			id excm = [KrollObject toID:context value:exception];
			DebugLog(@"[ERROR] Script Error = %@.",[TiUtils exceptionMessage:excm]);
			[self scriptError:[TiUtils exceptionMessage:excm]];
		}
        else {
            evaluationError = NO;
        }
	}
	
	TiStringRelease(jsCode);
	TiStringRelease(jsURL);
    
    [pool release];
}

- (void)evalFile:(NSString*)path callback:(id)callback selector:(SEL)selector
{
	[context invokeOnThread:self method:@selector(evalFileOnThread:context:) withObject:path callback:callback selector:selector];
}

- (void)evalFile:(NSString *)file
{
	[context invokeOnThread:self method:@selector(evalFileOnThread:context:) withObject:file condition:nil];
}

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(TiProxy*)thisObject_
{
	if (![listener isKindOfClass:[KrollCallback class]])
	{
		DebugLog(@"[ERROR] Listener callback is of a non-supported type: %@",[listener class]);
		return;
	}

	KrollEvent *event = [[KrollEvent alloc] initWithCallback:listener eventObject:obj thisObject:thisObject_];
	[context enqueue:event];
	[event release];
}

-(void)enqueueEvent:(NSString*)type forProxy:(TiProxy *)proxy withObject:(id)obj
{
	KrollObject* eventKrollObject = [self krollObjectForProxy:proxy];
    
	KrollEvent * newEvent = [[KrollEvent alloc] 
                             initWithType:type 
                             ForKrollObject:eventKrollObject
                             eventObject:obj 
                             thisObject:eventKrollObject];
    
	[context enqueue:newEvent];
	[newEvent release];
}

-(void)shutdown:(NSCondition*)condition
{
#if KROLLBRIDGE_MEMORY_DEBUG==1
	NSLog(@"[MEMORY DEBUG] DESTROY: %@",self);
#endif
	
	if (shutdown==NO)
	{
		shutdownCondition = [condition retain];
		shutdown = YES;
		// fire a notification event to our listeners
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		NSNotification *notification = [NSNotification notificationWithName:kTiContextShutdownNotification object:self];
		[[NSNotificationCenter defaultCenter] postNotification:notification];
		
		[context stop];
	}
	else
	{
		[condition lock];
		[condition signal];
		[condition unlock];
	}
}

-(void)gc
{
	[context gc];
	[titanium gc];
}

#pragma mark Delegate

-(void)willStartNewContext:(KrollContext*)kroll
{
	[self retain]; // Hold onto ourselves as long as the context needs us
}

-(void)didStartNewContext:(KrollContext*)kroll
{
	// create Titanium global object
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
    // Load the "Titanium" object into the global scope
	NSString *basePath = (url==nil) ? [TiHost resourcePath] : [[[url path] stringByDeletingLastPathComponent] stringByAppendingPathComponent:@"."];
	titanium = [[TitaniumObject alloc] initWithContext:kroll host:host context:self baseURL:[NSURL fileURLWithPath:basePath]];
	
	TiContextRef jsContext = [kroll context];
	TiValueRef tiRef = [KrollObject toValue:kroll value:titanium];
	
	NSString *titaniumNS = [NSString stringWithFormat:@"T%sanium","it"];
	TiStringRef prop = TiStringCreateWithCFString((CFStringRef) titaniumNS);
	TiStringRef prop2 = TiStringCreateWithCFString((CFStringRef) [NSString stringWithFormat:@"%si","T"]);
	TiObjectRef globalRef = TiContextGetGlobalObject(jsContext);
	TiObjectSetProperty(jsContext, globalRef, prop, tiRef,
                        kTiPropertyAttributeDontDelete | kTiPropertyAttributeDontEnum, 
                        NULL);
	TiObjectSetProperty(jsContext, globalRef, prop2, tiRef, 
                        kTiPropertyAttributeDontDelete | kTiPropertyAttributeDontEnum, 
                        NULL);
	TiStringRelease(prop);
	TiStringRelease(prop2);	
    
    // Load the "console" object into the global scope
    console = [[KrollObject alloc] initWithTarget:[[[TiConsole alloc] _initWithPageContext:self] autorelease] context:kroll];
    prop = TiStringCreateWithCFString((CFStringRef)@"console");
    TiObjectSetProperty(jsContext, globalRef, prop, [KrollObject toValue:kroll value:console], kTiPropertyAttributeNone, NULL);
	
	//if we have a preload dictionary, register those static key/values into our namespace
	if (preload!=nil)
	{
		for (NSString *name in preload)
		{
			KrollObject *ti = (KrollObject*)[titanium valueForKey:name];
			NSDictionary *values = [preload valueForKey:name];
			for (id key in values)
			{
				id target = [values objectForKey:key];
				KrollObject *ko = [self krollObjectForProxy:target];
				if (ko==nil)
				{
					ko = [self registerProxy:target];
				}
				[ti noteKrollObject:ko forKey:key];
				[ti setStaticValue:ko forKey:key purgable:NO];
			}
		}
		[self evalFile:[url path] callback:self selector:@selector(booted)];	
	}
	else 
	{
		// now load the app.js file and get started
		NSURL *startURL = [host startURL];
		[self evalFile:[startURL absoluteString] callback:self selector:@selector(booted)];
	}
    
    [pool release];
}

-(void)willStopNewContext:(KrollContext*)kroll
{
	if (shutdown==NO)
	{
		shutdown = YES;
		// fire a notification event to our listeners
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		NSNotification *notification = [NSNotification notificationWithName:kTiContextShutdownNotification object:self];
		[[NSNotificationCenter defaultCenter] postNotification:notification];
	}
	[titanium gc];
	
	if (shutdownCondition)
	{
		[shutdownCondition lock];
		[shutdownCondition signal];
		[shutdownCondition unlock];
		RELEASE_TO_NIL(shutdownCondition);
	}
}

-(void)didStopNewContext:(KrollContext*)kroll
{
	TiThreadPerformOnMainThread(^{[self unregisterForMemoryWarning];}, NO);
	[self removeProxies];
	RELEASE_TO_NIL(titanium);
    RELEASE_TO_NIL(console);
	RELEASE_TO_NIL(context);
	RELEASE_TO_NIL(preload);
	[self autorelease]; // Safe to release now that the context is done
}

-(void)registerProxy:(id)proxy krollObject:(KrollObject *)ourKrollObject
{
	OSSpinLockLock(&proxyLock);
	if (registeredProxies==NULL)
	{
		registeredProxies = CFDictionaryCreateMutable(NULL, 10, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
	}
	//NOTE: Do NOT treat registeredProxies like a mutableDictionary; mutable dictionaries copy keys,
	//CFMutableDictionaryRefs only retain keys, which lets them work with proxies properly.

	CFDictionaryAddValue(registeredProxies, proxy, ourKrollObject);	
	OSSpinLockUnlock(&proxyLock);
	[proxy boundBridge:self withKrollObject:ourKrollObject];
}

- (id)registerProxy:(id)proxy 
{
	KrollObject * ourKrollObject = [self krollObjectForProxy:proxy];
	
	if (ourKrollObject != nil)
	{
		return ourKrollObject;
	}

	if (![context isKJSThread])
	{
		return nil;
	}

#ifdef KROLL_COVERAGE
	ourKrollObject = [[KrollCoverageObject alloc] initWithTarget:proxy context:context];
#else
	ourKrollObject = [[KrollObject alloc] initWithTarget:proxy context:context];
#endif

	[self registerProxy:proxy krollObject:ourKrollObject];
	return [ourKrollObject autorelease];
}

- (void)unregisterProxy:(id)proxy
{
	OSSpinLockLock(&proxyLock);
	if (registeredProxies != NULL)
	{
		CFDictionaryRemoveValue(registeredProxies, proxy);
		//Don't bother with removing the empty registry. It's small and leaves on dealloc anyways.
	}
	OSSpinLockUnlock(&proxyLock);
	[proxy unboundBridge:self];
}

- (BOOL)usesProxy:(id)proxy
{
	if (proxy == nil)
	{
		return NO;
	}
	BOOL result=NO;
	OSSpinLockLock(&proxyLock);
	
	if (registeredProxies != NULL)
	{
		result = (CFDictionaryGetCountOfKey(registeredProxies, proxy) != 0);
	}
	OSSpinLockUnlock(&proxyLock);
	return result;
}

- (id)krollObjectForProxy:(id)proxy
{
	id result=nil;
	OSSpinLockLock(&proxyLock);
	if (registeredProxies != NULL)
	{
		result = (id)CFDictionaryGetValue(registeredProxies, proxy);
	}
	OSSpinLockUnlock(&proxyLock);
	return result;
}

-(id)loadCommonJSModule:(NSString*)code withSourceURL:(NSURL *)sourceURL
{
	NSString *js = [[NSString alloc] initWithFormat:TitaniumModuleRequireFormat,code];

	/* This most likely should be integrated with normal code flow, but to
	 * minimize impact until a in-depth reconsideration of KrollContext can be
	 * done, we should have as little footprint 
	 */
	KrollEval *eval = [[KrollEval alloc] initWithCode:js sourceURL:sourceURL startingLineNo:1];
	TiValueRef exception = NULL;
	TiValueRef resultRef = [eval jsInvokeInContext:context exception:&exception];
	[js release];
	[eval release];
	
	if (exception != NULL) {
		id excm = [KrollObject toID:context value:exception];
		DebugLog(@"[ERROR] Script Error = %@",[TiUtils exceptionMessage:excm]);
		fflush(stderr);
		@throw excm;
	}
	/*
	 *	In order to work around the underlying issue of TIMOB-2392, we must
	 *	use KrollWrapper as a JS wrapper instead of converting it to a proxy
	 */

	KrollWrapper * result = [[KrollWrapper alloc] init];
	[result setBridge:self];
	[result setJsobject:(TiObjectRef)resultRef];
	[result protectJsobject];
	
	return [result autorelease];
}

-(NSString*)pathToModuleClassName:(NSString*)path
{
	//TODO: switch to use ApplicationMods
	
	NSArray *tokens = [path componentsSeparatedByString:@"."];
	NSMutableString *modulename = [NSMutableString string];
	for (NSString *token in tokens)
	{
		[modulename appendFormat:@"%@%@",[[token substringToIndex:1] uppercaseString],[token substringFromIndex:1]];
	}
	[modulename appendString:@"Module"];
	return modulename;
}

-(id)require:(KrollContext*)kroll path:(NSString*)path
{
	TiModule* module = nil;
	NSData *data = nil;
	NSString *filepath = nil;
    NSString* fullPath = nil;
    NSURL* oldURL = [self currentURL];
    
    // Check the position of the first '/', which will give some information
    // about resource resolution and if the path is absolute.
    //
    // TODO: This violates commonjs 1.1 and there is some ongoing discussion about whether or not
    // it should make a path absolute.
    NSRange separatorLocation = [path rangeOfString:@"/"];
    NSString* workingPath = [oldURL relativePath];
    if (separatorLocation.location == 0) {
        fullPath = [path substringFromIndex:1];
    }
    else {
        fullPath = path;
    }
    NSString* moduleID = nil;
    NSString* leadingComponent = [[fullPath pathComponents] objectAtIndex:0];
    BOOL isAbsolute = !([leadingComponent isEqualToString:@"."] || [leadingComponent isEqualToString:@".."]);
    
    
    if (isAbsolute) {
        moduleID = [[fullPath pathComponents] objectAtIndex:0];
    }
    else {
        fullPath = (workingPath != nil) ? 
            [[workingPath stringByAppendingPathComponent:[fullPath stringByStandardizingPath]] stringByStandardizingPath] : 
            [fullPath stringByStandardizingPath];
        moduleID = [[fullPath pathComponents] objectAtIndex:0];
    }
    

	// Now that we have the full path, we can check and see if the module was loaded,
    // and return it if available.
    if (modules!=nil)
	{
		module = [modules objectForKey:fullPath];
		if (module!=nil)
		{
			return module;
		}
	}

    separatorLocation = [fullPath rangeOfString:@"/"];
    NSString* moduleClassName = [self pathToModuleClassName:moduleID];
    Class moduleClass = NSClassFromString(moduleClassName);

    if (moduleClass != nil) {
        // We have a module to load resources from! Now we need to determine if
        // it's a base module (which should be cached) or a pure JS resource
        // stored on the module.

        module = [modules objectForKey:moduleID];
            
        if (module == nil) {
            module = [[moduleClass alloc] _initWithPageContext:self];
            [module setHost:host];
            [module _setName:moduleClassName];
            [modules setObject:module forKey:moduleID];
            [module autorelease];
        }
        
        // TODO: Support package.json 'main' file identifier which will load instead
        // of module JS. Currently neither iOS nor Android support package information.
        if (separatorLocation.location == NSNotFound) { // Indicates toplevel module
loadNativeJS:
            if ([module isJSModule]) {
                data = [module moduleJS];
            }
            [self setCurrentURL:[NSURL URLWithString:fullPath relativeToURL:[[self host] baseURL]]];
        }
        else {
            NSString* assetPath = [fullPath substringFromIndex:separatorLocation.location+1];
            // Handle the degenerate case (supported by MW) where we're loading
            // module.id/module.id, which should resolve to module.id and mixin.
            // Rather than create a utility method for this (or C&P if native loading changes)
            // we use a goto to jump into the if block above.
            
            if ([assetPath isEqualToString:moduleID]) {
                goto loadNativeJS;
            }
            
            NSString* filepath = [assetPath stringByAppendingString:@".js"];
            data = [module loadModuleAsset:filepath];
            // Have to reset module so that this code doesn't get mixed in and is loaded as pure JS            
            module = nil; 
        }
        
        if (data == nil && isAbsolute) {
            // We may have an absolute URL which tried to load from a module instead of a directory. Fix
            // the fullpath back to the right value, so we can try again.
            fullPath = [path substringFromIndex:1];
        }
        else if (data != nil) {
            // Set the current URL; it should be the fullPath relative to the host's base URL.
            [self setCurrentURL:[NSURL URLWithString:[fullPath stringByDeletingLastPathComponent] relativeToURL:[[self host] baseURL]]];
        }
    }
	
	if (data==nil)
	{
		filepath = [fullPath stringByAppendingString:@".js"];
        NSURL* url_ = [NSURL URLWithString:filepath relativeToURL:[[self host] baseURL]];
        data = [TiUtils loadAppResource:url_];
        
        if (data == nil) {
            data = [NSData dataWithContentsOfURL:url_];
        }
        
        if (data != nil) {
            [self setCurrentURL:[NSURL URLWithString:[fullPath stringByDeletingLastPathComponent] relativeToURL:[[self host] baseURL]]];
        }
	}

	// we found data, now create the common js module proxy
	if (data!=nil)
	{
        NSString* urlPath = (filepath != nil) ? filepath : fullPath;
		NSURL *url_ = [TiHost resourceBasedURL:urlPath baseURL:NULL];
       	const char *urlCString = [[url_ absoluteString] UTF8String];
        KrollWrapper* wrapper = nil;
        
        if ([[self host] debugMode] && ![module isJSModule]) {
            TiDebuggerBeginScript([self krollContext],urlCString);
        }
        
		NSString * dataContents = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
		wrapper = [self loadCommonJSModule:dataContents withSourceURL:url_];
        [dataContents release];
		
        if ([[self host] debugMode] && ![module isJSModule]) {
            TiDebuggerEndScript([self krollContext]);
        }
        
		if (![wrapper respondsToSelector:@selector(replaceValue:forKey:notification:)]) {
            [self setCurrentURL:oldURL];
			@throw [NSException exceptionWithName:@"org.appcelerator.kroll" 
                                           reason:[NSString stringWithFormat:@"Module \"%@\" failed to leave a valid exports object",path] 
                                         userInfo:nil];
		}
		
		// register the module if it's pure JS
        if (module == nil) {
            module = (id)wrapper;
            
            [modules setObject:module forKey:fullPath];
            if (filepath!=nil && module!=nil)
            {
                // uri is optional but we point it to where we loaded it
                [module replaceValue:[NSString stringWithFormat:@"app://%@",filepath] forKey:@"uri" notification:NO];
            }
        }
        else {
            // For right now, we need to mix any compiled JS on top of a compiled module, so that both components
            // are accessible. We store the exports object and then put references to its properties on the toplevel
            // object.
            
            TiContextRef jsContext = [[self krollContext] context];
            TiObjectRef jsObject = [wrapper jsobject];
            KrollObject* moduleObject = [module krollObjectForContext:[self krollContext]];
            [moduleObject noteObject:jsObject forTiString:kTiStringExportsKey context:jsContext];
            
            TiPropertyNameArrayRef properties = TiObjectCopyPropertyNames(jsContext, jsObject);
            size_t count = TiPropertyNameArrayGetCount(properties);
            for (size_t i=0; i < count; i++) {
                // Mixin the property onto the module JS object if it's not already there
                TiStringRef propertyName = TiPropertyNameArrayGetNameAtIndex(properties, i);
                if (!TiObjectHasProperty(jsContext, [moduleObject jsobject], propertyName)) {
                    TiValueRef property = TiObjectGetProperty(jsContext, jsObject, propertyName, NULL);
                    TiObjectSetProperty([[self krollContext] context], [moduleObject jsobject], propertyName, property, kTiPropertyAttributeReadOnly, NULL);
                }
            }
            TiPropertyNameArrayRelease(properties);
        }
	}
	
    [self setCurrentURL:oldURL];
	if (module!=nil)
	{
		// spec says you must have a read-only id property - we don't
		// currently support readonly in kroll so this is probably OK for now
		[module replaceValue:path forKey:@"id" notification:NO];
		return module;
	}
	
	@throw [NSException exceptionWithName:@"org.appcelerator.kroll" reason:[NSString stringWithFormat:@"Couldn't find module: %@",path] userInfo:nil];
}

+ (NSArray *)krollBridgesUsingProxy:(id)proxy
{
	NSMutableArray * results = nil;

	OSSpinLockLock(&krollBridgeRegistryLock);
	int bridgeCount = CFSetGetCount(krollBridgeRegistry);
	KrollBridge * registryObjects[bridgeCount];
	CFSetGetValues(krollBridgeRegistry, (const void **)registryObjects);
	
	for (int currentBridgeIndex = 0; currentBridgeIndex < bridgeCount; currentBridgeIndex++)
	{
		KrollBridge * currentBridge = registryObjects[currentBridgeIndex];
		if (![currentBridge usesProxy:proxy])
		{
			continue;
		}
		if (results == nil)
		{
			results = [NSMutableArray arrayWithObject:currentBridge];
			continue;
		}
		[results addObject:currentBridge];
	}

	//Why do we wait so long? In case someone tries to dealloc the krollBridge while we're looking at it.
	//registryObjects nor the registry does a retain here!
	OSSpinLockUnlock(&krollBridgeRegistryLock);
	return results;
}

+ (BOOL)krollBridgeExists:(KrollBridge *)bridge
{
	if(bridge == nil)
	{
		return NO;
	}

	bool result=NO;
	OSSpinLockLock(&krollBridgeRegistryLock);
	int bridgeCount = CFSetGetCount(krollBridgeRegistry);
	KrollBridge * registryObjects[bridgeCount];
	CFSetGetValues(krollBridgeRegistry, (const void **)registryObjects);
	for (int currentBridgeIndex = 0; currentBridgeIndex < bridgeCount; currentBridgeIndex++)
	{
		KrollBridge * currentBridge = registryObjects[currentBridgeIndex];
		if (currentBridge == bridge)
		{
			result = YES;
			break;
		}
	}
	//Why not CFSetContainsValue? Because bridge may not be a valid pointer, and SetContainsValue
	//will ask it for a hash!
	OSSpinLockUnlock(&krollBridgeRegistryLock);

	return result;
}

+ (KrollBridge *)krollBridgeForThreadName:(NSString *)threadName;
{
	if(threadName == nil)
	{
		return nil;
	}

	KrollBridge * result=nil;
	OSSpinLockLock(&krollBridgeRegistryLock);
	int bridgeCount = CFSetGetCount(krollBridgeRegistry);
	KrollBridge * registryObjects[bridgeCount];
	CFSetGetValues(krollBridgeRegistry, (const void **)registryObjects);
	for (int currentBridgeIndex = 0; currentBridgeIndex < bridgeCount; currentBridgeIndex++)
	{
		KrollBridge * currentBridge = registryObjects[currentBridgeIndex];
		if ([[[currentBridge krollContext] threadName] isEqualToString:threadName])
		{
			result = [[currentBridge retain] autorelease];
			break;
		}
	}
	OSSpinLockUnlock(&krollBridgeRegistryLock);

	return result;
}


-(int)forceGarbageCollectNow;
{
	[context gc];
	//Actually forcing garbage collect now will cause a deadlock.
	return 0;
}

-(BOOL)shouldDebugContext
{
    return [[self host] debugMode];
}

@end