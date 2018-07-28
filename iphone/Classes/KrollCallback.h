/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollContext.h"
#import "KrollWrapper.h"
#import "TiToJS.h"
#import <Foundation/Foundation.h>

@class KrollBridge;

//
// KrollCallback is a wrapper around a JS function object which is passed
// from JS land to native.  This object can be passed around on the native
// side as a normal opaque object and then passed back through to Kroll
// for function invocation (or just to pass the function object back as-is)
//
@interface KrollCallback : NSObject {
  @private
  TiContextRef jsContext;
  TiObjectRef thisObj;
  TiObjectRef function;
  KrollContext *context;
  KrollBridge *bridge;
#ifdef TI_USE_KROLL_THREAD
  NSLock *contextLock;
#endif
  NSString *type;
}

@property (nonatomic, readwrite, retain) NSString *type;

- (id)initWithCallback:(TiValueRef)function_ thisObject:(TiObjectRef)thisObject_ context:(KrollContext *)context_;
- (void)callAsync:(NSArray *)args thisObject:(id)thisObject_;
- (id)call:(NSArray *)args thisObject:(id)thisObject_;
- (TiObjectRef)function;
- (KrollContext *)context;
- (KrollWrapper *)toKrollWrapper;
+ (void)shutdownContext:(KrollContext *)context;

@end
