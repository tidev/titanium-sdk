/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TI_VERSION	//This is so we don't get the error more than once
#warning TI_VERSION was undefined!
#endif

#import "TitaniumHost.h"
#import "TitaniumCmdThread.h"
#import "TitaniumAppProtocol.h"
#import "TitaniumAccessorTuple.h"
#import "TitaniumJSConstants.h"
#import "TitaniumUIViewController.h"
#import "TitaniumAppDelegate.h"
#import "TitaniumViewController.h"
#import "TitaniumWebViewController.h"
#import "TitaniumBlobWrapper.h"
#import "TitaniumJSCode.h"
#import "SBJSON.h"
#import "TweakedNavController.h"
#import "Logging.h"

#define VAL_OR_NSNULL(foo)	(((foo) != nil)?((id)foo):[NSNull null])

NSString * CleanJSEnd(NSString * inputString)
{
	if(inputString == nil)return @"";
	if(([inputString length]>0)&&![inputString hasSuffix:@";"])return [inputString stringByAppendingString:@";"];
	return inputString;
}



NSString * const TitaniumTabChangeNotification = @"tabChange";
NSString * const TitaniumJsonKey = @"json";

int extremeDebugLineNumber;

@implementation TitaniumProxyObject : NSObject
@synthesize token, javaScriptPath, parentPageToken;

- (id) init
{
	self = [super init];
	if (self != nil) {
		TitaniumCmdThread * ourThread = [[TitaniumHost sharedHost] currentThread];
		parentPageToken = [[ourThread magicToken] retain];
	}
	return self;
}


- (void) dealloc
{
	[token release];
	[javaScriptPath release];
	[parentPageToken release];
	[super dealloc];
}

@end


@interface modalActionWrapper : NSObject
{
	BOOL animated;
	UIViewController * modalView;
}
@property(nonatomic,readwrite,assign)	BOOL animated;
@property(nonatomic,readwrite,retain)	UIViewController * modalView;
@end

@implementation modalActionWrapper
@synthesize animated,modalView;
- (void) dealloc
{
	[modalView release];
	[super dealloc];
}
@end

NSLock * TitaniumHostContentViewLock=nil;
NSLock * TitaniumHostWindowLock=nil;

TitaniumHost * lastSharedHost = nil;

@implementation TitaniumHost
@synthesize appID, threadRegistry, appResourcesPath, titaniumObject, appBaseUrl, appProperties,keyboardTop;

+ (TitaniumHost *) sharedHost
{
	if(lastSharedHost==nil){
		lastSharedHost = [[TitaniumAppDelegate sharedDelegate] currentHost];
	}
	return lastSharedHost;
}

- (id) init
{
	if (self=[super init]) {
		if(TitaniumHostContentViewLock==nil){
			TitaniumHostContentViewLock = [[NSLock alloc] init];
		}
		if(TitaniumHostWindowLock==nil){
			TitaniumHostWindowLock = [[NSLock alloc] init];
		}
		titaniumObject = [[NSMutableDictionary alloc] init];
		threadRegistry = [[NSMutableDictionary alloc] init];
		CFDictionaryValueCallBacks noRetainCallbacks;
		noRetainCallbacks.version = 0;
		noRetainCallbacks.copyDescription = kCFTypeDictionaryValueCallBacks.copyDescription;
		noRetainCallbacks.equal = kCFTypeDictionaryValueCallBacks.equal;
		noRetainCallbacks.retain = NULL;	noRetainCallbacks.release = NULL;
		
		viewControllerRegistry = CFDictionaryCreateMutable(NULL, 5, &kCFTypeDictionaryKeyCallBacks, &noRetainCallbacks);
		contentViewControllerRegistry = CFDictionaryCreateMutable(NULL, 5, &kCFTypeDictionaryKeyCallBacks, &noRetainCallbacks);
//		threadForNSThreadDict = [[NSMutableDictionary alloc] init];
		NSNotificationCenter * theNC = [NSNotificationCenter defaultCenter];
		[theNC addObserver:self selector:@selector(handleKeyboardHiding:) name:UIKeyboardWillHideNotification object:nil];
		[theNC addObserver:self selector:@selector(handleKeyboardShowing:) name:UIKeyboardDidShowNotification object:nil];
		modalActionLock = [[NSLock alloc] init];
		[modalActionLock setName:@"[TitaniumHost modalActionLock]"];

		//TODO: flush imagecache when things get close.
	}
	return self;
}

- (void) dealloc
{
	[appID release];
	[appResourcesPath release];
	[appBaseUrl release];
	[appDocumentsPath release];
	
	//Dynamic objects:
	[threadRegistry release];
	CFRelease(viewControllerRegistry);
	CFRelease(contentViewControllerRegistry);

	[nativeModules release];
	[nativeModuleLoadOrder release];
	
	[modalActionLock release];
	[modalActionDict release];
	
	[titaniumObject release];
	[imageCache release];
	
	[moduleListeners release];
	
	[super dealloc];
}

- (NSString *) appResourcesPath
{
	if (appResourcesPath == nil){
		appResourcesPath = [[[NSBundle mainBundle] resourcePath] copy];
	}
	return appResourcesPath;
}

- (void)handleKeyboardShowing: (NSNotification *) notification;
{
	NSDictionary * userInfo = [notification userInfo];
	NSValue * keyboardBoundsObject = [userInfo objectForKey:UIKeyboardBoundsUserInfoKey];
	NSValue * keyboardCenterObject = [userInfo objectForKey:UIKeyboardCenterEndUserInfoKey];

	CGPoint keyboardCenter = CGPointZero;
	if (keyboardCenterObject != nil)[keyboardCenterObject getValue:&keyboardCenter];

	CGRect keyboardBounds = CGRectZero;
	if (keyboardBoundsObject != nil)[keyboardBoundsObject getValue:&keyboardBounds];

	keyboardTop = keyboardCenter.y - keyboardBounds.size.height/2;

	TitaniumViewController * ourVC = [self visibleTitaniumViewController];
	[ourVC needsUpdate:TitaniumViewControllerVisibleAreaChanged | TitaniumViewControllerRefreshIsAnimated];
	
	if ([self hasListeners]) [self fireListenerAction:@selector(eventKeyboardShowing:properties:) source:ourVC properties:userInfo];
}

- (void)handleKeyboardHiding: (NSNotification *) notification;
{
	keyboardTop = 0;
	TitaniumViewController * ourVC = [self visibleTitaniumViewController];
	[ourVC needsUpdate:TitaniumViewControllerVisibleAreaChanged | TitaniumViewControllerRefreshIsAnimated];
	
	if ([self hasListeners]) [self fireListenerAction:@selector(eventKeyboardHiding:properties:) source:ourVC properties:[notification userInfo]];
}

#pragma mark Thread registration

#define FASTREGISTRATION	1

//TODO: One last issue to do with javascript is that, in doing this, it's possible that code within the _TICMD could
//Call code that prompts another _TICMD. So we have to serialize, within a page? Actually, no. Because each page is
//a single thread or less, we can implement this as a stack architecture.

//Okay, it's possibly even less complex than meets the eye. There's only a few set of possiblitiies:

//A tithread doesn't callback, and therefore, is the main nsthread. Since it doesn't callback, no other threads could be
//on the main thread at the same time. It unregisters on finishing, and the contract is complete.

//A tithread does do a callback, and goes to a background nsthread. This background nsthread is new, and novel, and no other
//tithreads can be on it. Any other tithreads generated by the callback are either noncallbacks, and therefore, are on the
//main nsthread (Collapsing to previous situation), or are on a new nsthread.

