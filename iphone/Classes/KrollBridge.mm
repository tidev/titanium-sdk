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

#ifdef DEBUGGER_ENABLED
#import "TiDebuggerContext.h"
#import "TiDebugger.h"
#endif

extern BOOL const TI_APPLICATION_ANALYTICS;

@implementation TitaniumObject

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
		
		// pre-cache a few modules we always use
		TiModule *ui = [host moduleNamed:@"UI" context:pageContext_];
		[self addModule:@"UI" module:ui];
		
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
	NSLog(@"RETAIN: %@ (%d)",self,[self retainCount]+1);
	return [super retain];
}
-(oneway void)release 
{
	NSLog(@"RELEASE: %@ (%d)",self,[self retainCount]-1);
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
	[modules removeAllObjects];
	[properties removeAllObjects];
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

-(KrollObject*)addModule:(NSString*)name module:(TiModule*)module
{
	KrollObject *ko = [[[KrollObject alloc] initWithTarget:module context:context] autorelease];
	[modules setObject:ko forKey:name];
	return ko;
}

-(TiModule*)moduleNamed:(NSString*)name context:(id<TiEvaluator>)context
{
	return [modules objectForKey:name];
}

@end


@implementation KrollBridge

-(id)init
{
	if (self = [super init])
	{
#if KROLLBRIDGE_MEMORY_DEBUG==1
		NSLog(@"INIT: %@",self);
#endif
		[[NSNotificationCenter defaultCenter] addObserver:self
												 selector:@selector(didReceiveMemoryWarning:)
													 name:UIApplicationDidReceiveMemoryWarningNotification  
												   object:nil]; 
	}
	return self;
}

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	if (proxies!=nil)
	{
		SEL sel = @selector(didReceiveMemoryWarning:);
		// we have to copy during traversal since proxies can be removed during
		for (id proxy in [NSArray arrayWithArray:proxies])
		{
			if ([proxy respondsToSelector:sel])
			{
				[proxy didReceiveMemoryWarning:notification];
			}
		}
	}
}


#if KROLLBRIDGE_MEMORY_DEBUG==1
-(id)retain
{
	NSLog(@"RETAIN: %@ (%d)",self,[self retainCount]+1);
	return [super retain];
}
-(oneway void)release 
{
	NSLog(@"RELEASE: %@ (%d)",self,[self retainCount]-1);
	[super release];
}
#endif

-(void)removeProxies
{
	if (proxies!=nil)
	{
		SEL sel = @selector(contextShutdown:);
		while ([proxies count] > 0)
		{
			id proxy = [proxies objectAtIndex:0];
			[proxy retain]; // hold while we work
			[proxies removeObjectAtIndex:0];
			if ([proxy respondsToSelector:sel])
			{
				[proxy contextShutdown:self];
			}
			[proxy release];
		}
	}
	RELEASE_TO_NIL(proxies);
}

