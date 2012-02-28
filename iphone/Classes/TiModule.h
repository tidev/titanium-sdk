/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUtils.h"
#import "TiEvaluator.h"

@class TiHost;

/**
 The base class for all Titanium modules
 */
@interface TiModule : TiProxy 
{
@protected
	TiHost *host;
@private
	CFMutableDictionaryRef classNameLookup;
	NSString *moduleName;
	id moduleAssets;
}

// internal
-(void)_setName:(NSString*)name;
-(void)setPageContext:(id<TiEvaluator>)evaluator;
-(void)setHost:(TiHost*)host;
-(id)createProxy:(NSArray*)args forName:(NSString*)name context:(id<TiEvaluator>)evaluator;

// module related utilities

/**
 Returns module identifier.
 @return module identifier.
 */
-(NSString*)moduleId;

/**
 Returns if the module is JS native module.
 @return _YES_ if the module is JS native module, _NO_ ortherwise.
 */
-(BOOL)isJSModule;

/**
 Returns the JS script data for the module.
 @return The string containing JS code.
 */
-(NSData*)moduleJS;

/**
 Converts a resource name in to a URL.
 @param name The name of the resource.
 @return The URL of the resource
 */
-(NSURL*)moduleResourceURL:(NSString*)name;

-(id)bindCommonJSModule:(NSString*)code;
-(id)bindCommonJSModuleForPath:(NSURL*)path;

// lifecycle

/**
 Tells the module to startup.
 */
-(void)startup;

/**
 Tells the module to shutdown.
 @param sender The sender of the event.
 */
-(void)shutdown:(id)sender;

/**
 Tells the module to suspend.
 @param sender The sender of the event.
 */
-(void)suspend:(id)sender;

/**
 Tells the module to resume.
 @param sender The sender of the event.
 */
-(void)resume:(id)sender;

/**
 Tells the module that it was resumed.
 @param sender The sender of the event.
 */
-(void)resumed:(id)sender;

@end
