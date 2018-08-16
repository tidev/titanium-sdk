/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollBridge.h"
#import <Foundation/Foundation.h>

@interface TiWorkerJS : NSObject

// Constructor
- (JSClassRef)constructWithContext:(JSContextRef)context;

// Methods
JSValueRef TiWorker_postMessage(JSContextRef context, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception);
JSValueRef TiWorker_terminate(JSContextRef context, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception);

// Properties
bool TiWorker_setProperty(JSContextRef jsContext, JSObjectRef object, JSStringRef prop, JSValueRef value, JSValueRef *exception);

@end
