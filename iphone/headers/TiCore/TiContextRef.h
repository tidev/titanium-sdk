/**
 * Appcelerator Titanium License
 * This source code and all modifications done by Appcelerator
 * are licensed under the Apache Public License (version 2) and
 * are Copyright (c) 2009-2012 by Appcelerator, Inc.
 */

/*
 * Copyright (C) 2006 Apple Computer, Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#ifndef TiContextRef_h
#define TiContextRef_h

#include <TiCore/TiObjectRef.h>
#include <TiCore/TiValueRef.h>
#include <TiCore/WebKitAvailability.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

/*!
@function
@abstract Creates a Ti context group.
@discussion A TiContextGroup associates Ti contexts with one another.
 Contexts in the same group may share and exchange Ti objects. Sharing and/or exchanging
 Ti objects between contexts in different groups will produce undefined behavior.
 When objects from the same context group are used in multiple threads, explicit
 synchronization is required.
@result The created TiContextGroup.
*/
JS_EXPORT TiContextGroupRef TiContextGroupCreate() AVAILABLE_IN_WEBKIT_VERSION_4_0;

/*!
@function
@abstract Retains a Ti context group.
@param group The TiContextGroup to retain.
@result A TiContextGroup that is the same as group.
*/
JS_EXPORT TiContextGroupRef TiContextGroupRetain(TiContextGroupRef group) AVAILABLE_IN_WEBKIT_VERSION_4_0;

/*!
@function
@abstract Releases a Ti context group.
@param group The TiContextGroup to release.
*/
JS_EXPORT void TiContextGroupRelease(TiContextGroupRef group) AVAILABLE_IN_WEBKIT_VERSION_4_0;

/*!
@function
@abstract Creates a global Ti execution context.
@discussion TiGlobalContextCreate allocates a global object and populates it with all the
 built-in Ti objects, such as Object, Function, String, and Array.

 In WebKit version 4.0 and later, the context is created in a unique context group.
 Therefore, scripts may execute in it concurrently with scripts executing in other contexts.
 However, you may not use values created in the context in other contexts.
@param globalObjectClass The class to use when creating the global object. Pass 
 NULL to use the default object class.
@result A TiGlobalContext with a global object of class globalObjectClass.
*/
JS_EXPORT TiGlobalContextRef TiGlobalContextCreate(TiClassRef globalObjectClass) AVAILABLE_WEBKIT_VERSION_3_0_AND_LATER;

/*!
@function
@abstract Creates a global Ti execution context in the context group provided.
@discussion TiGlobalContextCreateInGroup allocates a global object and populates it with
 all the built-in Ti objects, such as Object, Function, String, and Array.
@param globalObjectClass The class to use when creating the global object. Pass
 NULL to use the default object class.
@param group The context group to use. The created global context retains the group.
 Pass NULL to create a unique group for the context.
@result A TiGlobalContext with a global object of class globalObjectClass and a context
 group equal to group.
*/
JS_EXPORT TiGlobalContextRef TiGlobalContextCreateInGroup(TiContextGroupRef group, TiClassRef globalObjectClass) AVAILABLE_IN_WEBKIT_VERSION_4_0;

/*!
@function
@abstract Retains a global Ti execution context.
@param ctx The TiGlobalContext to retain.
@result A TiGlobalContext that is the same as ctx.
*/
JS_EXPORT TiGlobalContextRef TiGlobalContextRetain(TiGlobalContextRef ctx);

/*!
@function
@abstract Releases a global Ti execution context.
@param ctx The TiGlobalContext to release.
*/
JS_EXPORT void TiGlobalContextRelease(TiGlobalContextRef ctx);

/*!
@function
@abstract Gets the global object of a Ti execution context.
@param ctx The TiContext whose global object you want to get.
@result ctx's global object.
*/
JS_EXPORT TiObjectRef TiContextGetGlobalObject(TiContextRef ctx);

/*!
@function
@abstract Gets the context group to which a Ti execution context belongs.
@param ctx The TiContext whose group you want to get.
@result ctx's group.
*/
JS_EXPORT TiContextGroupRef TiContextGetGroup(TiContextRef ctx) AVAILABLE_IN_WEBKIT_VERSION_4_0;

#ifdef __cplusplus
}
#endif

#endif /* TiContextRef_h */
