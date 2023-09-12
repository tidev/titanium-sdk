/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

@class TiProxy;

JSObjectRef TiBindingTiValueFromNSDictionary(JSContextRef jsContext, NSDictionary *obj);
JSValueRef TiBindingTiValueFromProxy(JSContextRef jsContext, TiProxy *obj);
JSValueRef TiBindingTiValueFromNSObject(JSContextRef jsContext, NSObject *obj);

NSObject *TiBindingTiValueToNSObject(JSContextRef jsContext, JSValueRef objRef);
NSDictionary *TiBindingTiValueToNSDictionary(JSContextRef jsContext, JSValueRef objRef);
