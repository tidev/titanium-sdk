/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ScriptModule.h"
#import "KrollBridge.h"
#import "KrollContext.h"
#import "TiExceptionHandler.h"

@implementation ScriptModule

- (NSString *)apiName
{
  return @"Script";
}

- (JSValue *)runInThisContext:(NSString *)source withFilename:(NSString *)filename displayError:(BOOL)displayError
{
  JSContext *curContext = JSContext.currentContext;
  [curContext setExceptionHandler:^(JSContext *context, JSValue *exception) {
    // set a property on the KrollBridge, used by TiUiWindowProxy somehow?
    KrollContext *krollContext = GetKrollContext(context.JSGlobalContextRef);
    KrollBridge *bridge = (KrollBridge *)[krollContext delegate];
    bridge.evaluationError = YES;
    [TiExceptionHandler.defaultExceptionHandler reportScriptError:exception inJSContext:context];
  }];
  return [curContext evaluateScript:source withSourceURL:[TiHost resourceBasedURL:filename baseURL:NULL]];
}

@end
