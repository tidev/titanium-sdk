/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <objc/runtime.h>

#import "TiProxy.h"
#import "TiHost.h"
#import "KrollCallback.h"
#import "KrollContext.h"
#import "KrollBridge.h"
#import "TiModule.h"
#import "ListenerEntry.h"
#import "TiComplexValue.h"
#import "TiViewProxy.h"

#include <libkern/OSAtomic.h>

//Common exceptions to throw when the function call was improper
NSString * const TiExceptionInvalidType = @"Invalid type passed to function";
NSString * const TiExceptionNotEnoughArguments = @"Invalid number of arguments to function";
NSString * const TiExceptionRangeError = @"Value passed to function exceeds allowed range";


NSString * const TiExceptionOSError = @"The iOS reported an error";


//Should be rare, but also useful if arguments are used improperly.
NSString * const TiExceptionInternalInconsistency = @"Value was not the value expected";

//Rare exceptions to indicate a bug in the titanium code (Eg, method that a subclass should have implemented)
NSString * const TiExceptionUnimplementedFunction = @"Subclass did not implement required method";

NSString * const TiExceptionMemoryFailure = @"Memory allocation failed";


SEL SetterForKrollProperty(NSString * key)
{
	NSString *method = [NSString stringWithFormat:@"set%@%@_:", [[key substringToIndex:1] uppercaseString], [key substringFromIndex:1]];
	return NSSelectorFromString(method);
}

SEL SetterWithObjectForKrollProperty(NSString * key)
{
	NSString *method = [NSString stringWithFormat:@"set%@%@_:withObject:", [[key substringToIndex:1] uppercaseString], [key substringFromIndex:1]];
	return NSSelectorFromString(method);
}

void DoProxyDelegateChangedValuesWithProxy(UIView<TiProxyDelegate> * target, NSString * key, id oldValue, id newValue, TiProxy * proxy)
{
	// default implementation will simply invoke the setter property for this object
	// on the main UI thread
	
	// first check to see if the property is defined by a <key>:withObject: signature
	SEL sel = SetterWithObjectForKrollProperty(key);
	if ([target respondsToSelector:sel])
	{
		id firstarg = newValue;
		id secondarg = [NSDictionary dictionary];
		
		if ([firstarg isKindOfClass:[TiComplexValue class]])
		{
			firstarg = [(TiComplexValue*)newValue value];
			secondarg = [(TiComplexValue*)newValue properties];
		}
		
		if ([NSThread isMainThread])
		{
			[target performSelector:sel withObject:firstarg withObject:secondarg];
		}
		else
		{
			if (![key hasPrefix:@"set"])
			{
				key = [NSString stringWithFormat:@"set%@%@_", [[key substringToIndex:1] uppercaseString], [key substringFromIndex:1]];
			}
			NSArray *arg = [NSArray arrayWithObjects:key,firstarg,secondarg,target,nil];
			TiThreadPerformOnMainThread(^{[proxy _dispatchWithObjectOnUIThread:arg];}, YES);
		}
		return;
	}
	
	sel = SetterForKrollProperty(key);
	if ([target respondsToSelector:sel])
	{
		TiThreadPerformOnMainThread(^{[target performSelector:sel withObject:newValue];}, YES);
	}
}

void DoProxyDispatchToSecondaryArg(UIView<TiProxyDelegate> * target, SEL sel, NSString *key, id newValue, TiProxy * proxy)
{
	id firstarg = newValue;
	id secondarg = [NSDictionary dictionary];
	
	if ([firstarg isKindOfClass:[TiComplexValue class]])
	{
		firstarg = [(TiComplexValue*)newValue value];
		secondarg = [(TiComplexValue*)newValue properties];
	}
	
	if ([NSThread isMainThread])
	{
		[target performSelector:sel withObject:firstarg withObject:secondarg];
	}
	else
	{
		if (![key hasPrefix:@"set"])
		{
			key = [NSString stringWithFormat:@"set%@%@_", [[key substringToIndex:1] uppercaseString], [key substringFromIndex:1]];
		}
		NSArray *arg = [NSArray arrayWithObjects:key,firstarg,secondarg,target,nil];
		TiThreadPerformOnMainThread(^{[proxy _dispatchWithObjectOnUIThread:arg];}, YES);
	}
}