//It, however, does mean that a stack per magic token needs to be maintained, but as the magic token is used as a tiThread
//lookup only on continues, and not the most common reason 

- (void) registerThread:(TitaniumCmdThread *) thread
{
	if (thread == nil) return;

#if FASTREGISTRATION == 1
	if (threadStackCount >= MAXTHREADDEPTH) {
		NSLog(@"[WARN] Shouldn't happen! No space to register %@",thread);
		//Crash hard!
		return;
	}
	
	threadStack[threadStackCount] = thread;
	threadStackCount ++;
	return;
	
//	NSThread * currentNSThread = [NSThread currentThread];
//	TitaniumCmdThread * oldThread = [threadForNSThreadDict objectForKey:currentNSThread];
//	if (oldThread != nil) NSLog(@"Warning, replacing CmdThread %@ with %@ for NSThread %@. Shouldn't happen",oldThread,thread,currentNSThread);
//	[threadForNSThreadDict setObject:thread forKey:currentNSThread];

#else if FASTREGISTRATION == 0
	@synchronized(threadRegistry){
//		if (threadRegistry == nil){
//			threadRegistry = [[NSMutableDictionary alloc] init];
//		}
		id magicToken = [thread magicToken];
		NSMutableArray * ourThreadStack = [threadRegistry objectForKey:magicToken];
		if (ourThreadStack == nil) {
			ourThreadStack = [NSMutableArray arrayWithObject:thread];
			[threadRegistry setObject:ourThreadStack forKey:magicToken];
		} else {
			[ourThreadStack addObject:thread];
		}
	}
#endif
}

- (void) unregisterThread:(TitaniumCmdThread *) thread
{
	if (thread == nil) return;
	
#if FASTREGISTRATION == 1
	for (int thisThreadIndex = threadStackCount-1; thisThreadIndex >= 0; thisThreadIndex --){
		TitaniumCmdThread * thisThread = threadStack[thisThreadIndex];
		if(thisThread==thread){
			threadStackCount = thisThreadIndex;
			return;
		}
		NSLog(@"[WARN] Shouldn't happen! Thread %@ at count %d was not unregistering thread %@",thisThread,thisThreadIndex,thread);
	}
	NSLog(@"[WARN] Shouldn't happen! Unregistering thread %@ was not in stack",thread);
	return;

//	NSThread * currentNSThread = [NSThread currentThread];
//	TitaniumCmdThread * oldThread = [threadForNSThreadDict objectForKey:currentNSThread];
//	if (oldThread != thread) NSLog(@"Warning, replacing CmdThread %@ when we should be removing %@ for NSThread %@. Shouldn't happen",oldThread,thread,currentNSThread);
//	[threadForNSThreadDict removeObjectForKey:currentNSThread];
//
#else if FASTREGISTRATION == 0
	@synchronized(threadRegistry){
		id magicToken = [thread magicToken];
		NSMutableArray * ourThreadStack = [threadRegistry objectForKey:magicToken];
		if (thread == [ourThreadStack lastObject]){
			[ourThreadStack removeLastObject];

		} else if ([ourThreadStack containsObject:thread]) {
			NSLog(@"[ERROR] ERROR! Unregistering a thread(%@-%@) in the middle of a stack(%@)!",thread,magicToken,ourThreadStack);
			[ourThreadStack removeObject:thread];

		} else {
			NSLog(@"[ERROR] ERROR! Tried to unregister a thread(%@-%@) that doesn't exist in stack(%@)!",thread,magicToken,ourThreadStack);
		}
	}
#endif

}

- (TitaniumCmdThread *) threadForToken: (NSString *) token
{
	if (token == nil) return nil;
#if FASTREGISTRATION == 1

	for (int thisThreadIndex = threadStackCount-1; thisThreadIndex >= 0; thisThreadIndex --){
		TitaniumCmdThread * thisThread = threadStack[thisThreadIndex];
		if([[thisThread magicToken] isEqualToString:token]){
			return thisThread;
		}
		NSLog(@"[WARN] Shouldn't happen! Thread %@ at count %d did not have token %@",thisThread,thisThreadIndex,token);
	}
	NSLog(@"[WARN] Shouldn't happen! Token %@ was not in stack",token);
	return nil;
	
#else if FASTREGISTRATION == 0
	TitaniumCmdThread * result=nil;
	@synchronized(threadRegistry){
		NSMutableArray * ourThreadStack = [threadRegistry objectForKey:token];
		result = [ourThreadStack lastObject];
		[result retain];
	}
	return [result autorelease];
#endif
}

- (TitaniumCmdThread *) currentThread
{
#if FASTREGISTRATION == 1
	if ((threadStackCount <= 0) || (threadStackCount > MAXTHREADDEPTH)) return nil;
	return threadStack[threadStackCount-1];
//
//	return [threadForNSThreadDict objectForKey:[NSThread currentThread]];

#else if FASTREGISTRATION == 0

	if ([NSThread isMainThread]){
		return nil; //We have no current thread.
	}
	
	TitaniumCmdThread * result = nil;
	NSThread * currentNSThread = [NSThread currentThread];

	@synchronized(threadRegistry){
		for (NSMutableArray * thisThreadStack in [threadRegistry allValues]){
			TitaniumCmdThread * thisThread = [thisThreadStack lastObject];
			NSThread * thisNSThread = [thisThread moduleThread];
			if (thisNSThread == currentNSThread){
				result = thisThread;
				break;
			}
		}
		
		if (result == nil){
			NSLog(@"[WARN] ERROR! CurrentThread isn't the most recent thread!");
			//This scan is very inefficient, but is a 'Shouldn't happen' situation.
			for (NSMutableArray * thisThreadStack in [threadRegistry allValues]){
				for (TitaniumCmdThread * thisThread in thisThreadStack){
					NSThread * thisNSThread = [thisThread moduleThread];
					if (thisNSThread == currentNSThread){
						result = thisThread;
						break;
					}
				}
				if (result != nil) break;
			}
		}
		
		
	}
	return result;
#endif
}

- (TitaniumModule *) moduleNamed: (NSString *) moduleClassName;
{
	TitaniumModule * result = [nativeModules objectForKey:moduleClassName];
	if(result!=nil)return result;
	NSString * secondModuleClassName = [NSString stringWithFormat:@"%@%@Module",
									  [[moduleClassName substringToIndex:1] uppercaseString],[moduleClassName substringFromIndex:1]];

	result = [nativeModules objectForKey:secondModuleClassName];
	return result;
}

- (TitaniumModule *) registerModuleNamed: (NSString *) moduleClassName
{
	TitaniumModule * module = nil;
	
	// only load if not already loaded
	if (nativeModules && (module = [nativeModules objectForKey:moduleClassName]) != nil)
	{
		// return nil if already found
		return nil;
	}
	Class moduleClass = NSClassFromString(moduleClassName);
	if (moduleClass == nil) {
		NSLog(@"[ERROR] Class \"%@\" was not found",moduleClassName);
		return nil;
	}
	if (![moduleClass conformsToProtocol:@protocol(TitaniumModule)]) {
		NSLog(@"[ERROR] Class \"%@\" was found but does not conform to the TitaniumModule protocol",moduleClassName);
		return nil;
	}
	module = (TitaniumModule*)[[moduleClass alloc] init];
	if (module == nil){
		NSLog(@"[ERROR] TitaniumModule \"%@\" was found but failed to init",moduleClassName);
		return nil;
	}
	if (nativeModules == nil) {
		nativeModules = [[NSMutableDictionary alloc] init];
	}
	if (nativeModuleLoadOrder == nil) {
		nativeModuleLoadOrder = [[NSMutableArray alloc] init];
	}
	[nativeModules setObject:module forKey:moduleClassName];
	return module;
}

