/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <UIKit/UIKit.h>
#import "TitaniumModule.h"
#import "TitaniumCmdThread.h"

// TI_VERSION will be set via an external source if not set
// display a warning and set it to 0.0.0

#ifndef TI_VERSION
#define TI_VERSION 0.0.0
#endif

#define _QUOTEME(x) #x
#define STRING(x) _QUOTEME(x)

#define TI_VERSION_STR STRING(TI_VERSION)

// in simulator we redefine to format for Titanium Developer console
// #ifdef __LOG__ID__
// #endif

#define NSLog(...) {\
	const char *__s = [[NSString stringWithFormat:__VA_ARGS__] UTF8String];\
	if (__s[0]=='[')\
	{\
	    fprintf(stderr,"%s\n", __s);\
	}\
	else\
	{\
	    fprintf(stderr,"[DEBUG] %s\n", __s);\
	}\
}

extern NSString * const TitaniumTabChangeNotification;
extern NSString * const TitaniumJsonKey;

NSString * CleanJSEnd(NSString * inputString);

@interface TitaniumProxyObject : NSObject
{
	//Stringy ties to the outside world
	NSString * token;
	NSString * javaScriptPath;
	NSString * parentPageToken;
}
@property(nonatomic,readwrite,retain)	NSString * token;
@property(nonatomic,readwrite,retain)	NSString * javaScriptPath;
@property(nonatomic,readwrite,retain)	NSString * parentPageToken;
@end

extern NSLock * TitaniumHostContentViewLock;
extern NSLock * TitaniumHostWindowLock;

typedef enum {
	TitaniumAppResourceNoType				= 0x00,
	TitaniumAppResourceFileType				= 0x01,
	TitaniumAppResourceRandomFileType		= 0x02,
	TitaniumAppResourceCommandType			= 0x10,
	TitaniumAppResourceContinueType			= 0x20,
	TitaniumAppResourceBlobType				= 0x40,
	TitaniumAppResourceWindowBindingType	= 0x80,
	TitaniumAppResourceFunctionType = TitaniumAppResourceCommandType | TitaniumAppResourceContinueType,
} TitaniumAppResourceType;

@class TitaniumAppProtocol, TitaniumCmdThread, TitaniumViewController, TitaniumBlobWrapper, TitaniumModule, TitaniumContentViewController;

#define MAXTHREADDEPTH	5

@interface TitaniumHost : NSObject<UINavigationControllerDelegate,UITabBarControllerDelegate> {
	NSString * appID;
	NSString * appResourcesPath;
	NSURL * appBaseUrl;
	NSString * appDocumentsPath;

	CGFloat keyboardTop;

//Dynamic objects:
	NSInteger lastThreadHash;
	NSMutableDictionary * threadRegistry; //Stack-based Registry based on thread ID
//	NSMutableDictionary * threadForNSThreadDict; //Simple NSThread->TiThread dict.
	TitaniumCmdThread * threadStack[MAXTHREADDEPTH];
	int threadStackCount;
	
	CFMutableDictionaryRef viewControllerRegistry; //Say what? Yeah. Because we don't want to retain views unnecessairly, this will be core foundation!
	CFMutableDictionaryRef contentViewControllerRegistry; //Say what? Yeah. Because we don't want to retain views unnecessairly, this will be core foundation!
	
	NSMutableDictionary * nativeModules;
	NSMutableArray * nativeModuleLoadOrder;

	NSInteger lastBlobHash;
	NSMutableDictionary * blobRegistry;

	NSInteger activityIndicatorLevel; //<= 0 means hidden, >= 1 means visible.

	NSMutableDictionary * titaniumObject;
//Caching objects:
	NSString * cachedRootJavaScript;
	NSDictionary * appProperties;
	NSMutableDictionary * imageCache;
	NSMutableDictionary * stretchableImageCache;
	
	TitaniumViewController * previousTabRoot;
	
	NSLock	* modalActionLock;
	NSMutableDictionary * modalActionDict;
	
	NSMutableArray * moduleListeners;
}

@property(readwrite,copy)	NSString * appID;
@property(readwrite,retain)	NSMutableDictionary * threadRegistry;
@property(readonly,nonatomic)	NSURL * appBaseUrl;
@property(readwrite,copy)	NSString * appResourcesPath;
@property(readonly,retain)	NSMutableDictionary * titaniumObject;
@property(readonly,retain)	NSDictionary * appProperties;

@property (nonatomic, assign)	CGFloat keyboardTop;