void DoProxyDelegateReadKeyFromProxy(UIView<TiProxyDelegate> * target, NSString *key, TiProxy * proxy, NSNull * nullValue, BOOL useThisThread)
{
	// use valueForUndefined since this should really come from dynprops
	// not against the real implementation
	id value = [proxy valueForUndefinedKey:key];
	if (value == nil)
	{
		return;
	}
	if (value == nullValue)
	{
		value = nil;
	}

	SEL sel = SetterWithObjectForKrollProperty(key);
	if ([target respondsToSelector:sel])
	{
		DoProxyDispatchToSecondaryArg(target,sel,key,value,proxy);
		return;
	}
	sel = SetterForKrollProperty(key);
	if (![target respondsToSelector:sel])
	{
		return;
	}
	if (useThisThread)
	{
		[target performSelector:sel withObject:value];
	}
	else
	{
		TiThreadPerformOnMainThread(^{[target performSelector:sel withObject:value];}, NO);
	}
}

void DoProxyDelegateReadValuesWithKeysFromProxy(UIView<TiProxyDelegate> * target, id<NSFastEnumeration> keys, TiProxy * proxy)
{
	BOOL isMainThread = [NSThread isMainThread];
	NSNull * nullObject = [NSNull null];
	BOOL viewAttached = YES;
		
	NSArray * keySequence = [proxy keySequence];
	
	// assume if we don't have a view that we can send on the 
	// main thread to the proxy
	if ([target isKindOfClass:[TiViewProxy class]])
	{
		viewAttached = [(TiViewProxy*)target viewAttached];
	}
	
	BOOL useThisThread = isMainThread==YES || viewAttached==NO;

	for (NSString * thisKey in keySequence)
	{
		DoProxyDelegateReadKeyFromProxy(target, thisKey, proxy, nullObject, useThisThread);
	}

	
	for (NSString * thisKey in keys)
	{
		if ([keySequence containsObject:thisKey])
		{
			continue;
		}
		DoProxyDelegateReadKeyFromProxy(target, thisKey, proxy, nullObject, useThisThread);
	}
}



@implementation TiProxy

@synthesize pageContext, executionContext;
@synthesize modelDelegate;


#pragma mark Private

-(id)init
{
	if (self = [super init])
	{
#if PROXY_MEMORY_TRACK == 1
		NSLog(@"[DEBUG] INIT: %@ (%d)",self,[self hash]);
#endif
		pthread_rwlock_init(&listenerLock, NULL);
		pthread_rwlock_init(&dynpropsLock, NULL);
	}
	return self;
}

-(void)initializeProperty:(NSString*)name defaultValue:(id)value
{
    pthread_rwlock_wrlock(&dynpropsLock);
    if (dynprops == nil) {
        dynprops = [[NSMutableDictionary alloc] init];
    }
    if ([dynprops valueForKey:name] == nil) {
        [dynprops setValue:((value == nil) ? [NSNull null] : value) forKey:name];
    }
    pthread_rwlock_unlock(&dynpropsLock);
}

+(BOOL)shouldRegisterOnInit
{
	return YES;
}

-(id)_initWithPageContext:(id<TiEvaluator>)context
{
	if (self = [self init])
	{
		pageContext = (id)context; // do not retain
		executionContext = context; //To ensure there is an execution context during _configure.
		if([[self class] shouldRegisterOnInit]) // && ![NSThread isMainThread])
		{
			[pageContext registerProxy:self];
			// allow subclasses to configure themselves
		}
		[self _configure];
		executionContext = nil;
	}
	return self;
}

-(void)setModelDelegate:(id <TiProxyDelegate>)md
{
	// TODO; revisit modelDelegate/TiProxy typing issue
    if ((void*)modelDelegate != self) {
        RELEASE_TO_NIL(modelDelegate);
    }
    
    if ((void*)md != self) {
        modelDelegate = [md retain];
    }
    else {
        modelDelegate = md;
    }
}

/*
 *	Currently, Binding/unbinding bridges does nearly nothing but atomically
 *	increment or decrement. In the future, error checking could be done, or
 *	when unbinding from the pageContext, to clear it. This might also be a
 *	replacement for contextShutdown and friends, as contextShutdown is
 *	called ONLY when a proxy is still registered with a context as it
 *	is shutting down.
 */

-(void)boundBridge:(id<TiEvaluator>)newBridge withKrollObject:(KrollObject *)newKrollObject
{
	OSAtomicIncrement32(&bridgeCount);
	if (newBridge == pageContext) {
		pageKrollObject = newKrollObject;
	}
}

