/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
  BOOL _fulfilled;
  BOOL _flushMe;
}

@property (readonly, nonatomic) JSValue *JSValue;

- (void)resolve:(NSArray *)arguments;
- (void)reject:(NSArray *)arguments;
- (void)rejectWithErrorMessage:(NSString *)message;
- (void)flush;

- (KrollPromise *)initInContext:(JSContext *)context;

+ (KrollPromise *)resolved:(NSArray *)arguments inContext:(JSContext *)context;
+ (KrollPromise *)rejected:(NSArray *)arguments inContext:(JSContext *)context;
+ (KrollPromise *)rejectedWithErrorMessage:(NSString *)message inContext:(JSContext *)context;

@end

#endif /* KrollPromise_h */
