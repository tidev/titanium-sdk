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

-(NSString*)moduleId;
-(BOOL)isJSModule;
-(NSData*)moduleJS;
-(NSData*)loadModuleAsset:(NSString*)fromPath;

/*
 Converts a resource name in to a URL.
 @param name The name of the resource.
 @return The URL of the resource
 */
-(NSURL*)moduleResourceURL:(NSString*)name;

-(id)bindCommonJSModule:(NSString*)code;
-(id)bindCommonJSModuleForPath:(NSURL*)path;

// lifecycle

/**
 Titanium Platform calls this method on startup.
 */
-(void)startup;

/**
 Titanium Platform calls this method on shutdown.
 @param sender The sender of the event.
 */
-(void)shutdown:(id)sender;

/**
 Titanium Platform calls this method on suspend.
 @param sender The sender of the event.
 */
-(void)suspend:(id)sender;

/**
 Titanium Platform calls this method on entering background.
 @param sender The sender of the event.
 */
-(void)paused:(id)sender;

/**
 Titanium Platform calls this method on resume.
 @param sender The sender of the event.
 */
-(void)resume:(id)sender;

/**
 Tells the module that it was resumed.
 @param sender The sender of the event.
 */
-(void)resumed:(id)sender;

@end