-(void)unboundBridge:(id<TiEvaluator>)oldBridge
{
	if(OSAtomicDecrement32(&bridgeCount)<0)
	{
		DeveloperLog(@"[WARN] BridgeCount for %@ is now at %d",self,bridgeCount);
	}
	if(oldBridge == pageContext) {
		pageKrollObject = nil;
	}
}

-(void)contextWasShutdown:(id<TiEvaluator>)context
{
}

-(void)contextShutdown:(id)sender
{
	id<TiEvaluator> context = (id<TiEvaluator>)sender;

	[self contextWasShutdown:context];
	if(pageContext == context){
		//TODO: Should we really stay bug compatible with the old behavior?
		//I think we should instead have it that the proxy stays around until
		//it's no longer referenced by any contexts at all.
		[self _destroy];
		pageContext = nil;
		pageKrollObject = nil;
	}
}

-(void)setExecutionContext:(id<TiEvaluator>)context
{
	// the execution context is different than the page context
	//
	// the page context is the owning context that created (and thus owns) the proxy
	//
	// the execution context is the context which is executing against the context when 
	// this proxy is being touched.  since objects can be referenced from one context 
	// in another, the execution context should be used to resolve certain things like
	// paths, etc. so that the proper context can be contextualized which is different
	// than the owning context (page context).
	//
	
	/*
	 *	In theory, if two contexts are both using the proxy at the same time,
	 *	bad things could happen since this value will be overwritten.
	 *	TODO: Investigate thread safety of this, or to moot it.
	 */
	
	executionContext = context; //don't retain
}

-(void)_initWithProperties:(NSDictionary*)properties
{
	[self setValuesForKeysWithDictionary:properties];
}

-(void)_initWithCallback:(KrollCallback*)callback
{
}

-(void)_configure
{
	// for subclasses
}

-(id)_initWithPageContext:(id<TiEvaluator>)context_ args:(NSArray*)args
{
	if (self = [self _initWithPageContext:context_])
	{
		// If we are being created with a page context, assume that this is also
		// the execution context during creation so that recursively-made
		// proxies have the same page context.
		executionContext = context_;
		id a = nil;
		int count = [args count];
		
		if (count > 0 && [[args objectAtIndex:0] isKindOfClass:[NSDictionary class]])
		{
			a = [args objectAtIndex:0];
		}
		
		if (count > 1 && [[args objectAtIndex:1] isKindOfClass:[KrollCallback class]])
		{
			[self _initWithCallback:[args objectAtIndex:1]];
		}
		
		[self _initWithProperties:a];
		executionContext = nil;
	}
	return self;
}

-(void)_destroy
{
	if (destroyed)
	{
		return;
	}
	
	destroyed = YES;
	
#if PROXY_MEMORY_TRACK == 1
	NSLog(@"[DEBUG] DESTROY: %@ (%d)",self,[self hash]);
#endif

	if ((bridgeCount == 1) && (pageKrollObject != nil) && (pageContext != nil))
	{
		[pageContext unregisterProxy:self];
	}
	else if (bridgeCount > 1)
	{
		NSArray * pageContexts = [KrollBridge krollBridgesUsingProxy:self];
		for (id thisPageContext in pageContexts)
		{
			[thisPageContext unregisterProxy:self];
		}		
	}
	
	if (executionContext!=nil)
	{
		executionContext = nil;
	}
	
	// remove all listeners JS side proxy
	pthread_rwlock_wrlock(&listenerLock);
	RELEASE_TO_NIL(listeners);
	pthread_rwlock_unlock(&listenerLock);
	
	pthread_rwlock_wrlock(&dynpropsLock);
	RELEASE_TO_NIL(dynprops);
	pthread_rwlock_unlock(&dynpropsLock);
	
	RELEASE_TO_NIL(baseURL);
	RELEASE_TO_NIL(krollDescription);
    if ((void*)modelDelegate != self) {
		TiThreadReleaseOnMainThread(modelDelegate, YES);
        modelDelegate = nil;
    }
	pageContext=nil;
	pageKrollObject = nil;
}

-(BOOL)destroyed
{
	return destroyed;
}

