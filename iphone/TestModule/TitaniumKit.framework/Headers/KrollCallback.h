/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollContext.h"

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

@class KrollBridge;
//
// KrollCallback is a wrapper around a JS function object which is passed
// from JS land to native.  This object can be passed around on the native
// side as a normal opaque object and then passed back through to Kroll
// for function invocation (or just to pass the function object back as-is)
//
@interface KrollCallback : NSObject {
  @private
  JSContextRef jsContext;
  JSObjectRef thisObj;
  JSObjectRef function;
  KrollContext *context;
  KrollBridge *bridge;
  NSString *type;
}

@property (nonatomic, readwrite, retain) NSString *type;

- (id)initWithCallback:(JSValueRef)function_ thisObject:(JSObjectRef)thisObject_ context:(KrollContext *)context_;
- (void)callAsync:(NSArray *)args thisObject:(id)thisObject_;
- (id)call:(NSArray *)args thisObject:(id)thisObject_;
- (JSObjectRef)function;
- (KrollContext *)context;
+ (void)shutdownContext:(KrollContext *)context;

@end

//
// KrollCallback has one fatal flaw: It can lead to retention loops. So when a
// function is to be a property of a proxy, we store this on the JS object. But
// if the proxy spans multiple contexts, we need to take a rain check on other
// contexts.

/*
 *	For functions and other objects that need to be held by proxies without
 *	conversion or possible retain cycles, KrollWrapper passively refers to a
 *	JS Object. In the future, this should become the base class, instead of a
 *	collection of Kroll wrappers all based off of NSObject despite common
 *	functionality.
 *
 *	NOTE: This is an object that is never made explicitly by TiIdToValue;
 *	instead, all JS functions become KrollCallbacks, and both KrollCallbacks
 *	and KrollObjectProperties will be converted into functions.
 *	(or JSObjectRefs at any rate)
 *	Instead, KrollWrapper is used in two places currently: When a function is
 *	retained as a property by a proxy (to avoid the above retain loop),
 *	and for JS-based modules which do not need proxy properties but do need to
 *	be first-class JS object citizens.
 *	TODO: Consolidate various KrollObjects, KrollCallbacks, etc to be
 *	KrollWrappers.
 */

@class KrollBridge;

@interface KrollWrapper : NSObject {
  JSObjectRef jsobject;
  KrollBridge *bridge;
  BOOL protecting;
}

@property (nonatomic, readwrite, assign) JSObjectRef jsobject;
@property (nonatomic, readwrite, assign) KrollBridge *bridge;

- (void)protectJsobject;
- (void)unprotectJsobject;
- (void)replaceValue:(id)value forKey:(NSString *)key notification:(BOOL)notify;

@end

KrollWrapper *ConvertKrollCallbackToWrapper(KrollCallback *callback);