-(void)dealloc
{
#if KROLLBRIDGE_MEMORY_DEBUG==1
	NSLog(@"DEALLOC: %@",self);
#endif
	
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
	
	[self removeProxies];
	RELEASE_TO_NIL(preload);
	RELEASE_TO_NIL(context);
	RELEASE_TO_NIL(titanium);
	RELEASE_TO_NIL(modules);
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

- (id)preloadForKey:(id)key
{
	if (preload!=nil)
	{
		return [preload objectForKey:key];
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
	[[TiApp app] showModalError:message];
}

- (void)evalFileOnThread:(NSString*)path context:(KrollContext*)context_ 
{
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
		NSLog(@"[ERROR] error loading path: %@, %@",path,error);
		
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
	
	TiStringRef jsCode = TiStringCreateWithUTF8CString([jcode UTF8String]);
	TiStringRef jsURL = TiStringCreateWithUTF8CString(urlCString);
	
	// validate script
	// TODO: we do not need to do this in production app
	if (!TiCheckScriptSyntax(jsContext,jsCode,jsURL,1,&exception))
	{
		id excm = [KrollObject toID:context value:exception];
		NSLog(@"[ERROR] Syntax Error = %@",[TiUtils exceptionMessage:excm]);
		[self scriptError:[TiUtils exceptionMessage:excm]];
	}
	
	// only continue if we don't have any exceptions from above
	if (exception == NULL)
	{
#ifdef DEBUGGER_ENABLED
		Ti::TiDebuggerContext* debugger = static_cast<Ti::TiDebuggerContext*>([context_ debugger]);
		if (debugger!=NULL)
		{
			debugger->beginScriptEval(urlCString);
		}
#endif
		
		TiEvalScript(jsContext, jsCode, NULL, jsURL, 1, &exception);
		
#ifdef DEBUGGER_ENABLED		
		if (debugger!=NULL)
		{
			debugger->endScriptEval();
		}
#endif		
		if (exception!=NULL)
		{
			id excm = [KrollObject toID:context value:exception];
			NSLog(@"[ERROR] Script Error = %@.",[TiUtils exceptionMessage:excm]);
			[self scriptError:[TiUtils exceptionMessage:excm]];
		}
	}
	
	TiStringRelease(jsCode);
	TiStringRelease(jsURL);
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
	if ([listener isKindOfClass:[KrollCallback class]])
	{
		[context invokeEvent:listener args:[NSArray arrayWithObject:obj] thisObject:thisObject_];
	}
	else 
	{
		NSLog(@"[ERROR] listener callback is of a non-supported type: %@",[listener class]);
	}
	
}

-(void)injectPatches
{
	// called to inject any Titanium patches in JS before a context is loaded... nice for 
	// setting up backwards compat type APIs
	
	NSMutableString *js = [[NSMutableString alloc] init];
	[js appendString:@"function alert(msg) { Ti.UI.createAlertDialog({title:'Alert',message:msg}).show(); };"];
	[self evalJSWithoutResult:js];
	[js release];
}

-(void)shutdown:(NSCondition*)condition
{
#if KROLLBRIDGE_MEMORY_DEBUG==1
	NSLog(@"DESTROY: %@",self);
#endif
	
	if (shutdown==NO)
	{
		shutdownCondition = [condition retain];
		shutdown = YES;
		// fire a notification event to our listeners
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
}

-(void)didStartNewContext:(KrollContext*)kroll
{
	// create Titanium global object
	NSString *basePath = (url==nil) ? [[NSBundle mainBundle] resourcePath] : [[url path] stringByDeletingLastPathComponent];
	titanium = [[TitaniumObject alloc] initWithContext:kroll host:host context:self baseURL:[NSURL fileURLWithPath:basePath]];
	
	TiContextRef jsContext = [kroll context];
	TiValueRef tiRef = [KrollObject toValue:kroll value:titanium];
	
	NSString *titaniumNS = [NSString stringWithFormat:@"T%sanium","it"];
	TiStringRef prop = TiStringCreateWithUTF8CString([titaniumNS UTF8String]);
	TiStringRef prop2 = TiStringCreateWithUTF8CString([[NSString stringWithFormat:@"%si","T"] UTF8String]);
	TiObjectRef globalRef = TiContextGetGlobalObject(jsContext);
	TiObjectSetProperty(jsContext, globalRef, prop, tiRef, NULL, NULL);
	TiObjectSetProperty(jsContext, globalRef, prop2, tiRef, NULL, NULL);
	TiStringRelease(prop);
	TiStringRelease(prop2);	
	
	//if we have a preload dictionary, register those static key/values into our UI namespace
	//in the future we may support another top-level module but for now UI is only needed
	if (preload!=nil)
	{
		KrollObject *ti = (KrollObject*)[titanium valueForKey:@"UI"];
		for (id key in preload)
		{
			id target = [preload objectForKey:key];
			KrollObject *ko = [[KrollObject alloc] initWithTarget:target context:context];
			[ti setStaticValue:ko forKey:key];
			[ko release];
		}
		[self injectPatches];
		[self evalFile:[url path] callback:self selector:@selector(booted)];	
	}
	else 
	{
		// now load the app.js file and get started
		NSURL *startURL = [host startURL];
		[self injectPatches];
		[self evalFile:[startURL absoluteString] callback:self selector:@selector(booted)];
	}
}

-(void)willStopNewContext:(KrollContext*)kroll
{
	if (shutdown==NO)
	{
		shutdown = YES;
		// fire a notification event to our listeners
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
	[self removeProxies];
	RELEASE_TO_NIL(titanium);
	RELEASE_TO_NIL(context);
	RELEASE_TO_NIL(preload);
	RELEASE_TO_NIL(modules);
}

- (void)registerProxy:(id)proxy 
{
	if (proxies==nil)
	{ 
		CFArrayCallBacks callbacks = kCFTypeArrayCallBacks;
		callbacks.retain = NULL;
		callbacks.release = NULL; 
		proxies = (NSMutableArray*)CFArrayCreateMutable(nil, 50, &callbacks);
	}
	[proxies addObject:proxy];
}

- (void)unregisterProxy:(id)proxy
{
	if (proxies!=nil)
	{
		[proxies removeObject:proxy];
		if ([proxies count]==0)
		{
			RELEASE_TO_NIL(proxies);
		}
	}
}

-(id)loadCommonJSModule:(NSString*)code withPath:(NSString*)path
{
	NSMutableString *js = [NSMutableString string];
	
	[js appendString:@"(function(exports){"];
	[js appendString:code];
	[js appendString:@"return exports;"];
	[js appendString:@"})({})"];
	
	NSDictionary *result = [self evalJSAndWait:js];
	TiProxy *proxy = [[TiProxy alloc] _initWithPageContext:self];
	for (id key in result)
	{
		[proxy setValue:[result objectForKey:key] forUndefinedKey:key];
	}
	
	// register it
	[modules setObject:proxy forKey:path];
	
	return [proxy autorelease];
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
	
	// first check to see if we've already loaded the module
	// and if so, return it
	if (modules!=nil)
	{
		module = [modules objectForKey:path];
		if (module!=nil)
		{
			return module;
		}
	}
	
	// now see if this is a plus module that we need to dynamically
	// load and create
	NSString *moduleClassName = [self pathToModuleClassName:path];
	id moduleClass = NSClassFromString(moduleClassName);
	if (moduleClass!=nil)
	{
		module = [[moduleClass alloc] _initWithPageContext:self];
		// we might have a module that's simply a JS native module wrapper
		// in which case we simply load it and don't register our native module
		if ([module isJSModule])
		{
			data = [module moduleJS];
		}
		else
		{
			[module setHost:host];
			[module _setName:moduleClassName];
			// register it
			[modules setObject:module forKey:path];
		}
		[module autorelease];
	}
	
	if (data==nil)
	{
		filepath = [NSString stringWithFormat:@"%@.js",path];
		NSURL *url_ = [TiHost resourceBasedURL:filepath baseURL:NULL];
		data = [TiUtils loadAppResource:url_];
		if (data==nil)
		{
			data = [NSData dataWithContentsOfURL:url_];
		}
	}

	// we found data, now create the common js module proxy
	if (data!=nil)
	{
		module = [self loadCommonJSModule:[[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease] withPath:path];
		if (filepath!=nil && module!=nil)
		{
			// uri is optional but we point it to where we loaded it
			[module replaceValue:[NSString stringWithFormat:@"app://%@",filepath] forKey:@"uri" notification:NO];
		}
	}
	
	if (module!=nil)
	{
		// spec says you must have a read-only id property - we don't
		// currently support readonly in kroll so this is probably OK for now
		[module replaceValue:path forKey:@"id" notification:NO];
		return module;
	}
	
	@throw [NSException exceptionWithName:@"org.appcelerator.kroll" reason:[NSString stringWithFormat:@"Couldn't find module: %@",path] userInfo:nil];
}

@end