-(void)dealloc
{
#if PROXY_MEMORY_TRACK == 1
	NSLog(@"[DEBUG] DEALLOC: %@ (%d)",self,[self hash]);
#endif
	[self _destroy];
	pthread_rwlock_destroy(&listenerLock);
	pthread_rwlock_destroy(&dynpropsLock);
	[super dealloc];
}

-(TiHost*)_host
{
	if (pageContext==nil && executionContext==nil)
	{
		return nil;
	}
	if (pageContext!=nil)
	{
		TiHost *h = [pageContext host];
		if (h!=nil)
		{
			return h;
		}
	}
	if (executionContext!=nil)
	{
		return [executionContext host];
	}
	return nil;
}

-(TiProxy*)currentWindow
{
	return [[self pageContext] preloadForKey:@"currentWindow" name:@"UI"];
}

-(NSURL*)_baseURL
{
	if (baseURL==nil)
	{
		TiProxy *currentWindow = [self currentWindow];
		if (currentWindow!=nil)
		{
			// cache it
			[self _setBaseURL:[currentWindow _baseURL]];
			return baseURL;
		}
		return [[self _host] baseURL];
	}
	return baseURL;
}

-(void)_setBaseURL:(NSURL*)url
{
	if (url!=baseURL)
	{
		RELEASE_TO_NIL(baseURL);
		baseURL = [[url absoluteURL] retain];
	} 
}

-(void)setReproxying:(BOOL)yn
{
	reproxying = yn;
}

-(BOOL)inReproxy
{
	return reproxying;
}


-(BOOL)_hasListeners:(NSString*)type
{
	pthread_rwlock_rdlock(&listenerLock);
	//If listeners is nil at this point, result is still false.
	BOOL result = [[listeners objectForKey:type] intValue]>0;
	pthread_rwlock_unlock(&listenerLock);
	return result;
}

-(void)_fireEventToListener:(NSString*)type withObject:(id)obj listener:(KrollCallback*)listener thisObject:(TiProxy*)thisObject_
{
	TiHost *host = [self _host];
	
	NSMutableDictionary* eventObject = nil;
	if ([obj isKindOfClass:[NSDictionary class]])
	{
		eventObject = [NSMutableDictionary dictionaryWithDictionary:obj];
	}
	else 
	{
		eventObject = [NSMutableDictionary dictionary];
	}
	
	// common event properties for all events we fire.. IF they're undefined.
    if ([eventObject objectForKey:@"type"] == nil) {
        [eventObject setObject:type forKey:@"type"];
    }
    if ([eventObject objectForKey:@"source"] == nil) {
        [eventObject setObject:self forKey:@"source"];
    }
	
	KrollContext* context = [listener context];
	if (context!=nil)
	{
		id<TiEvaluator> evaluator = (id<TiEvaluator>)context.delegate;
		[host fireEvent:listener withObject:eventObject remove:NO context:evaluator thisObject:thisObject_];
	}
}

-(void)_listenerAdded:(NSString*)type count:(int)count
{
	// for subclasses
}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	// for subclasses
}

// this method will allow a proxy to return a different object back
// for itself when the proxy serialization occurs from native back
// to the bridge layer - the default is to just return ourselves, however,
// in some concrete implementations you really want to return a different
// representation which this will allow. the resulting value should not be 
// retained
-(id)_proxy:(TiProxyBridgeType)type
{
	return self;
}

#pragma mark Public

-(id<NSFastEnumeration>)allKeys
{
	pthread_rwlock_rdlock(&dynpropsLock);
	id<NSFastEnumeration> keys = [dynprops allKeys];
	pthread_rwlock_unlock(&dynpropsLock);
	
	return keys;
}

/*
 *	In views where the order in which keys are applied matter (I'm looking at you, TableView), this should be
 *  an array of which keys go first, and in what order. Otherwise, this is nil.
 */
-(NSArray *)keySequence
{
	return nil;
}

-(KrollObject *)krollObjectForBridge:(KrollBridge *)bridge
{
	if ((pageContext == bridge) && (pageKrollObject != NULL))
	{
		return pageKrollObject;
	}
		
	if(![bridge usesProxy:self])
	{
		DeveloperLog(@"[DEBUG] Proxy %@ may be missing its javascript representation.", self);
	}
	
	return [bridge krollObjectForProxy:self];
}