- (UIViewController *) viewControllerForDict: (NSDictionary *) sourceDict
{
	TitaniumViewController * titaniumVC = [TitaniumViewController viewControllerForState:sourceDict relativeToUrl:[NSURL URLWithString:@"index.html" relativeToURL:appBaseUrl]];

	UINavigationController * navVC = [[TweakedNavController alloc] initWithRootViewController:titaniumVC];	
	return [navVC autorelease];
}

- (void)loadModuleNamed:(NSString*)thisModuleName
{
	NSString * thisModuleClassName = [NSString stringWithFormat:@"%@%@Module",
									  [[thisModuleName substringToIndex:1] uppercaseString],[thisModuleName substringFromIndex:1]];
	
	NSLog(@"[DEBUG] loading module %@, class name = %@",thisModuleName,thisModuleClassName);
	
	@try
	{
		TitaniumModule *module = [self registerModuleNamed:thisModuleClassName];
		if (module!=nil)
		{
			// if the module has dependencies, cause it to automatically load them
			if ([module respondsToSelector:@selector(moduleDependencies)])
			{
				NSArray* depends = [module moduleDependencies];
				if (depends && [depends count] > 0)
				{
					for (int c=0;c<[depends count];c++)
					{
						NSString *name = [depends objectAtIndex:c];
						// this is recursive
						[self loadModuleNamed:name];
					}
				}
			}
			// we do this *explicitly* after the depends since the dependencies need to be loaded before us
			[nativeModuleLoadOrder addObject:module];
			[module release];
		}
	}
	@catch (NSException *e) {
		NSLog(@"[ERROR] Exception registering module: %@, Error: %@",thisModuleName,[e description]);
	}
}

- (void) loadModules:(id)modulesContainer
{
	for (NSString * thisModuleName in modulesContainer){
		[self loadModuleNamed:thisModuleName];
	}
}

- (void) startModules
{
	appProperties = [NSDictionary dictionaryWithContentsOfFile:[appResourcesPath stringByAppendingPathComponent:@"tiapp.plist"]];
	if (appProperties == nil){
		NSString * jsonString = [[NSString alloc] initWithContentsOfFile:[appResourcesPath stringByAppendingPathComponent:@"tiapp.json"]];
		if (jsonString!=nil)
		{
			SBJSON * jsonParser = [[SBJSON alloc] init];
			appProperties = [jsonParser objectWithString:jsonString error:nil];
			[jsonParser release];
			[jsonString release];
		}
	}

	if (appProperties!=nil)
	{
		[self loadModules:[appProperties objectForKey:@"modules"]];
		[self setAppID:[appProperties objectForKey:@"id"]];
		[appProperties retain];
	}
	
	if (appID == nil) { appID = @"com.unknown.application"; }

	appBaseUrl = [[NSURL alloc] initWithScheme:@"app" host:appID path:@"/index.html"];

	NSLog(@"[DEBUG] Application base url = %@, appid = %@",appBaseUrl, appID);
	
	// install the application
	Class routingClass = NSClassFromString(@"ApplicationRouting");
	if (routingClass!=nil)
	{
		id<TitaniumAppAssetResolver> router = [[routingClass alloc] init];
		[TitaniumAppProtocol registerAppAssetResolver:router];
		[router release];
	}

	for (id thisModule in [nativeModuleLoadOrder objectEnumerator]) {
		if ([thisModule respondsToSelector:@selector(startModule)]) [thisModule startModule];
	}

	id rootViewControllerDescriptor = (appProperties!=nil) ? [appProperties objectForKey:@"startup"] : nil;
	UIViewController * rootViewController = nil;

	if (rootViewControllerDescriptor && [rootViewControllerDescriptor isKindOfClass:[NSArray class]]){
		rootViewController = [[[UITabBarController alloc] init] autorelease];
		NSMutableArray * viewControllerArray = [[NSMutableArray alloc] init];
		for (id thisViewControllerDescriptor in rootViewControllerDescriptor){
			[viewControllerArray addObject:[self viewControllerForDict:thisViewControllerDescriptor]];
		}
		[(UITabBarController *) rootViewController setViewControllers:viewControllerArray];
		[(UITabBarController *) rootViewController setDelegate:self];
		[viewControllerArray release];
	} else {
		rootViewController = [self viewControllerForDict:rootViewControllerDescriptor];
	}

	//If needed, set up the tab bar.
	//Then set up the heirarchy.
#ifdef USE_VERBOSE_DEBUG	
	NSLog(@"[DEBUG] Modules loaded. TitaniumObject is now:%@",titaniumObject);
#endif

	[[TitaniumAppDelegate sharedDelegate] setViewController:rootViewController];
	bugSentry = [NSTimer timerWithTimeInterval:1.0 target:self selector:@selector(guardAgainstIphoneBugs:) userInfo:nil repeats:YES];
	[[NSRunLoop mainRunLoop] addTimer:bugSentry forMode:NSRunLoopCommonModes];

}

- (void) endModules;
{
	for (id thisModule in [nativeModules objectEnumerator]) {
		if ([thisModule respondsToSelector:@selector(endModule)]) [thisModule endModule];
	}
}

- (void) mergeObject: (id) object toKey: (NSString *) key intoDictionary: (NSMutableDictionary *) destination;
{
	id oldObject = [destination objectForKey:key];
	if(oldObject==nil){
		[destination setObject:object forKey:key];
		return;
	}
	if([oldObject isKindOfClass:[NSDictionary class]]&&[object isKindOfClass:[NSDictionary class]]){
		NSMutableDictionary * mergedDict = [NSMutableDictionary dictionaryWithDictionary:oldObject];
		[destination setObject:mergedDict forKey:key];
		oldObject = mergedDict;
		for (NSString * thisKey in object) {
			[self mergeObject:[object objectForKey:thisKey] toKey:thisKey intoDictionary:oldObject];
		}
		return;
	}
	if([oldObject isEqual:object]){
		return;
	}
	NSLog(@"[ERROR] Failed to merge %@ into %@ because %@ was already at key %@",object,destination,oldObject,key);
}


- (void) bindObject: (id) object toKeyPath: (NSString *) keyPath;
{
	NSArray * keyPathComponents = [keyPath componentsSeparatedByString:@"."];

	int leadingPathCount=[keyPathComponents count]-1;

	for(int thisIndex=leadingPathCount;thisIndex>0;thisIndex++){
		NSString * thiskey = [keyPathComponents objectAtIndex:thisIndex];
		NSDictionary * newDict = [NSDictionary dictionaryWithObject:object forKey:thiskey];
		object = newDict;
	}

	[self mergeObject:object toKey:[keyPathComponents objectAtIndex:0] intoDictionary:titaniumObject];
}

- (void) applyDefaultViewSettings: (UIViewController *) viewController;
{
	if ([self hasListeners]) [self fireListenerAction:@selector(eventApplyDefaultViewSettings:properties:) source:viewController properties:nil];
}

- (void) registerViewController: (UIViewController *) viewController forKey: (NSString *) key;
{
	if ([self hasListeners]) [self fireListenerAction:@selector(eventRegisterViewController:properties:) source:viewController properties:[NSDictionary dictionaryWithObject:VAL_OR_NSNULL(key) forKey:@"key"]];
	CFDictionarySetValue(viewControllerRegistry, key, viewController);
}