+ (TitaniumHost *) sharedHost;

#pragma mark Utilities
- (void) flushCache;

#pragma mark Thread registration
- (void) registerThread:(TitaniumCmdThread *) thread;
- (void) unregisterThread:(TitaniumCmdThread *) thread;
- (TitaniumCmdThread *) threadForToken: (NSString *) token;
- (TitaniumCmdThread *) currentThread;

#pragma mark Module registration
- (TitaniumModule *) moduleNamed: (NSString *) moduleClassName;
- (TitaniumModule *) registerModuleNamed: (NSString *) moduleClassName;
- (void) startModules;
- (void) endModules;
- (void) bindObject: (id) object toKeyPath: (NSString *) keyPath;

#pragma mark View registration
- (void) applyDefaultViewSettings: (UIViewController *) viewController;

- (void) registerViewController: (UIViewController *) viewController forKey: (NSString *) key;
- (void) unregisterViewControllerForKey: (NSString *) key;

- (void) registerContentViewController: (UIViewController *) viewController forKey: (NSString *) key;
- (void) unregisterContentViewControllerForKey: (NSString *) key;

#pragma mark Listener Management
- (void) registerListener: (id)listener;
- (void) unregisterListener: (id)listener;
- (void) fireListenerAction: (SEL)method source:(id) source properties:(NSDictionary*)dict;
- (BOOL) hasListeners;

#pragma mark Blob Management

- (TitaniumBlobWrapper *) blobForToken: (NSString *) token;
- (TitaniumBlobWrapper *) blobForImage: (UIImage *) inputImage;
- (TitaniumBlobWrapper *) blobForFile:	(NSString *) filePath;
- (TitaniumBlobWrapper *) blobForData:	(NSData *) blobData;
- (TitaniumBlobWrapper *) blobForUrl:	(NSURL *) blobUrl;

#pragma mark Modal view handling

- (void) navigationController: (UINavigationController *) navController presentModalView: (UIViewController *)newModalView animated:(BOOL) animated;

#pragma mark Useful Toys

- (NSURL *) resolveUrlFromString:(NSString *) urlString useFilePath:(BOOL) useFilePath;
- (NSString *) filePathFromURL: (NSURL *) url;

- (void) incrementActivityIndicator;
- (void) decrementActivityIndicator;

- (UIImage *) imageForResource: (id) pathString;
- (UIImage *) stretchableImageForResource: (id) pathOrUrl;

#pragma mark JavaScript Generation

- (TitaniumAppResourceType) appResourceTypeForUrl:(NSURL *) url;
- (NSString *) javaScriptForResource: (NSURL *)resourceUrl hash: (NSString *)thisThreadHashString extremeDebug: (BOOL)extremeDebug;
- (NSString *) javaScriptForResource: (NSURL *) resourceUrl;
- (NSString *) performFunction: (NSURL *) functionUrl;

- (NSMutableString *) generateJavaScriptWrappingKeyPath: (NSString *) keyPath makeObject: (BOOL) makeObject extremeDebug:(BOOL) extremeDebug;

//Executes and returns the string inline with the background thread, or if not in a thread,
//with the main page of the currently visible most foreground page.
//- (NSString *) performJavascript: (NSString *) inputString;

//Schedules the main thread to run the code to run for the appropriate page at some later time.
//If no such page exists for the token, the event is dropped on the floor.
//Returns YES if an event was scheduled, NO if no such page was found and scheduled.
- (BOOL) sendJavascript: (NSString *) inputString toPageWithToken: (NSString *) token;
- (void) sendJavascript: (NSString *) inputString toPagesWithTokens: (NSMutableSet *)tokenArray update:(BOOL) shouldUpdate;

- (BOOL) sendJavascript: (NSString *) inputString;

#pragma mark Convenience methods
- (TitaniumViewController *) visibleTitaniumViewController;
- (TitaniumViewController *) currentTitaniumViewController;
- (TitaniumViewController *) titaniumViewControllerForToken: (NSString *) token;
- (TitaniumViewController *) titaniumViewControllerForName: (NSString *) name;

- (TitaniumContentViewController *) visibleTitaniumContentViewController;
- (TitaniumContentViewController *) currentTitaniumContentViewController;
- (TitaniumContentViewController *) titaniumContentViewControllerForToken: (NSString *) token;

extern BOOL TitaniumPrepareAnimationsForView(NSDictionary * optionObject, UIView * view);

@end