-(KrollObject *)krollObjectForContext:(KrollContext *)context
{
	if ([pageKrollObject context] == context)
	{
		return pageKrollObject;
	}

	KrollBridge * ourBridge = (KrollBridge *)[context delegate];
	
	if(![ourBridge usesProxy:self])
	{
		DeveloperLog(@"[DEBUG] Proxy %@ may be missing its javascript representation.", self);
	}

	return [ourBridge krollObjectForProxy:self];
}

-(BOOL)retainsJsObjectForKey:(NSString *)key
{
	return YES;
}

-(void)rememberProxy:(TiProxy *)rememberedProxy
{
	if (rememberedProxy == nil)
	{
		return;
	}
	if ((bridgeCount == 1) && (pageKrollObject != nil))
	{
		if (rememberedProxy == self) {
			[pageKrollObject protectJsobject];
			return;
		}
		[pageKrollObject noteKeylessKrollObject:[rememberedProxy krollObjectForBridge:(KrollBridge*)pageContext]];
		return;
	}
	if (bridgeCount < 1)
	{
		DeveloperLog(@"[DEBUG] Proxy %@ is missing its javascript representation needed to remember %@.",self,rememberedProxy);
		return;
	}
	
	for (KrollBridge * thisBridge in [KrollBridge krollBridgesUsingProxy:self])
	{
		if(rememberedProxy == self)
		{
			KrollObject * thisObject = [thisBridge krollObjectForProxy:self];
			[thisObject protectJsobject];
			continue;
		}

		if(![thisBridge usesProxy:rememberedProxy])
		{
			continue;
		}
		[[thisBridge krollObjectForProxy:self] noteKeylessKrollObject:[thisBridge krollObjectForProxy:rememberedProxy]];
	}
}


-(void)forgetProxy:(TiProxy *)forgottenProxy
{
	if (forgottenProxy == nil)
	{
		return;
	}
	if ((bridgeCount == 1) && (pageKrollObject != nil))
	{
		if (forgottenProxy == self) {
			[pageKrollObject unprotectJsobject];
			return;
		}
		[pageKrollObject forgetKeylessKrollObject:[forgottenProxy krollObjectForBridge:(KrollBridge*)pageContext]];
		return;
	}
	if (bridgeCount < 1)
	{
		//While this may be of concern and there used to be a
		//warning here, too many false alarms were raised during
		//multi-context cleanups.
		return;
	}

	for (KrollBridge * thisBridge in [KrollBridge krollBridgesUsingProxy:self])
	{
		if(forgottenProxy == self)
		{
			KrollObject * thisObject = [thisBridge krollObjectForProxy:self];
			[thisObject unprotectJsobject];
			continue;
		}

		if(![thisBridge usesProxy:forgottenProxy])
		{
			continue;
		}
		[[thisBridge krollObjectForProxy:self] forgetKeylessKrollObject:[thisBridge krollObjectForProxy:forgottenProxy]];
	}
}

-(void)rememberSelf
{
	[self rememberProxy:self];
}

-(void)forgetSelf
{
	[self forgetProxy:self];
}

-(void)setCallback:(KrollCallback *)eventCallback forKey:(NSString *)key
{
	BOOL isCallback = [eventCallback isKindOfClass:[KrollCallback class]]; //Also check against nil.
	if ((bridgeCount == 1) && (pageKrollObject != nil)) {
		if (!isCallback || ([eventCallback context] != [pageKrollObject context]))
		{
			[pageKrollObject forgetCallbackForKey:key];
		}
		else
		{
			[pageKrollObject noteCallback:eventCallback forKey:key];
		}
		return;
	}

	KrollBridge * blessedBridge = (KrollBridge*)[[eventCallback context] delegate];
	NSArray * bridges = [KrollBridge krollBridgesUsingProxy:self];

	for (KrollBridge * currentBridge in bridges)
	{
		KrollObject * currentKrollObject = [currentBridge krollObjectForProxy:self];
		if(!isCallback || (blessedBridge != currentBridge))
		{
			[currentKrollObject forgetCallbackForKey:key];
		}
		else
		{
			[currentKrollObject noteCallback:eventCallback forKey:key];
		}
	}

}