- (void) unregisterViewControllerForKey: (NSString *) key;
{
	id viewController = (id)CFDictionaryGetValue(viewControllerRegistry, key);
	if ([self hasListeners]) [self fireListenerAction:@selector(eventUnregisterViewController:properties:) source:viewController properties:[NSDictionary dictionaryWithObject:VAL_OR_NSNULL(key) forKey:@"key"]];
	CFDictionaryRemoveValue(viewControllerRegistry, key);
}

- (void) registerContentViewController: (UIViewController *) viewController forKey: (NSString *) key;
{
	if ([self hasListeners]) [self fireListenerAction:@selector(eventRegisterContentViewController:properties:) source:viewController properties:[NSDictionary dictionaryWithObject:VAL_OR_NSNULL(key) forKey:@"key"]];
	CFDictionarySetValue(contentViewControllerRegistry, key, viewController);
}

- (void) unregisterContentViewControllerForKey: (NSString *) key;
{
	id viewController = (id)CFDictionaryGetValue(contentViewControllerRegistry, key);
	if ([self hasListeners]) [self fireListenerAction:@selector(eventUnregisterContentViewController:properties:) source:viewController properties:[NSDictionary dictionaryWithObject:VAL_OR_NSNULL(key) forKey:@"key"]];
	CFDictionaryRemoveValue(contentViewControllerRegistry, key);
}

- (void) guardAgainstIphoneBugs: (NSTimer *) timer;
{
	if([[[NSRunLoop currentRunLoop] currentMode] isEqualToString:NSDefaultRunLoopMode])return;
	TitaniumContentViewController * ourVC = [self currentTitaniumContentViewController];
	if([ourVC respondsToSelector:@selector(trackingSanityCheck)])[(id)ourVC trackingSanityCheck];
	
}



#pragma mark Blob Management

- (TitaniumBlobWrapper *) blobForToken: (NSString *) token;
{
	if (![token isKindOfClass:[NSString class]]) return nil;
	return [blobRegistry objectForKey:token];
}

- (TitaniumBlobWrapper *) newBlob;
{
	TitaniumBlobWrapper * result = [[TitaniumBlobWrapper alloc] init];
	if (blobRegistry == nil){
		blobRegistry = [[NSMutableDictionary alloc] init];
	}
	NSString * newToken = [NSString stringWithFormat:@"BLOB%d",lastBlobHash++];
	[result setToken:newToken];
	[blobRegistry setObject:result forKey:newToken];
	return result;
}

- (TitaniumBlobWrapper *) blobForImage: (UIImage *) inputImage;
{
	if (![inputImage isKindOfClass:[UIImage class]]) return nil;
	for(TitaniumBlobWrapper * thisBlob in [blobRegistry objectEnumerator]){
		if([inputImage isEqual:[thisBlob imageBlob]]){
			return thisBlob;
		}
	}

	TitaniumBlobWrapper * result = [self newBlob];
	[result setImageBlob:inputImage];
	return [result autorelease];
}

- (TitaniumBlobWrapper *) blobForFile:	(NSString *) filePath;
{
	if (![filePath isKindOfClass:[NSString class]]) return nil;
	for(TitaniumBlobWrapper * thisBlob in [blobRegistry objectEnumerator]){
		if([filePath isEqual:[thisBlob filePath]]){
			return thisBlob;
		}
	}
	
	TitaniumBlobWrapper * result = [self newBlob];
	[result setFilePath:filePath];
	return [result autorelease];
}

- (TitaniumBlobWrapper *) blobForData:	(NSData *) blobData;
{
	if (![blobData isKindOfClass:[NSData class]]) return nil;
	for(TitaniumBlobWrapper * thisBlob in [blobRegistry objectEnumerator]){
		if([blobData isEqual:[thisBlob dataBlob]]){
			return thisBlob;
		}
	}
	
	TitaniumBlobWrapper * result = [self newBlob];
	[result setDataBlob:blobData];
	return [result autorelease];
}

- (TitaniumBlobWrapper *) blobForUrl:	(NSURL *) blobUrl;
{
	if (![blobUrl isKindOfClass:[NSURL class]]) return nil;
	blobUrl = [blobUrl absoluteURL];
	
	if ([blobUrl isFileURL])
	{
		NSString * filePath = [self filePathFromURL:blobUrl];
		NSString * virtualUrl = [blobUrl absoluteString];

		for(TitaniumBlobWrapper * thisBlob in [blobRegistry objectEnumerator]){
			if([filePath isEqual:[thisBlob filePath]] || [blobUrl isEqual:[thisBlob url]] || [virtualUrl isEqual:[thisBlob virtualUrl]]){
				return thisBlob;
			}
		}

		TitaniumBlobWrapper * result = [self newBlob];
		[result setUrl:blobUrl];
		[result setFilePath:filePath];
		return [result autorelease];
	}
	else
	{
		TitaniumBlobWrapper * result = [self newBlob];
		[result setUrl:blobUrl];
		return [result autorelease];
	}
}
#pragma mark Modal view handling

- (void) navigationController: (UINavigationController *) navController presentModalView: (UIViewController *)newModalView animated:(BOOL) animated;
{
	[modalActionLock lock];
	BOOL isMainThread = [NSThread isMainThread];
	BOOL isFree = ([navController modalViewController] == nil);
		
	NSNumber * navControllerProxy = [NSNumber numberWithInteger:(int)navController];
	NSMutableArray * ourModalQueue = [modalActionDict objectForKey:navControllerProxy];

	if(isMainThread && isFree && (ourModalQueue==nil)){
		[navController presentModalViewController:newModalView animated:animated];
		[modalActionLock unlock];
		return;
	}
	
	modalActionWrapper * ourWrapper = [[modalActionWrapper alloc] init];
	[ourWrapper setModalView:newModalView];
	[ourWrapper setAnimated:animated];
	if(ourModalQueue == nil){
		ourModalQueue = [NSMutableArray arrayWithObject:ourWrapper];
		
		if(modalActionDict == nil){
			modalActionDict = [[NSMutableDictionary alloc] initWithObjectsAndKeys:ourModalQueue,navControllerProxy,nil];
		} else {
			[modalActionDict setObject:ourModalQueue forKey:navControllerProxy];
		}
		
	} else {
		[ourModalQueue addObject:ourWrapper];
	}
	
	if(!isFree){
	} else if(!isMainThread){
		[self performSelectorOnMainThread:@selector(handleModalForNavigationController:) withObject:navController waitUntilDone:NO];
	} else {
		[self performSelector:@selector(handleModalForNavigationController:) withObject:navController afterDelay:0];
	}
	
	[modalActionLock unlock];
}

