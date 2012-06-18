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

#ifndef TiValueRef_h
#define TiValueRef_h

#include <TiCore/TiBase.h>
#include <TiCore/WebKitAvailability.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

/*!
@enum TiType
@abstract     A constant identifying the type of a TiValue.
@constant     kTITypeUndefined  The unique undefined value.
@constant     kTITypeNull       The unique null value.
@constant     kTITypeBoolean    A primitive boolean value, one of true or false.
@constant     kTITypeNumber     A primitive number value.
@constant     kTITypeString     A primitive string value.
@constant     kTITypeObject     An object value (meaning that this TiValueRef is a TiObjectRef).
*/
typedef enum {
    kTITypeUndefined,
    kTITypeNull,
    kTITypeBoolean,
    kTITypeNumber,
    kTITypeString,
    kTITypeObject
} TiType;

#ifdef __cplusplus
extern "C" {
#endif

/*!
@function
@abstract       Returns a Ti value's type.
@param ctx  The execution context to use.
@param value    The TiValue whose type you want to obtain.
@result         A value of type TiType that identifies value's type.
*/
JS_EXPORT TiType TiValueGetType(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Tests whether a Ti value's type is the undefined type.
@param ctx  The execution context to use.
@param value    The TiValue to test.
@result         true if value's type is the undefined type, otherwise false.
*/
JS_EXPORT bool TiValueIsUndefined(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Tests whether a Ti value's type is the null type.
@param ctx  The execution context to use.
@param value    The TiValue to test.
@result         true if value's type is the null type, otherwise false.
*/
JS_EXPORT bool TiValueIsNull(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Tests whether a Ti value's type is the boolean type.
@param ctx  The execution context to use.
@param value    The TiValue to test.
@result         true if value's type is the boolean type, otherwise false.
*/
JS_EXPORT bool TiValueIsBoolean(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Tests whether a Ti value's type is the number type.
@param ctx  The execution context to use.
@param value    The TiValue to test.
@result         true if value's type is the number type, otherwise false.
*/
JS_EXPORT bool TiValueIsNumber(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Tests whether a Ti value's type is the string type.
@param ctx  The execution context to use.
@param value    The TiValue to test.
@result         true if value's type is the string type, otherwise false.
*/
JS_EXPORT bool TiValueIsString(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Tests whether a Ti value's type is the array type.
@param ctx  The execution context to use.
@param value    The TiValue to test.
@result         true if value's type is the string type, otherwise false.
*/
JS_EXPORT bool TiValueIsArray(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Tests whether a Ti value's type is the date type.
@param ctx  The execution context to use.
@param value    The TiValue to test.
@result         true if value's type is the string type, otherwise false.
*/
JS_EXPORT bool TiValueIsDate(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Tests whether a Ti value's type is the object type.
@param ctx  The execution context to use.
@param value    The TiValue to test.
@result         true if value's type is the object type, otherwise false.
*/
JS_EXPORT bool TiValueIsObject(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract Tests whether a Ti value is an object with a given class in its class chain.
@param ctx The execution context to use.
@param value The TiValue to test.
@param jsClass The TiClass to test against.
@result true if value is an object and has jsClass in its class chain, otherwise false.
*/
JS_EXPORT bool TiValueIsObjectOfClass(TiContextRef ctx, TiValueRef value, TiClassRef jsClass);

/* Comparing values */

/*!
@function
@abstract Tests whether two Ti values are equal, as compared by the JS == operator.
@param ctx The execution context to use.
@param a The first value to test.
@param b The second value to test.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result true if the two values are equal, false if they are not equal or an exception is thrown.
*/
JS_EXPORT bool TiValueIsEqual(TiContextRef ctx, TiValueRef a, TiValueRef b, TiValueRef* exception);

/*!
@function
@abstract       Tests whether two Ti values are strict equal, as compared by the JS === operator.
@param ctx  The execution context to use.
@param a        The first value to test.
@param b        The second value to test.
@result         true if the two values are strict equal, otherwise false.
*/
JS_EXPORT bool TiValueIsStrictEqual(TiContextRef ctx, TiValueRef a, TiValueRef b);

/*!
@function
@abstract Tests whether a Ti value is an object constructed by a given constructor, as compared by the JS instanceof operator.
@param ctx The execution context to use.
@param value The TiValue to test.
@param constructor The constructor to test against.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result true if value is an object constructed by constructor, as compared by the JS instanceof operator, otherwise false.
*/
JS_EXPORT bool TiValueIsInstanceOfConstructor(TiContextRef ctx, TiValueRef value, TiObjectRef constructor, TiValueRef* exception);

/* Creating values */

/*!
@function
@abstract       Creates a Ti value of the undefined type.
@param ctx  The execution context to use.
@result         The unique undefined value.
*/
JS_EXPORT TiValueRef TiValueMakeUndefined(TiContextRef ctx);

/*!
@function
@abstract       Creates a Ti value of the null type.
@param ctx  The execution context to use.
@result         The unique null value.
*/
JS_EXPORT TiValueRef TiValueMakeNull(TiContextRef ctx);

/*!
@function
@abstract       Creates a Ti value of the boolean type.
@param ctx  The execution context to use.
@param boolean  The bool to assign to the newly created TiValue.
@result         A TiValue of the boolean type, representing the value of boolean.
*/
JS_EXPORT TiValueRef TiValueMakeBoolean(TiContextRef ctx, bool boolean);

/*!
@function
@abstract       Creates a Ti value of the number type.
@param ctx  The execution context to use.
@param number   The double to assign to the newly created TiValue.
@result         A TiValue of the number type, representing the value of number.
*/
JS_EXPORT TiValueRef TiValueMakeNumber(TiContextRef ctx, double number);

/*!
@function
@abstract       Creates a Ti value of the string type.
@param ctx  The execution context to use.
@param string   The TiString to assign to the newly created TiValue. The
 newly created TiValue retains string, and releases it upon garbage collection.
@result         A TiValue of the string type, representing the value of string.
*/
JS_EXPORT TiValueRef TiValueMakeString(TiContextRef ctx, TiStringRef string);

/* Converting to and from JSON formatted strings */

/*!
 @function
 @abstract       Creates a Ti value from a JSON formatted string.
 @param ctx      The execution context to use.
 @param string   The TiString containing the JSON string to be parsed.
 @result         A TiValue containing the parsed value, or NULL if the input is invalid.
 */
JS_EXPORT TiValueRef TiValueMakeFromJSONString(TiContextRef ctx, TiStringRef string) AVAILABLE_AFTER_WEBKIT_VERSION_4_0;

/*!
 @function
 @abstract       Creates a Ti string containing the JSON serialized representation of a JS value.
 @param ctx      The execution context to use.
 @param value    The value to serialize.
 @param indent   The number of spaces to indent when nesting.  If 0, the resulting JSON will not contains newlines.  The size of the indent is clamped to 10 spaces.
 @param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
 @result         A TiString with the result of serialization, or NULL if an exception is thrown.
 */
JS_EXPORT TiStringRef TiValueCreateJSONString(TiContextRef ctx, TiValueRef value, unsigned indent, TiValueRef* exception) AVAILABLE_AFTER_WEBKIT_VERSION_4_0;

/* Converting to primitive values */

/*!
@function
@abstract       Converts a Ti value to boolean and returns the resulting boolean.
@param ctx  The execution context to use.
@param value    The TiValue to convert.
@result         The boolean result of conversion.
*/
JS_EXPORT bool TiValueToBoolean(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Converts a Ti value to number and returns the resulting number.
@param ctx  The execution context to use.
@param value    The TiValue to convert.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result         The numeric result of conversion, or NaN if an exception is thrown.
*/
JS_EXPORT double TiValueToNumber(TiContextRef ctx, TiValueRef value, TiValueRef* exception);

/*!
@function
@abstract       Converts a Ti value to string and copies the result into a Ti string.
@param ctx  The execution context to use.
@param value    The TiValue to convert.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result         A TiString with the result of conversion, or NULL if an exception is thrown. Ownership follows the Create Rule.
*/
JS_EXPORT TiStringRef TiValueToStringCopy(TiContextRef ctx, TiValueRef value, TiValueRef* exception);

/*!
@function
@abstract Converts a Ti value to object and returns the resulting object.
@param ctx  The execution context to use.
@param value    The TiValue to convert.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result         The TiObject result of conversion, or NULL if an exception is thrown.
*/
JS_EXPORT TiObjectRef TiValueToObject(TiContextRef ctx, TiValueRef value, TiValueRef* exception);

/* Garbage collection */
/*!
@function
@abstract Protects a Ti value from garbage collection.
@param ctx The execution context to use.
@param value The TiValue to protect.
@discussion Use this method when you want to store a TiValue in a global or on the heap, where the garbage collector will not be able to discover your reference to it.
 
A value may be protected multiple times and must be unprotected an equal number of times before becoming eligible for garbage collection.
*/
JS_EXPORT void TiValueProtect(TiContextRef ctx, TiValueRef value);

/*!
@function
@abstract       Unprotects a Ti value from garbage collection.
@param ctx      The execution context to use.
@param value    The TiValue to unprotect.
@discussion     A value may be protected multiple times and must be unprotected an 
 equal number of times before becoming eligible for garbage collection.
*/
JS_EXPORT void TiValueUnprotect(TiContextRef ctx, TiValueRef value);

#ifdef __cplusplus
}
#endif

#endif /* TiValueRef_h */