-(void)fireCallback:(NSString*)type withArg:(NSDictionary *)argDict withSource:(id)source
{
	NSMutableDictionary* eventObject = [NSMutableDictionary dictionaryWithObjectsAndKeys:type,@"type",self,@"source",nil];
	if ([argDict isKindOfClass:[NSDictionary class]])
	{
		[eventObject addEntriesFromDictionary:argDict];
	}

	if ((bridgeCount == 1) && (pageKrollObject != nil)) {
		[pageKrollObject invokeCallbackForKey:type withObject:eventObject thisObject:source];
		return;
	}
	
	
	NSArray * bridges = [KrollBridge krollBridgesUsingProxy:self];
	for (KrollBridge * currentBridge in bridges)
	{
		KrollObject * currentKrollObject = [currentBridge krollObjectForProxy:self];
		[currentKrollObject invokeCallbackForKey:type withObject:eventObject thisObject:source];
	}
}

-(void)addEventListener:(NSArray*)args
{
	NSString *type = [args objectAtIndex:0];
	KrollCallback* listener = [args objectAtIndex:1];
	ENSURE_TYPE(listener,KrollCallback);

	KrollObject * ourObject = [self krollObjectForContext:[listener context]];
	[ourObject storeListener:listener forEvent:type];

	//TODO: You know, we can probably nip this in the bud and do this at a lower level,
	//Or make this less onerous.
	int ourCallbackCount = 0;

	pthread_rwlock_wrlock(&listenerLock);
	ourCallbackCount = [[listeners objectForKey:type] intValue] + 1;
	if(listeners==nil){
		listeners = [[NSMutableDictionary alloc] initWithCapacity:3];
	}
	[listeners setObject:NUMINT(ourCallbackCount) forKey:type];
	pthread_rwlock_unlock(&listenerLock);

	[self _listenerAdded:type count:ourCallbackCount];
}
	  
-(void)removeEventListener:(NSArray*)args
{
	NSString *type = [args objectAtIndex:0];
	KrollCallback* listener = [args objectAtIndex:1];
	ENSURE_TYPE(listener,KrollCallback);

	KrollObject * ourObject = [self krollObjectForContext:[listener context]];
	[ourObject removeListener:listener forEvent:type];

	//TODO: You know, we can probably nip this in the bud and do this at a lower level,
	//Or make this less onerous.
	int ourCallbackCount = 0;

	pthread_rwlock_wrlock(&listenerLock);
	ourCallbackCount = [[listeners objectForKey:type] intValue] - 1;
	[listeners setObject:NUMINT(ourCallbackCount) forKey:type];
	pthread_rwlock_unlock(&listenerLock);

	[self _listenerRemoved:type count:ourCallbackCount];
}

-(void)fireEvent:(id)args
{
	NSString *type = nil;
	id params = nil;
	if ([args isKindOfClass:[NSArray class]])
	{
		type = [args objectAtIndex:0];
		if ([args count] > 1)
		{
			params = [args objectAtIndex:1];
		}
	}
	else if ([args isKindOfClass:[NSString class]])
	{
		type = (NSString*)args;
	}
	[self fireEvent:type withObject:params withSource:self propagate:YES];
}

-(void)fireEvent:(NSString*)type withObject:(id)obj
{
	[self fireEvent:type withObject:obj withSource:self propagate:YES];
}

-(void)fireEvent:(NSString*)type withObject:(id)obj withSource:(id)source
{
	[self fireEvent:type withObject:obj withSource:source propagate:YES];
}

-(void)fireEvent:(NSString*)type withObject:(id)obj propagate:(BOOL)yn
{
	[self fireEvent:type withObject:obj withSource:self propagate:yn];
}

-(void)fireEvent:(NSString*)type withObject:(id)obj withSource:(id)source propagate:(BOOL)propagate
{
	if (![self _hasListeners:type])
	{
		return;
	}

	//TODO: This can be optimized later on.
	NSMutableDictionary* eventObject = nil;
	if ([obj isKindOfClass:[NSDictionary class]])
	{
		eventObject = [NSMutableDictionary dictionaryWithDictionary:obj];
		[eventObject setObject:type forKey:@"type"];
		[eventObject setObject:source forKey:@"source"];
	}
	else 
	{
		eventObject = [NSMutableDictionary dictionaryWithObjectsAndKeys:type,@"type",source,@"source",nil];
	}

	//Since listeners are now at the object level, we have to wait in line.

	if ((bridgeCount == 1) && (pageKrollObject != nil))
	{
		[(KrollBridge *)pageContext enqueueEvent:type forProxy:self withObject:eventObject];
	}
	else
	{
		NSArray * bridges = [KrollBridge krollBridgesUsingProxy:self];

		for (KrollBridge * currentBridge in bridges)
		{
			[currentBridge enqueueEvent:type forProxy:self withObject:eventObject];
		}
	}
}