- (void) handleModalForNavigationController: (UINavigationController *) navController;
{
	[modalActionLock lock];
	BOOL isFree = ([navController modalViewController] == nil); //Just checking.
	if(!isFree){
		[modalActionLock unlock];
		return;
	}
	
	NSNumber * navControllerProxy = [NSNumber numberWithInteger:(int)navController];
	NSMutableArray * ourModalQueue = [modalActionDict objectForKey:navControllerProxy];
	int ourModalQueueCount = [ourModalQueue count];
	
	if(ourModalQueueCount > 0){
		modalActionWrapper * ourWrapper = [ourModalQueue objectAtIndex:0];
		[navController presentModalViewController:[ourWrapper modalView] animated:[ourWrapper animated]];
		if ([self hasListeners]) [self fireListenerAction:@selector(eventModalViewControllerShown:properties:) source:[ourWrapper modalView] properties:[NSDictionary dictionaryWithObject:VAL_OR_NSNULL(navController) forKey:@"controller"]];
	}
	
	if(ourModalQueueCount > 1){
		[ourModalQueue removeObjectAtIndex:0];
	} else {
		[modalActionDict removeObjectForKey:navControllerProxy];
	}
	
	[modalActionLock unlock];
	
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated;
{
	if([navigationController modalViewController]==nil){
		if(animated){
			[self performSelector:@selector(handleModalForNavigationController:) withObject:navigationController afterDelay:0.01];
		} else {
			[self handleModalForNavigationController:navigationController];
		}
	}
}

#pragma mark Tab Bar Delegation

//- (BOOL)tabBarController:(UITabBarController *)tabBarController shouldSelectViewController:(UIViewController *)viewController __OSX_AVAILABLE_STARTING(__MAC_NA,__IPHONE_3_0);
- (void)tabBarController:(UITabBarController *)tabBarController didSelectViewController:(UIViewController *)viewController;
{
	NSArray * controllerArray = [tabBarController viewControllers];
	int currentIndex = [tabBarController selectedIndex];
	NSArray * viewControllers = [(UINavigationController *)viewController viewControllers];
	
	TitaniumViewController * currentTabRoot;
	if([viewControllers count]==0){
		currentTabRoot = (TitaniumViewController *)[[tabBarController moreNavigationController] topViewController];
	} else {
		currentTabRoot = [viewControllers objectAtIndex:0];
	}
	

	NSMutableString * eventString = [NSMutableString stringWithFormat:@"type:'tabchange'"];
	
	if(currentIndex != NSNotFound) [eventString appendFormat:@",index:%d",currentIndex];

	NSString * currentName;
	if([currentTabRoot respondsToSelector:@selector(nameString)]){
		currentName = [currentTabRoot nameString];
	}else{
		currentName = nil;
	}
	
	NSString * previousName;
	if(currentName != nil)[eventString appendFormat:@",name:%@",[SBJSON stringify:currentName]];
	if(previousTabRoot != nil){
		int previousIndex = [controllerArray indexOfObject:[previousTabRoot navigationController]];
		if([previousTabRoot respondsToSelector:@selector(nameString)]){
			previousName = [previousTabRoot nameString];
		}else{
			previousName = nil;
		}
		
		
		if(previousName != nil)[eventString appendFormat:@",prevName:%@",[SBJSON stringify:previousName]];
		if(previousIndex != NSNotFound)[eventString appendFormat:@",prevIndex:%d",previousIndex];
	}

	if ([self hasListeners]) [self fireListenerAction:@selector(eventTabBarShown:properties:) source:currentTabRoot properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(tabBarController),@"tabBarController",VAL_OR_NSNULL(viewController), @"viewController", nil]];

	NSNotificationCenter * theNC = [NSNotificationCenter defaultCenter];
	[theNC postNotificationName:TitaniumTabChangeNotification object:tabBarController userInfo:[NSDictionary dictionaryWithObject:eventString forKey:TitaniumJsonKey]];
	[previousTabRoot release];
	previousTabRoot = [currentTabRoot retain];

}

//- (void)tabBarController:(UITabBarController *)tabBarController willBeginCustomizingViewControllers:(NSArray *)viewControllers __OSX_AVAILABLE_STARTING(__MAC_NA,__IPHONE_3_0);
//- (void)tabBarController:(UITabBarController *)tabBarController willEndCustomizingViewControllers:(NSArray *)viewControllers changed:(BOOL)changed __OSX_AVAILABLE_STARTING(__MAC_NA,__IPHONE_3_0);
//- (void)tabBarController:(UITabBarController *)tabBarController didEndCustomizingViewControllers:(NSArray *)viewControllers changed:(BOOL)changed;
//{
//	
//}

#pragma mark Useful Toys

- (NSURL *) resolveUrlFromString:(NSString *) urlString useFilePath:(BOOL) useFilePath;
{
	TitaniumCmdThread * ourThread = [self currentThread];
	NSURL * result=nil;
	if (ourThread != nil) {
		TitaniumContentViewController * currentVC = [self titaniumContentViewControllerForToken:[ourThread magicToken]];
		result = [NSURL URLWithString:urlString relativeToURL:[(TitaniumWebViewController *)currentVC currentContentURL]];
	} else {
		result = [NSURL URLWithString:urlString relativeToURL:appBaseUrl];
	}
	if (useFilePath && [[result scheme] isEqualToString:@"app"] && [[result host] isEqualToString:appID]){
		result = [NSURL fileURLWithPath:[appResourcesPath stringByAppendingPathComponent:[result path]]];
	}
	
	return result;
}

- (NSString *) filePathFromURL: (NSURL *) url;
{
	if ([url isFileURL]) return [url path];
	
	if (!([[url scheme] isEqualToString:@"app"] &&
			[[url host] isEqualToString:appID])) return nil;

	NSString * path = [url path];
	if([path hasPrefix:@"/_"])return nil;

	return [appResourcesPath stringByAppendingPathComponent:path];
}

