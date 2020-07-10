/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
*/
#ifndef KrollPromise_h
#define KrollPromise_h

#import <JavaScriptCore/JavaScriptCore.h>

@interface KrollPromise : NSObject {
  @private
  JSValue *resolveFunc;
  JSValue *rejectFunc;
}

@property (readonly) JSValue *JSValue;

- (void)resolve:(NSArray *)arguments;
- (void)reject:(NSArray *)arguments;

- (KrollPromise *)initInContext:(JSContext *)context;

+ (JSValue *)resolved:(NSArray *)arguments inContext:(JSContext *)context;
+ (JSValue *)rejected:(NSArray *)arguments inContext:(JSContext *)context;

@end

#endif /* KrollPromise_h */
