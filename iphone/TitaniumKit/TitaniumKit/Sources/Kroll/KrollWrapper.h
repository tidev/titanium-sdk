/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollContext.h"
#import <Foundation/Foundation.h>

@class KrollBridge;

/*
 *  For functions and other objects that need to be held by proxies without
 *  conversion or possible retain cycles, KrollWrapper passively refers to a
 *  JS Object. In the future, this should become the base class, instead of a
 *  collection of Kroll wrappers all based off of NSObject despite common
 *  functionality.
 *
 *  NOTE: This is an object that is never made explicitly by TiIdToValue;
 *  instead, all JS functions become KrollCallbacks, and both KrollCallbacks
 *  and KrollObjectProperties will be converted into functions.
 *  (or TiObjectRefs at any rate)
 *  Instead, KrollWrapper is used in two places currently: When a function is
 *  retained as a property by a proxy (to avoid the above retain loop),
 *  and for JS-based modules which do not need proxy properties but do need to
 *  be first-class JS object citizens.
 *  TODO: Consolidate various KrollObjects, KrollCallbacks, etc to be
 *  KrollWrappers.
 */
@interface KrollWrapper : NSObject {
  JSObjectRef jsobject;
  KrollBridge *bridge;
  BOOL protecting;
}

// Access the native JSCore object
@property (nonatomic, readwrite, assign) JSObjectRef jsobject;

// Access the kroll bridge (e.g. for the kroll context)
@property (nonatomic, readwrite, assign) KrollBridge *bridge;

// Protects a JSObject from being GC'd
- (void)protectJsobject;

// Unprotects a JSObject from being GC'd
- (void)unprotectJsobject;

// Replaces a value for a given key in it's underlaying JSContext
- (void)replaceValue:(id)value forKey:(NSString *)key notification:(BOOL)notify;

// Executes an async JavaScript function and returns the resulting JSCore value if any
- (JSValueRef)executeWithArguments:(NSArray<id> *)arguments;

@end
