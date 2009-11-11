/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#include "TargetConditionals.h" // this is important to get correct iphone preprocessor definitions

#define DECLARE_JS_GETTER(object,propertyName,UpperPropertyName)	\
	"Ti." object ".prototype.__defineGetter__('" propertyName "',Ti." object ".prototype.get" UpperPropertyName ");"

#define DECLARE_JS_SETTER(object,propertyName,UpperPropertyName)	\
	"Ti." object ".prototype.__defineSetter__('" propertyName "',Ti." object ".prototype.set" UpperPropertyName ");"

#define DECLARE_JS_ACCESSORS(object,propertyName,UpperPropertyName)	\
	DECLARE_JS_GETTER(object,propertyName,UpperPropertyName) DECLARE_JS_SETTER(object,propertyName,UpperPropertyName)

typedef enum {
	TitaniumErrorWrongArgumentCount	= 2,
	TitaniumErrorWrongArgumentType	= 3,
	TitaniumErrorInvalidTokenValue	= 4,
} TitaniumErrorCode;

#define TITANIUM_JS_ERROR(codeNumber,description,...)		\
	[NSError errorWithDomain:@"Titanium" code:codeNumber userInfo:	\
		[NSDictionary dictionaryWithObject:	[NSString stringWithFormat:	\
			@"Titanium error: " description , ##__VA_ARGS__] forKey:NSLocalizedDescriptionKey]]

#define ASSERT_ARRAY_COUNT(array,desiredCount)	\
	{if(![array isKindOfClass:[NSArray class]]||([array count]<desiredCount))	\
		return TITANIUM_JS_ERROR(TitaniumErrorWrongArgumentCount,	\
		"%s was expecting %d or more arguments in an array. ", __FUNCTION__, desiredCount);}

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
#import "OperationQueue.h"