- (void)setValuesForKeysWithDictionary:(NSDictionary *)keyedValues
{
	//It's possible that the 'setvalueforkey' has its own plans of what should be in the JS object,
	//so we should do this first as to not overwrite the subclass's setter.
	if ((bridgeCount == 1) && (pageKrollObject != nil)) {
		for (NSString * currentKey in keyedValues)
		{
			id currentValue = [keyedValues objectForKey:currentKey];
			if([currentValue isKindOfClass:[TiProxy class]] && [pageContext usesProxy:currentValue])
			{
				[pageKrollObject noteKrollObject:[currentValue krollObjectForBridge:(KrollBridge*)pageContext] forKey:currentKey];
			}
		}
	}
	else
	{
		for (KrollBridge * currentBridge in [KrollBridge krollBridgesUsingProxy:self])
		{
			KrollObject * currentKrollObject = [currentBridge krollObjectForProxy:self];
			for (NSString * currentKey in keyedValues)
			{
				id currentValue = [keyedValues objectForKey:currentKey];
				
				if([currentValue isKindOfClass:[TiProxy class]] && [currentBridge usesProxy:currentValue])
				{
					[currentKrollObject noteKrollObject:[currentBridge krollObjectForProxy:currentValue] forKey:currentKey];
				}
			}
		}
	}
	
	NSArray * keySequence = [self keySequence];

	for (NSString * thisKey in keySequence)
	{
		id thisValue = [keyedValues objectForKey:thisKey];
		if (thisValue == nil) //Dictionary doesn't have this key. Skip.
		{
			continue;
		}
		if (thisValue == [NSNull null]) 
		{ 
			//When a null, we want to write a nil.
			thisValue = nil;
		}
		[self setValue:thisValue forKey:thisKey];
	}

	for (NSString * thisKey in keyedValues)
	{
		// don't set if already set above
		if ([keySequence containsObject:thisKey]) continue;
		
		id thisValue = [keyedValues objectForKey:thisKey];
		if (thisValue == nil) //Dictionary doesn't have this key. Skip.
		{
			continue;
		} 
		if (thisValue == [NSNull null]) 
		{ 
			//When a null, we want to write a nil.
			thisValue = nil;
		}
		[self setValue:thisValue forKey:thisKey];
	}
}
 
DEFINE_EXCEPTIONS

- (id) valueForUndefinedKey: (NSString *) key
{
	if ([key isEqualToString:@"toString"] || [key isEqualToString:@"valueOf"])
	{
		return [self description];
	}
	if (dynprops != nil)
	{
		pthread_rwlock_rdlock(&dynpropsLock);
		// In some circumstances this result can be replaced at an inconvenient time,
		// releasing the returned value - so we retain/autorelease.
		id result = [[[dynprops objectForKey:key] retain] autorelease];
		pthread_rwlock_unlock(&dynpropsLock);
		
		// if we have a stored value as complex, just unwrap 
		// it and return the internal value
		if ([result isKindOfClass:[TiComplexValue class]])
		{
			TiComplexValue *value = (TiComplexValue*)result;
			return [value value];
		}
		return result;
	}
	//NOTE: we need to return nil here since in JS you can ask for properties
	//that don't exist and it should return undefined, not an exception
	return nil;
}

