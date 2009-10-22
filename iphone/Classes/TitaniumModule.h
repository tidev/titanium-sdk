/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#include "TargetConditionals.h" // this is important to get correct iphone preprocessor definitions

@protocol TitaniumModule
@optional

- (BOOL) startModule;
- (BOOL) endModule;
- (id) runFunctionNamed: (NSString *) functionName withObject: (id) objectValue error: (NSError **) error;
- (void) flushCache;
- (NSArray*) moduleDependencies;

@end


// ---------------------------------------------------------------


// base includes for all modules

#import "TitaniumHost.h"
#import "TitaniumViewController.h"
#import "TitaniumWebViewController.h"
#import "TitaniumAppDelegate.h"
#import "TitaniumInvocationGenerator.h"
#import "TitaniumJSCode.h"
#import "TitaniumJSConstants.h"
#import "TitaniumAccessorTuple.h"
#import "SBJSON.h"
#import "Webcolor.h"