- (void) incrementActivityIndicator
{
	activityIndicatorLevel ++;
	if (activityIndicatorLevel == 1){
		[[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:YES];
	}
}

- (void) decrementActivityIndicator
{
	activityIndicatorLevel --;
	if (activityIndicatorLevel == 0){
		[[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:NO];
	}
}

- (NSString*) trimSlashes: (NSString *)strPath startingAt:(int)startingPoint;
{
// Example: protocol="ti:" (startingPoint = 3), strPath="ti:/foo"
// char at 3 is /, incremented to 4. char at 4 is f, return starting at 4==foo.
	int pathLen = [strPath length];
//	if (startingPoint > pathLen) return nil; //SHOULDN'T HAPPEN
	
	while((startingPoint < pathLen) && ([strPath characterAtIndex:startingPoint] == '/')){
		startingPoint ++;
	}

	return [strPath substringFromIndex:startingPoint];
}

- (UIImage *) imageForResource: (id) pathOrUrl
{
	// comes in as ti://<name> or ti:<name> or path or app://path
	if (pathOrUrl == nil) return nil;
	
#ifdef USE_VERBOSE_DEBUG	
	NSLog(@"[DEBUG] imageForResource = %@",pathOrUrl);
#endif

	// first check the image cache
	
	NSString * filePath = nil;
	NSString * buildInPath = nil;
	if ([pathOrUrl isKindOfClass:[NSString class]])
	{
		NSString *str = (NSString*)pathOrUrl;
		if ([str hasPrefix:@"ti:"])
		{
			buildInPath = [self trimSlashes:filePath startingAt:3];
			str = nil;
		}
		else if ([str hasPrefix:@"app:"])
		{
			str = [self trimSlashes:filePath startingAt:4];
		}
		if (str!=nil)
		{
			filePath = [appResourcesPath stringByAppendingPathComponent:str];
		}
	} 
	else if ([pathOrUrl isKindOfClass:[NSURL class]]) 
	{
		NSURL *url = (NSURL*)pathOrUrl;
		if ([pathOrUrl isFileURL]) 
		{
			filePath = [url path];
		}
		else if ([[pathOrUrl scheme] isEqualToString:@"app"])
		{
			filePath = [appResourcesPath stringByAppendingPathComponent:[pathOrUrl path]];
		}
		else if ([[pathOrUrl scheme] isEqualToString:@"ti"])
		{
			buildInPath = [self trimSlashes:[url absoluteString] startingAt:3];
		}
	}

	UIImage * result = [imageCache objectForKey:filePath];
	if (result!=nil) return result;
	
	if (filePath==nil && buildInPath==nil) 
	{
		return nil;
	}
	
	if (buildInPath!=nil)
	{
		// look for the builtin path
	}

	result = [UIImage imageWithContentsOfFile:filePath];
	if(result==nil) return nil;

	// create the image cache the first time through
	if (imageCache == nil)
	{
		imageCache = [[NSMutableDictionary alloc] initWithObjectsAndKeys:result,filePath,nil];
	} else {
		[imageCache setObject:result forKey:filePath];
	}
	
	return result;
}

- (UIImage *) stretchableImageForResource: (id) pathOrUrl;
{
	if (pathOrUrl == nil) return nil;

	UIImage * result = [stretchableImageCache objectForKey:pathOrUrl];
	if (result != nil) return result;
	
	UIImage * staticImage = [self imageForResource:pathOrUrl];
	CGSize imageSize = [staticImage size];
	
	result = [staticImage stretchableImageWithLeftCapWidth:(imageSize.width/2)-1 topCapHeight:(imageSize.height/2)-1];
	if(result == nil)return nil;

	if (stretchableImageCache == nil){
		stretchableImageCache = [[NSMutableDictionary alloc] initWithObjectsAndKeys:result,pathOrUrl,nil];
	} else {
		[stretchableImageCache setObject:result forKey:pathOrUrl];
	}
	
	return result;
}

#pragma mark JavaScript Generation

- (NSMutableString *) generateJavaScriptWrappingKeyPath: (NSString *) keyPath makeObject: (BOOL) makeObject extremeDebug:(BOOL) extremeDebug;
{
	NSString * relativeKeyPath;
	id ourObject;

	if (keyPath != nil){
		relativeKeyPath = [@"." stringByAppendingString:keyPath];
		ourObject = [titaniumObject valueForKeyPath:keyPath];
	} else {
		keyPath = @"";
		relativeKeyPath = keyPath;
		ourObject = titaniumObject;
	}
	
	if (![ourObject respondsToSelector:@selector(allKeys)]){
		NSLog(@"[ERROR] %@ (%@) does not respond to allKeys",keyPath,ourObject);
		return [NSMutableString stringWithFormat:@""]; //FAILED!
	}

	NSMutableString * result;
	NSMutableString * resultPrelude = nil;
	NSMutableString * resultEpilogue = nil;
	if (makeObject){
		result = [NSMutableString stringWithFormat:@"delete Ti%@;Ti%@=new Object();",relativeKeyPath,relativeKeyPath];
	} else {
		result = [NSMutableString string];
	}
	
	for (NSString * thisKey in [ourObject allKeys]){
		id thisObject = [ourObject valueForKeyPath:thisKey];
		if(extremeDebug){
			if(extremeDebugLineNumber==0){
				[result appendString:@"</script><script>_FAIL=[];"];
			} else {
				[result appendFormat:@"delete _FAIL[%d];</script><script>",extremeDebugLineNumber];
			}
			extremeDebugLineNumber ++;
			[result appendFormat:@"_LINE=%d;_FAIL[%d]='Setting %@.%@;';</script><script>",extremeDebugLineNumber,extremeDebugLineNumber,keyPath,thisKey];
		}
		NSString * keyValue = @"null";
		
		if ([thisObject isKindOfClass:[NSString class]]){
			keyValue = [SBJSON stringify:thisObject];
//			[NSString stringWithFormat:@"'%@'",thisObject];
		} else if ([thisObject isKindOfClass:[NSNumber class]]){
			keyValue = [thisObject stringValue];
		} else if ([thisObject isKindOfClass:[NSInvocation class]]){
			keyValue = [NSString stringWithFormat:
						@"function(){return Ti._INVOC('%@.%@',arguments);}",keyPath,thisKey];
		} else if ([thisObject isKindOfClass:[TitaniumJSCode class]]){
			NSString * prelude = [thisObject preludeCode];
			if([prelude length]>0){
				if (resultPrelude == nil) {
					resultPrelude = [NSMutableString stringWithString:prelude];
				} else {
					[resultPrelude appendString:prelude];
				}
			}

			NSString * epilogue = [thisObject epilogueCode];
			if([epilogue length]>0){
				epilogue = CleanJSEnd(epilogue);
				if (resultEpilogue == nil) {
					resultEpilogue = [NSMutableString stringWithString:epilogue];
				} else {
					[resultEpilogue appendString:epilogue];
				}
			}
			
			keyValue = [thisObject valueCode];
			
		} else if ([thisObject isKindOfClass:[NSDictionary class]]) {
			NSString * newKeyPath;
			if([keyPath length]>0)newKeyPath = [keyPath stringByAppendingFormat:@".%@",thisKey];
			else newKeyPath=thisKey;
			[result appendFormat:@"Ti%@.%@={};",relativeKeyPath,thisKey];
			[result appendString:[self generateJavaScriptWrappingKeyPath:newKeyPath makeObject:NO extremeDebug:extremeDebug]];
			continue;
		} else if ([thisObject isKindOfClass:[TitaniumAccessorTuple class]]){
			if ([thisObject getterSelector] != nil){
				[result appendFormat:@"Ti%@.__defineGetter__('%@',"
						"function(){return Ti._TICMD('%@.%@','_GET',[])});",
						relativeKeyPath,thisKey,keyPath,thisKey];
			}
			if ([thisObject setterSelector] != nil){
				[result appendFormat:@"Ti%@.__defineSetter__('%@',"
						"function(){Ti._TICMD('%@.%@','_SET',arguments);return arguments[0]});",
//						"function(){return Titanium._TICMD('%@.%@','_SET',arguments)});",
						relativeKeyPath,thisKey,keyPath,thisKey];
			}
			continue;
		} else {  //All other objects are lazy-loading.
			[result appendFormat:@"Ti%@.__defineGetter__('%@',"
					"function(){return Ti._TICMD('_','_SCAN',['%@.%@'])});",
					relativeKeyPath,thisKey,keyPath,thisKey];
			continue;
		}
		[result appendFormat:@"Ti%@.%@=%@;",relativeKeyPath,thisKey,keyValue];
	
	}

	if(extremeDebug){
		if(extremeDebugLineNumber==0){
			[result appendString:@"</script><script>_FAIL=[];"];
		} else {
			[result appendFormat:@"delete _FAIL[%d];</script><script>",extremeDebugLineNumber];
		}
		extremeDebugLineNumber ++;
		[result appendFormat:@"_LINE=%d;_FAIL[%d]='Including preludes and epilogues';</script><script>",extremeDebugLineNumber,extremeDebugLineNumber];
	}
	
	if (resultPrelude != nil){
		[result insertString:resultPrelude atIndex:0];
	}
	if (makeObject){
		[result appendFormat:@"result=Ti%@;",relativeKeyPath];
	}

	if (resultEpilogue != nil){
		[result appendString:resultEpilogue];
	}
	
	if(extremeDebug && (extremeDebugLineNumber!=0)){
		[result appendFormat:@"delete _FAIL[%d];</script><script>",extremeDebugLineNumber];
	}
	
	return result;
}

- (TitaniumAppResourceType) appResourceTypeForUrl:(NSURL *) url
{
	NSString * ourPath = [url path];
	if([ourPath isEqualToString:@"/blank"]) return TitaniumAppResourceNoType;
	if(![ourPath hasPrefix:@"/_"]) return TitaniumAppResourceFileType;
	if([ourPath hasPrefix:@"/_TICMD/"]) return TitaniumAppResourceCommandType;
	if([ourPath hasPrefix:@"/_TIDO/"]) return TitaniumAppResourceDoMethodType;
	if([ourPath hasPrefix:@"/_TIFILE/"]) return TitaniumAppResourceRandomFileType;
	if([ourPath hasPrefix:@"/_TICON/"]) return TitaniumAppResourceContinueType;
	if([ourPath hasPrefix:@"/_TIBLOB/"]) return TitaniumAppResourceBlobType;
	if([ourPath hasPrefix:@"/_TIWIN/"]) return TitaniumAppResourceWindowBindingType;
	return TitaniumAppResourceFileType;
}

- (NSString *) javaScriptForResource: (NSURL *)resourceUrl hash: (NSString *)thisThreadHashString extremeDebug: (BOOL)extremeDebug;
{
	NSString * wrapperString;
	if(extremeDebug){
		extremeDebugLineNumber = 0;
		wrapperString = [self generateJavaScriptWrappingKeyPath:nil makeObject:NO extremeDebug:YES];
	} else {
		if(cachedRootJavaScript == nil){
			cachedRootJavaScript = [[self generateJavaScriptWrappingKeyPath:nil makeObject:NO extremeDebug:NO] retain];
		}
		wrapperString = cachedRootJavaScript;
	}
	NSString * result = [NSString stringWithFormat:(NSString*)titaniumJavascriptInjection,thisThreadHashString,thisThreadHashString,
			STRING(TI_VERSION),wrapperString];
	return result;
}

- (NSString *) javaScriptForResource: (NSURL *) resourceUrl
{
	CLOCKSTAMP("Starting Javascript for Resource %@",resourceUrl);
	NSString * thisThreadHashString = [NSString stringWithFormat:@"x%Xx",lastThreadHash];
	NSString * result = [self javaScriptForResource:resourceUrl hash:thisThreadHashString extremeDebug:NO];

#ifdef USE_VERBOSE_DEBUG	
		NSLog(@"[DEBUG] Javascript for resource (%@) \n%@",resourceUrl,result);
#endif

	lastThreadHash+=1;
	CLOCKSTAMP("Finished Javascript for Resource %@",resourceUrl);
	return result;
}

- (NSString *)	doTitaniumMethod:(NSURL *)functionUrl withArgumentBody:(NSData *)argData;
//- (NSString *)	doTitaniumMethod:(NSURL *)functionUrl withArgumentString:(NSString *)argString;
{
	NSArray * pathParts = [[functionUrl path] componentsSeparatedByString:@"/"];
	int pathPartsCount = [pathParts count];
	//Entry 0 is /, entry 1 is _TIDO, Entry 2 is token, Entry 3 is the module, Entry 4 is method name
	if(pathPartsCount < 5) return [NSString stringWithFormat:@"throw \"Error: malformed Method Url: %@\";",functionUrl];

	TitaniumModule * ourModule = [self moduleNamed:[pathParts objectAtIndex:3]];
	if(ourModule == nil) {
		return [NSString stringWithFormat:@"throw \"Error: no module named %@ (%@)\"",
				[pathParts objectAtIndex:3],functionUrl];
	}
	
	NSString * ourMethodName = [[pathParts objectAtIndex:4] stringByAppendingString:@":"];
	SEL ourMethod = NSSelectorFromString(ourMethodName);
	
	if(![ourModule respondsToSelector:ourMethod]){
		return [NSString stringWithFormat:@"throw \"Error: %@ module does not respond to %@ (%@)\"",
				[pathParts objectAtIndex:3],ourMethodName,functionUrl];
	}
	

	SBJSON * parser = [[SBJSON alloc] init];
	NSError * error = nil;
	
	NSString * argString = [[NSString alloc] initWithData:argData encoding:NSUTF8StringEncoding];
	id argObject = [parser fragmentWithString:argString error:&error];
	[argString release];

	NSString * result;
	
	if(error == nil){
		TitaniumCmdThread * worker = [[TitaniumCmdThread alloc] init];
		[worker setModuleThread:[NSThread currentThread]];
		[worker setMagicToken:[pathParts objectAtIndex:2]];
		[self registerThread:worker];
		
		@try{
			id responseObject = [ourModule performSelector:ourMethod withObject: argObject];

			if(responseObject==nil){
				result = nil;
			} else if([responseObject isKindOfClass:[NSError class]]){
				error = responseObject;
			} else {
				result = [NSString stringWithFormat:@"result=%@;",[parser stringWithFragment:responseObject error:&error]];
			}
		} @catch (id e) {
			error = e;
		}
		
		[self unregisterThread:worker];
		[worker setModuleThread:nil];
		[worker release];
	}

	if(error != nil){
		result = [NSString stringWithFormat:@"throw %@;",[parser stringWithFragment:[error localizedDescription] error:nil]];
	}

	[parser release];

	return result;
}

- (NSString *) performFunction: (NSURL *) functionUrl
{
	TitaniumCmdThread * worker = nil;
	TitaniumAppResourceType thisType = [self appResourceTypeForUrl:functionUrl];
	if (thisType == TitaniumAppResourceCommandType){

		NSArray * pathParts = [[functionUrl path] componentsSeparatedByString:@"/"];
		int pathPartsCount = [pathParts count]; //Entry 0 is /, entry 1 is _TICMD
		if (pathPartsCount > 4) {
			if ([[pathParts objectAtIndex:3] isEqualToString:@"_"] &&
					[[pathParts objectAtIndex:4] isEqualToString:@"_SCAN"]){
				id functionUrlObject = [SBJSON decodeUrlQuery:functionUrl];
				if ([functionUrlObject isKindOfClass:[NSArray class]]){
					return [self generateJavaScriptWrappingKeyPath:[(NSArray *)functionUrlObject objectAtIndex:0] makeObject:YES extremeDebug:NO];
				} else {
					return [self generateJavaScriptWrappingKeyPath:functionUrlObject makeObject:YES extremeDebug:NO];
				}
				//No need to spawn a heavyweight locking thread for a simple scan.
			}
		}


		worker = [[[TitaniumCmdThread alloc] init] autorelease];
		[worker runWithURL:functionUrl];
	} else if (thisType == TitaniumAppResourceContinueType){
		NSArray * pathParts = [[functionUrl path] componentsSeparatedByString:@"/"];
		if ([pathParts count] > 2){
			worker = [self threadForToken:[pathParts objectAtIndex:2]];
			[worker continueWithURL:functionUrl];
		}
	}
	return [worker moduleResult];
}

- (TitaniumViewController *) visibleTitaniumViewController
{
	UIViewController * rootVC = [[TitaniumAppDelegate sharedDelegate] viewController];
	return CurrentTitaniumViewController(rootVC);
}

- (TitaniumContentViewController *) visibleTitaniumContentViewController
{
	TitaniumViewController * parentVC = [self visibleTitaniumViewController];
	TitaniumContentViewController * childVC = [parentVC viewControllerForIndex:[parentVC selectedContentIndex]]; //If this is nil, all of this becomes nil anyways.
	return childVC;
}

- (TitaniumViewController *) currentTitaniumViewController
{
	TitaniumCmdThread * ourThread = [self currentThread];
	if (ourThread != nil) {
		TitaniumViewController * ourVC = [self titaniumViewControllerForToken:[ourThread magicToken]];
		return ourVC;
	}
	return [self visibleTitaniumViewController];
}

- (TitaniumContentViewController *) currentTitaniumContentViewController
{
	TitaniumCmdThread * ourThread = [self currentThread];
	if (ourThread != nil) {
		return [self titaniumContentViewControllerForToken:[ourThread magicToken]];
	}
	return [self visibleTitaniumContentViewController];
}

- (TitaniumViewController *) titaniumViewControllerForToken: (NSString *) token
{
	TitaniumViewController * result = nil;	
	if ([token length] > 1) {
		[TitaniumHostWindowLock lock];
		result = (id)CFDictionaryGetValue(viewControllerRegistry, token);
		[[result retain] autorelease];
		[TitaniumHostWindowLock unlock];
		if (result == nil) {
			UIViewController * rootVC = [[TitaniumAppDelegate sharedDelegate] viewController];
			result = TitaniumViewControllerForToken(rootVC, token);
		}
		if (result == nil){
			TitaniumContentViewController * childVC = [self titaniumContentViewControllerForToken:token];
			if(childVC != nil)return [self titaniumViewControllerForToken:[childVC titaniumWindowToken]];
		}
	}
	return result;
}

- (TitaniumViewController *) titaniumViewControllerForName: (NSString *) name;
{
	TitaniumViewController * result = nil;
	[TitaniumHostWindowLock lock];
	NSEnumerator * viewControllerEnum = [(NSDictionary *)viewControllerRegistry objectEnumerator];
	for(TitaniumViewController * thisVC in viewControllerEnum){
		if([[thisVC nameString] isEqualToString:name]){
			result = thisVC;
			break;
		}
	}
	[TitaniumHostWindowLock unlock];
	return result;
}

- (TitaniumContentViewController *) titaniumContentViewControllerForToken: (NSString *) token
{
	TitaniumContentViewController * result = nil;	
	if ([token length] > 1) {
		[TitaniumHostContentViewLock lock];
		result = (id)CFDictionaryGetValue(contentViewControllerRegistry, token);
		[[result retain] autorelease];
		[TitaniumHostContentViewLock unlock];
		if (result == nil) {
			UIViewController * rootVC = [[TitaniumAppDelegate sharedDelegate] viewController];
			result = TitaniumContentViewControllerForToken(rootVC, token);
		}
	}
	return result;
}

- (BOOL) sendJavascript: (NSString *) inputString;
{
	TitaniumContentViewController * currentVC = [self currentTitaniumContentViewController];
	if ([currentVC isKindOfClass:[TitaniumWebViewController class]]){ return NO; }
	
	if ([NSThread isMainThread]){
		[[(TitaniumWebViewController *)currentVC webView] performSelector:@selector(stringByEvaluatingJavaScriptFromString:) withObject:inputString afterDelay:0.0];
	} else {
		[[(TitaniumWebViewController *)currentVC webView] performSelectorOnMainThread:@selector(stringByEvaluatingJavaScriptFromString:) withObject:inputString waitUntilDone:NO];
	}
	
	return YES;
}

//Schedules the main thread to run the code to run for the appropriate page at some later time.
//If no such page exists for the token, the event is dropped on the floor.
//Returns YES if an event was scheduled, NO if no such page was found and scheduled.
- (BOOL) sendJavascript: (NSString *) inputString toPageWithToken: (NSString *) token
{
	TitaniumContentViewController * currentVC = [self titaniumContentViewControllerForToken:token];
	if (![currentVC isKindOfClass:[TitaniumWebViewController class]]){ return NO; }
	if ([NSThread isMainThread]){
		[[(TitaniumWebViewController *)currentVC webView] performSelector:@selector(stringByEvaluatingJavaScriptFromString:) withObject:inputString afterDelay:0.0];
	} else {
		[[(TitaniumWebViewController *)currentVC webView] performSelectorOnMainThread:@selector(stringByEvaluatingJavaScriptFromString:) withObject:inputString waitUntilDone:NO];
	}
	
	return YES;
}

- (void) sendJavascript: (NSString *) inputString toPagesWithTokens: (NSMutableSet *)tokenArray update:(BOOL) shouldUpdate;
{
	NSMutableSet * tokensToUpdate=nil;
	BOOL isMainThread = [NSThread isMainThread];

	[TitaniumHostContentViewLock lock];	
	for(NSString * thisToken in tokenArray){
		TitaniumWebViewController * currentVC = (id)CFDictionaryGetValue(contentViewControllerRegistry, thisToken);
		if([currentVC isKindOfClass:[TitaniumWebViewController class]]){
			if(isMainThread){
				[[currentVC webView] performSelector:@selector(stringByEvaluatingJavaScriptFromString:) withObject:inputString afterDelay:0.0];
			} else {
				[[currentVC webView] performSelectorOnMainThread:@selector(stringByEvaluatingJavaScriptFromString:) withObject:inputString waitUntilDone:NO];
			}
		} else if(shouldUpdate){
			if(tokensToUpdate==nil){
				tokensToUpdate = [NSMutableSet setWithObject:thisToken];
			}else{
				[tokensToUpdate addObject:thisToken];
			}
		}
	}	
	[TitaniumHostContentViewLock unlock];

	if(tokensToUpdate != nil){
		for(NSString * thisToken in tokensToUpdate){
			[tokenArray removeObject:thisToken];
		}
	}
	
}


- (void) flushCache;
{
	[cachedRootJavaScript release];
	cachedRootJavaScript = nil;
	for(NSObject<TitaniumModule> * thisModule in [nativeModules objectEnumerator]){
		if ([thisModule respondsToSelector:@selector(flushCache)]) [thisModule flushCache];
	}
	for(TitaniumBlobWrapper * thisBlob in [blobRegistry objectEnumerator]){
		[thisBlob compress];
	}
	NSMutableArray * doomedKeys = nil;
	for(NSString * thisFilePath in imageCache){
		UIImage * cachedImage = [imageCache objectForKey:thisFilePath];
		if ([cachedImage retainCount] == 1) {
			if(doomedKeys==nil){
				doomedKeys=	[[NSMutableArray alloc] initWithObjects:thisFilePath,nil];
			} else {
				[doomedKeys addObject:thisFilePath];
			}
		}
	}
	if(doomedKeys != nil){
		[imageCache removeObjectsForKeys:doomedKeys];
		[doomedKeys release];
	}
}

- (void) registerListener: (id)listener;
{
	if (moduleListeners == nil)
	{
		moduleListeners = [[NSMutableArray alloc] init];
	}
	[moduleListeners addObject:listener];
}

- (void) unregisterListener: (id)listener;
{
	if (moduleListeners!=nil)
	{
		[moduleListeners removeObject:moduleListeners];
		if ([moduleListeners count]==0)
		{
			[moduleListeners release];
			moduleListeners = nil;
		}
	}
}

- (void) fireListenerAction: (SEL)method source:(id) source properties:(NSDictionary*)dict;
{
	if (moduleListeners==nil) return;
	
	for (int c=0;c<[moduleListeners count];c++)
	{
		id listener = [moduleListeners objectAtIndex:c];
		if ([listener respondsToSelector:method])
		{
			@try
			{
				[listener performSelector:method withObject:source withObject:dict];	
			}
			@catch(NSException *e)
			{
				NSLog(@"[ERROR] Error invoking listener action. %@",[e description]);
			}
		}
	}
}

- (BOOL) hasListeners;
{
	return (moduleListeners!=nil);
}

@end