- (void)replaceValue:(id)value forKey:(NSString*)key notification:(BOOL)notify
{
	if (destroyed) {
		return;
	}
    if([value isKindOfClass:[KrollCallback class]]){
		[self setCallback:value forKey:key];
		//As a wrapper, we hold onto a KrollWrapper tuple so that other contexts
		//may access the function.
		KrollWrapper * newValue = [[[KrollWrapper alloc] init] autorelease];
		[newValue setBridge:(KrollBridge*)[[(KrollCallback*)value context] delegate]];
		[newValue setJsobject:[(KrollCallback*)value function]];
		value = newValue;
	}
    
	id current = nil;
	pthread_rwlock_wrlock(&dynpropsLock);
	if (dynprops!=nil)
	{
		// hold it for this invocation since set may cause it to be deleted
		current = [[[dynprops objectForKey:key] retain] autorelease];
		if (current==[NSNull null])
		{
			current = nil;
		}
	}
	else
	{
		dynprops = [[NSMutableDictionary alloc] init];
	}
    
    // TODO: Clarify internal difference between nil/NSNull
    // (which represent different JS values, but possibly consistent internal behavior)
    
    id propvalue = (value == nil) ? [NSNull null] : value;
    
    BOOL newValue = (current != propvalue && ![current isEqual:propvalue]);
    
    // We need to stage this out; the problem at hand is that some values
    // we might store as properties (such as NSArray) use isEqual: as a
    // strict address/hash comparison. So the notification must always
    // occur, and it's up to the delegate to make sense of it (for now).
    
    if (newValue) {
        // Remember any proxies set on us so they don't get GC'd
        if ([propvalue isKindOfClass:[TiProxy class]]) {
            [self rememberProxy:propvalue];
        }
		[dynprops setValue:propvalue forKey:key];
    }
	pthread_rwlock_unlock(&dynpropsLock);
    
    if (self.modelDelegate!=nil && notify)
    {
        [[(NSObject*)self.modelDelegate retain] autorelease];
        [self.modelDelegate propertyChanged:key 
                                   oldValue:current 
                                   newValue:propvalue
                                      proxy:self];
    }
    
    // Forget any old proxies so that they get cleaned up
    if (newValue && [current isKindOfClass:[TiProxy class]]) {
        [self forgetProxy:current];
    }
}

// TODO: Shouldn't we be forgetting proxies and unprotecting callbacks and such here?
- (void) deleteKey:(NSString*)key
{
	pthread_rwlock_wrlock(&dynpropsLock);
	if (dynprops!=nil)
	{
		[dynprops removeObjectForKey:key];
	}
	pthread_rwlock_unlock(&dynpropsLock);
}

- (void) setValue:(id)value forUndefinedKey: (NSString *) key
{
    [self replaceValue:value forKey:key notification:YES];
}

-(NSDictionary*)allProperties
{
	pthread_rwlock_rdlock(&dynpropsLock);
	NSDictionary* props = [[dynprops copy] autorelease];
	pthread_rwlock_unlock(&dynpropsLock);

	return props;
}

-(id)sanitizeURL:(id)value
{
	if (value == [NSNull null])
	{
		return nil;
	}

	if([value isKindOfClass:[NSString class]])
	{
		NSURL * result = [TiUtils toURL:value proxy:self];
		if (result != nil)
		{
			return result;
		}
	}
	
	return value;
}

#pragma mark Memory Management

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	//FOR NOW, we're not dropping anything but we'll want to do before release
	//subclasses need to call super if overriden
}
 
#pragma mark Dispatching Helper

//TODO: Now that we have TiThreadPerform, we should optimize this out.
-(void)_dispatchWithObjectOnUIThread:(NSArray*)args
{
	//NOTE: this is called by ENSURE_UI_THREAD_WITH_OBJ and will always be on UI thread when we get here
	id method = [args objectAtIndex:0];
	id firstobj = [args count] > 1 ? [args objectAtIndex:1] : nil;
	id secondobj = [args count] > 2 ? [args objectAtIndex:2] : nil;
	id target = [args count] > 3 ? [args objectAtIndex:3] : self;
	if (firstobj == [NSNull null])
	{
		firstobj = nil;
	}
	if (secondobj == [NSNull null])
	{
		secondobj = nil;
	}
	SEL selector = NSSelectorFromString([NSString stringWithFormat:@"%@:withObject:",method]);
	[target performSelector:selector withObject:firstobj withObject:secondobj];
}

#pragma mark Description for nice toString in JS
 
-(id)toString:(id)args
{
	if (krollDescription==nil) 
	{ 
		// if we have a cached id, use it for our identifier
        id temp = [self valueForUndefinedKey:@"id"];
        NSString *cn =nil;
        if (temp==nil||![temp isKindOfClass:[NSString class]]){
              cn = NSStringFromClass([self class]);
        }
        else {
            cn = temp;
        }
		krollDescription = [[NSString stringWithFormat:@"[object %@]",[cn stringByReplacingOccurrencesOfString:@"Proxy" withString:@""]] retain];
	}

	return krollDescription;
}

-(id)description
{
	return [self toString:nil];
}

-(id)toJSON
{
	// this is called in the case you try and use JSON.stringify and an object is a proxy 
	// since you can't serialize a proxy as JSON, just return null
	return [NSNull null];
}

@end
