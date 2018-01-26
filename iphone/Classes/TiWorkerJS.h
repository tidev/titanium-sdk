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
- (TiClassRef)constructWithContext:(TiContextRef)context;

// Methods
TiValueRef TiWorker_postMessage(TiContextRef context, TiObjectRef function, TiObjectRef thisObject, size_t argumentCount, const TiValueRef arguments[], TiValueRef *exception);
TiValueRef TiWorker_terminate(TiContextRef context, TiObjectRef function, TiObjectRef thisObject, size_t argumentCount, const TiValueRef arguments[], TiValueRef *exception);

// Properties
bool TiWorker_setProperty(TiContextRef jsContext, TiObjectRef object, TiStringRef prop, TiValueRef value, TiValueRef *exception);

@end
