/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <JavaScriptCore/JavaScriptCore.h>
#import <Foundation/Foundation.h>

@class TiProxy;

JSObjectRef TiBindingTiValueFromNSDictionary(JSContextRef jsContext, NSDictionary *obj);
JSValueRef TiBindingTiValueFromProxy(JSContextRef jsContext, TiProxy *obj);
JSValueRef TiBindingTiValueFromNSObject(JSContextRef jsContext, NSObject *obj);

NSObject *TiBindingTiValueToNSObject(JSContextRef jsContext, JSValueRef objRef);
NSDictionary *TiBindingTiValueToNSDictionary(JSContextRef jsContext, JSValueRef objRef);
