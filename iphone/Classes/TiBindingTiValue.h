/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TiCore.h"
#import "TiBase.h"

@class TiProxy;

TiObjectRef TiBindingTiValueFromNSDictionary(TiContextRef jsContext,NSDictionary *obj);
TiValueRef TiBindingTiValueFromProxy(TiContextRef jsContext, TiProxy * obj);
TiValueRef TiBindingTiValueFromNSObject(TiContextRef jsContext, NSObject * obj);

NSObject * TiBindingTiValueToNSObject(TiContextRef jsContext, TiValueRef objRef);
NSDictionary * TiBindingTiValueToNSDictionary(TiContextRef jsContext, TiValueRef objRef);
