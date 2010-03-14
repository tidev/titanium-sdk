/**
 * Appcelerator Titanium License
 * This source code and all modifications done by Appcelerator
 * are licensed under the Apache Public License (version 2) and
 * are Copyright (c) 2009 by Appcelerator, Inc.
 */

/*
 * Copyright (C) 2006, 2007 Apple Inc. All rights reserved.
 * Copyright (C) 2008 Kelvin W Sherlock (ksherlock@gmail.com)
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

#ifndef TiObjectRef_h
#define TiObjectRef_h

#include <TiCore/TiBase.h>
#include <TiCore/TiValueRef.h>
#include <TiCore/WebKitAvailability.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif
#include <stddef.h> /* for size_t */

#ifdef __cplusplus
extern "C" {
#endif

/*!
@enum TiPropertyAttribute
@constant kTiPropertyAttributeNone         Specifies that a property has no special attributes.
@constant kTiPropertyAttributeReadOnly     Specifies that a property is read-only.
@constant kTiPropertyAttributeDontEnum     Specifies that a property should not be enumerated by TiPropertyEnumerators and Ti for...in loops.
@constant kTiPropertyAttributeDontDelete   Specifies that the delete operation should fail on a property.
*/
enum { 
    kTiPropertyAttributeNone         = 0,
    kTiPropertyAttributeReadOnly     = 1 << 1,
    kTiPropertyAttributeDontEnum     = 1 << 2,
    kTiPropertyAttributeDontDelete   = 1 << 3
};

/*! 
@typedef TiPropertyAttributes
@abstract A set of TiPropertyAttributes. Combine multiple attributes by logically ORing them together.
*/
typedef unsigned TiPropertyAttributes;

/*!
@enum TiClassAttribute
@constant kTiClassAttributeNone Specifies that a class has no special attributes.
@constant kTiClassAttributeNoAutomaticPrototype Specifies that a class should not automatically generate a shared prototype for its instance objects. Use kTiClassAttributeNoAutomaticPrototype in combination with TiObjectSetPrototype to manage prototypes manually.
*/
enum { 
    kTiClassAttributeNone = 0,
    kTiClassAttributeNoAutomaticPrototype = 1 << 1
};

/*! 
@typedef TiClassAttributes
@abstract A set of TiClassAttributes. Combine multiple attributes by logically ORing them together.
*/
typedef unsigned TiClassAttributes;

/*! 
@typedef TiObjectInitializeCallback
@abstract The callback invoked when an object is first created.
@param ctx The execution context to use.
@param object The TiObject being created.
@discussion If you named your function Initialize, you would declare it like this:

void Initialize(TiContextRef ctx, TiObjectRef object);

Unlike the other object callbacks, the initialize callback is called on the least
derived class (the parent class) first, and the most derived class last.
*/
typedef void
(*TiObjectInitializeCallback) (TiContextRef ctx, TiObjectRef object);

/*! 
@typedef TiObjectFinalizeCallback
@abstract The callback invoked when an object is finalized (prepared for garbage collection). An object may be finalized on any thread.
@param object The TiObject being finalized.
@discussion If you named your function Finalize, you would declare it like this:

void Finalize(TiObjectRef object);

The finalize callback is called on the most derived class first, and the least 
derived class (the parent class) last.

You must not call any function that may cause a garbage collection or an allocation
of a garbage collected object from within a TiObjectFinalizeCallback. This includes
all functions that have a TiContextRef parameter.
*/
typedef void            
(*TiObjectFinalizeCallback) (TiObjectRef object);

/*! 
@typedef TiObjectHasPropertyCallback
@abstract The callback invoked when determining whether an object has a property.
@param ctx The execution context to use.
@param object The TiObject to search for the property.
@param propertyName A TiString containing the name of the property look up.
@result true if object has the property, otherwise false.
@discussion If you named your function HasProperty, you would declare it like this:

bool HasProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName);

If this function returns false, the hasProperty request forwards to object's statically declared properties, then its parent class chain (which includes the default object class), then its prototype chain.

This callback enables optimization in cases where only a property's existence needs to be known, not its value, and computing its value would be expensive.

If this callback is NULL, the getProperty callback will be used to service hasProperty requests.
*/
typedef bool
(*TiObjectHasPropertyCallback) (TiContextRef ctx, TiObjectRef object, TiStringRef propertyName);

/*! 
@typedef TiObjectGetPropertyCallback
@abstract The callback invoked when getting a property's value.
@param ctx The execution context to use.
@param object The TiObject to search for the property.
@param propertyName A TiString containing the name of the property to get.
@param exception A pointer to a TiValueRef in which to return an exception, if any.
@result The property's value if object has the property, otherwise NULL.
@discussion If you named your function GetProperty, you would declare it like this:

TiValueRef GetProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef* exception);

If this function returns NULL, the get request forwards to object's statically declared properties, then its parent class chain (which includes the default object class), then its prototype chain.
*/
typedef TiValueRef
(*TiObjectGetPropertyCallback) (TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef* exception);

/*! 
@typedef TiObjectSetPropertyCallback
@abstract The callback invoked when setting a property's value.
@param ctx The execution context to use.
@param object The TiObject on which to set the property's value.
@param propertyName A TiString containing the name of the property to set.
@param value A TiValue to use as the property's value.
@param exception A pointer to a TiValueRef in which to return an exception, if any.
@result true if the property was set, otherwise false.
@discussion If you named your function SetProperty, you would declare it like this:

bool SetProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef value, TiValueRef* exception);

If this function returns false, the set request forwards to object's statically declared properties, then its parent class chain (which includes the default object class).
*/
typedef bool
(*TiObjectSetPropertyCallback) (TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef value, TiValueRef* exception);

/*! 
@typedef TiObjectDeletePropertyCallback
@abstract The callback invoked when deleting a property.
@param ctx The execution context to use.
@param object The TiObject in which to delete the property.
@param propertyName A TiString containing the name of the property to delete.
@param exception A pointer to a TiValueRef in which to return an exception, if any.
@result true if propertyName was successfully deleted, otherwise false.
@discussion If you named your function DeleteProperty, you would declare it like this:

bool DeleteProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef* exception);

If this function returns false, the delete request forwards to object's statically declared properties, then its parent class chain (which includes the default object class).
*/
typedef bool
(*TiObjectDeletePropertyCallback) (TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef* exception);

/*! 
@typedef TiObjectGetPropertyNamesCallback
@abstract The callback invoked when collecting the names of an object's properties.
@param ctx The execution context to use.
@param object The TiObject whose property names are being collected.
@param accumulator A Ti property name accumulator in which to accumulate the names of object's properties.
@discussion If you named your function GetPropertyNames, you would declare it like this:

void GetPropertyNames(TiContextRef ctx, TiObjectRef object, TiPropertyNameAccumulatorRef propertyNames);

Property name accumulators are used by TiObjectCopyPropertyNames and Ti for...in loops. 

Use TiPropertyNameAccumulatorAddName to add property names to accumulator. A class's getPropertyNames callback only needs to provide the names of properties that the class vends through a custom getProperty or setProperty callback. Other properties, including statically declared properties, properties vended by other classes, and properties belonging to object's prototype, are added independently.
*/
typedef void
(*TiObjectGetPropertyNamesCallback) (TiContextRef ctx, TiObjectRef object, TiPropertyNameAccumulatorRef propertyNames);

/*! 
@typedef TiObjectCallAsFunctionCallback
@abstract The callback invoked when an object is called as a function.
@param ctx The execution context to use.
@param function A TiObject that is the function being called.
@param thisObject A TiObject that is the 'this' variable in the function's scope.
@param argumentCount An integer count of the number of arguments in arguments.
@param arguments A TiValue array of the  arguments passed to the function.
@param exception A pointer to a TiValueRef in which to return an exception, if any.
@result A TiValue that is the function's return value.
@discussion If you named your function CallAsFunction, you would declare it like this:

TiValueRef CallAsFunction(TiContextRef ctx, TiObjectRef function, TiObjectRef thisObject, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception);

If your callback were invoked by the Ti expression 'myObject.myFunction()', function would be set to myFunction, and thisObject would be set to myObject.

If this callback is NULL, calling your object as a function will throw an exception.
*/
typedef TiValueRef 
(*TiObjectCallAsFunctionCallback) (TiContextRef ctx, TiObjectRef function, TiObjectRef thisObject, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception);

/*! 
@typedef TiObjectCallAsConstructorCallback
@abstract The callback invoked when an object is used as a constructor in a 'new' expression.
@param ctx The execution context to use.
@param constructor A TiObject that is the constructor being called.
@param argumentCount An integer count of the number of arguments in arguments.
@param arguments A TiValue array of the  arguments passed to the function.
@param exception A pointer to a TiValueRef in which to return an exception, if any.
@result A TiObject that is the constructor's return value.
@discussion If you named your function CallAsConstructor, you would declare it like this:

TiObjectRef CallAsConstructor(TiContextRef ctx, TiObjectRef constructor, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception);

If your callback were invoked by the Ti expression 'new myConstructor()', constructor would be set to myConstructor.

If this callback is NULL, using your object as a constructor in a 'new' expression will throw an exception.
*/
typedef TiObjectRef 
(*TiObjectCallAsConstructorCallback) (TiContextRef ctx, TiObjectRef constructor, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception);

/*! 
@typedef TiObjectHasInstanceCallback
@abstract hasInstance The callback invoked when an object is used as the target of an 'instanceof' expression.
@param ctx The execution context to use.
@param constructor The TiObject that is the target of the 'instanceof' expression.
@param possibleInstance The TiValue being tested to determine if it is an instance of constructor.
@param exception A pointer to a TiValueRef in which to return an exception, if any.
@result true if possibleInstance is an instance of constructor, otherwise false.
@discussion If you named your function HasInstance, you would declare it like this:

bool HasInstance(TiContextRef ctx, TiObjectRef constructor, TiValueRef possibleInstance, TiValueRef* exception);

If your callback were invoked by the Ti expression 'someValue instanceof myObject', constructor would be set to myObject and possibleInstance would be set to someValue.

If this callback is NULL, 'instanceof' expressions that target your object will return false.

Standard Ti practice calls for objects that implement the callAsConstructor callback to implement the hasInstance callback as well.
*/
typedef bool 
(*TiObjectHasInstanceCallback)  (TiContextRef ctx, TiObjectRef constructor, TiValueRef possibleInstance, TiValueRef* exception);

/*! 
@typedef TiObjectConvertToTypeCallback
@abstract The callback invoked when converting an object to a particular Ti type.
@param ctx The execution context to use.
@param object The TiObject to convert.
@param type A TiType specifying the Ti type to convert to.
@param exception A pointer to a TiValueRef in which to return an exception, if any.
@result The objects's converted value, or NULL if the object was not converted.
@discussion If you named your function ConvertToType, you would declare it like this:

TiValueRef ConvertToType(TiContextRef ctx, TiObjectRef object, TiType type, TiValueRef* exception);

If this function returns false, the conversion request forwards to object's parent class chain (which includes the default object class).

This function is only invoked when converting an object to number or string. An object converted to boolean is 'true.' An object converted to object is itself.
*/
typedef TiValueRef
(*TiObjectConvertToTypeCallback) (TiContextRef ctx, TiObjectRef object, TiType type, TiValueRef* exception);

/*! 
@struct TiStaticValue
@abstract This structure describes a statically declared value property.
@field name A null-terminated UTF8 string containing the property's name.
@field getProperty A TiObjectGetPropertyCallback to invoke when getting the property's value.
@field setProperty A TiObjectSetPropertyCallback to invoke when setting the property's value. May be NULL if the ReadOnly attribute is set.
@field attributes A logically ORed set of TiPropertyAttributes to give to the property.
*/
typedef struct {
    const char* const name;
    TiObjectGetPropertyCallback getProperty;
    TiObjectSetPropertyCallback setProperty;
    TiPropertyAttributes attributes;
} TiStaticValue;

/*! 
@struct TiStaticFunction
@abstract This structure describes a statically declared function property.
@field name A null-terminated UTF8 string containing the property's name.
@field callAsFunction A TiObjectCallAsFunctionCallback to invoke when the property is called as a function.
@field attributes A logically ORed set of TiPropertyAttributes to give to the property.
*/
typedef struct {
    const char* const name;
    TiObjectCallAsFunctionCallback callAsFunction;
    TiPropertyAttributes attributes;
} TiStaticFunction;

/*!
@struct TiClassDefinition
@abstract This structure contains properties and callbacks that define a type of object. All fields other than the version field are optional. Any pointer may be NULL.
@field version The version number of this structure. The current version is 0.
@field attributes A logically ORed set of TiClassAttributes to give to the class.
@field className A null-terminated UTF8 string containing the class's name.
@field parentClass A TiClass to set as the class's parent class. Pass NULL use the default object class.
@field staticValues A TiStaticValue array containing the class's statically declared value properties. Pass NULL to specify no statically declared value properties. The array must be terminated by a TiStaticValue whose name field is NULL.
@field staticFunctions A TiStaticFunction array containing the class's statically declared function properties. Pass NULL to specify no statically declared function properties. The array must be terminated by a TiStaticFunction whose name field is NULL.
@field initialize The callback invoked when an object is first created. Use this callback to initialize the object.
@field finalize The callback invoked when an object is finalized (prepared for garbage collection). Use this callback to release resources allocated for the object, and perform other cleanup.
@field hasProperty The callback invoked when determining whether an object has a property. If this field is NULL, getProperty is called instead. The hasProperty callback enables optimization in cases where only a property's existence needs to be known, not its value, and computing its value is expensive. 
@field getProperty The callback invoked when getting a property's value.
@field setProperty The callback invoked when setting a property's value.
@field deleteProperty The callback invoked when deleting a property.
@field getPropertyNames The callback invoked when collecting the names of an object's properties.
@field callAsFunction The callback invoked when an object is called as a function.
@field hasInstance The callback invoked when an object is used as the target of an 'instanceof' expression.
@field callAsConstructor The callback invoked when an object is used as a constructor in a 'new' expression.
@field convertToType The callback invoked when converting an object to a particular Ti type.
@discussion The staticValues and staticFunctions arrays are the simplest and most efficient means for vending custom properties. Statically declared properties autmatically service requests like getProperty, setProperty, and getPropertyNames. Property access callbacks are required only to implement unusual properties, like array indexes, whose names are not known at compile-time.

If you named your getter function "GetX" and your setter function "SetX", you would declare a TiStaticValue array containing "X" like this:

TiStaticValue StaticValueArray[] = {
    { "X", GetX, SetX, kTiPropertyAttributeNone },
    { 0, 0, 0, 0 }
};

Standard Ti practice calls for storing function objects in prototypes, so they can be shared. The default TiClass created by TiClassCreate follows this idiom, instantiating objects with a shared, automatically generating prototype containing the class's function objects. The kTiClassAttributeNoAutomaticPrototype attribute specifies that a TiClass should not automatically generate such a prototype. The resulting TiClass instantiates objects with the default object prototype, and gives each instance object its own copy of the class's function objects.

A NULL callback specifies that the default object callback should substitute, except in the case of hasProperty, where it specifies that getProperty should substitute.
*/
typedef struct {
    int                                 version; /* current (and only) version is 0 */
    TiClassAttributes                   attributes;

    const char*                         className;
    TiClassRef                          parentClass;
        
    const TiStaticValue*                staticValues;
    const TiStaticFunction*             staticFunctions;
    
    TiObjectInitializeCallback          initialize;
    TiObjectFinalizeCallback            finalize;
    TiObjectHasPropertyCallback         hasProperty;
    TiObjectGetPropertyCallback         getProperty;
    TiObjectSetPropertyCallback         setProperty;
    TiObjectDeletePropertyCallback      deleteProperty;
    TiObjectGetPropertyNamesCallback    getPropertyNames;
    TiObjectCallAsFunctionCallback      callAsFunction;
    TiObjectCallAsConstructorCallback   callAsConstructor;
    TiObjectHasInstanceCallback         hasInstance;
    TiObjectConvertToTypeCallback       convertToType;
} TiClassDefinition;

/*! 
@const kTiClassDefinitionEmpty 
@abstract A TiClassDefinition structure of the current version, filled with NULL pointers and having no attributes.
@discussion Use this constant as a convenience when creating class definitions. For example, to create a class definition with only a finalize method:

TiClassDefinition definition = kTiClassDefinitionEmpty;
definition.finalize = Finalize;
*/
JS_EXPORT extern const TiClassDefinition kTiClassDefinitionEmpty;

/*!
@function
@abstract Creates a Ti class suitable for use with TiObjectMake.
@param definition A TiClassDefinition that defines the class.
@result A TiClass with the given definition. Ownership follows the Create Rule.
*/
JS_EXPORT TiClassRef TiClassCreate(const TiClassDefinition* definition);

/*!
@function
@abstract Retains a Ti class.
@param jsClass The TiClass to retain.
@result A TiClass that is the same as jsClass.
*/
JS_EXPORT TiClassRef TiClassRetain(TiClassRef jsClass);

/*!
@function
@abstract Releases a Ti class.
@param jsClass The TiClass to release.
*/
JS_EXPORT void TiClassRelease(TiClassRef jsClass);

/*!
@function
@abstract Creates a Ti object.
@param ctx The execution context to use.
@param jsClass The TiClass to assign to the object. Pass NULL to use the default object class.
@param data A void* to set as the object's private data. Pass NULL to specify no private data.
@result A TiObject with the given class and private data.
@discussion The default object class does not allocate storage for private data, so you must provide a non-NULL jsClass to TiObjectMake if you want your object to be able to store private data.

data is set on the created object before the intialize methods in its class chain are called. This enables the initialize methods to retrieve and manipulate data through TiObjectGetPrivate.
*/
JS_EXPORT TiObjectRef TiObjectMake(TiContextRef ctx, TiClassRef jsClass, void* data);

/*!
@function
@abstract Convenience method for creating a Ti function with a given callback as its implementation.
@param ctx The execution context to use.
@param name A TiString containing the function's name. This will be used when converting the function to string. Pass NULL to create an anonymous function.
@param callAsFunction The TiObjectCallAsFunctionCallback to invoke when the function is called.
@result A TiObject that is a function. The object's prototype will be the default function prototype.
*/
JS_EXPORT TiObjectRef TiObjectMakeFunctionWithCallback(TiContextRef ctx, TiStringRef name, TiObjectCallAsFunctionCallback callAsFunction);

/*!
@function
@abstract Convenience method for creating a Ti constructor.
@param ctx The execution context to use.
@param jsClass A TiClass that is the class your constructor will assign to the objects its constructs. jsClass will be used to set the constructor's .prototype property, and to evaluate 'instanceof' expressions. Pass NULL to use the default object class.
@param callAsConstructor A TiObjectCallAsConstructorCallback to invoke when your constructor is used in a 'new' expression. Pass NULL to use the default object constructor.
@result A TiObject that is a constructor. The object's prototype will be the default object prototype.
@discussion The default object constructor takes no arguments and constructs an object of class jsClass with no private data.
*/
JS_EXPORT TiObjectRef TiObjectMakeConstructor(TiContextRef ctx, TiClassRef jsClass, TiObjectCallAsConstructorCallback callAsConstructor);

/*!
 @function
 @abstract Creates a Ti Array object.
 @param ctx The execution context to use.
 @param argumentCount An integer count of the number of arguments in arguments.
 @param arguments A TiValue array of data to populate the Array with. Pass NULL if argumentCount is 0.
 @param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
 @result A TiObject that is an Array.
 @discussion The behavior of this function does not exactly match the behavior of the built-in Array constructor. Specifically, if one argument 
 is supplied, this function returns an array with one element.
 */
JS_EXPORT TiObjectRef TiObjectMakeArray(TiContextRef ctx, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception) AVAILABLE_IN_WEBKIT_VERSION_4_0;

/*!
 @function
 @abstract Creates a Ti Date object, as if by invoking the built-in Date constructor.
 @param ctx The execution context to use.
 @param argumentCount An integer count of the number of arguments in arguments.
 @param arguments A TiValue array of arguments to pass to the Date Constructor. Pass NULL if argumentCount is 0.
 @param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
 @result A TiObject that is a Date.
 */
JS_EXPORT TiObjectRef TiObjectMakeDate(TiContextRef ctx, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception) AVAILABLE_IN_WEBKIT_VERSION_4_0;

/*!
 @function
 @abstract Creates a Ti Error object, as if by invoking the built-in Error constructor.
 @param ctx The execution context to use.
 @param argumentCount An integer count of the number of arguments in arguments.
 @param arguments A TiValue array of arguments to pass to the Error Constructor. Pass NULL if argumentCount is 0.
 @param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
 @result A TiObject that is a Error.
 */
JS_EXPORT TiObjectRef TiObjectMakeError(TiContextRef ctx, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception) AVAILABLE_IN_WEBKIT_VERSION_4_0;

/*!
 @function
 @abstract Creates a Ti RegExp object, as if by invoking the built-in RegExp constructor.
 @param ctx The execution context to use.
 @param argumentCount An integer count of the number of arguments in arguments.
 @param arguments A TiValue array of arguments to pass to the RegExp Constructor. Pass NULL if argumentCount is 0.
 @param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
 @result A TiObject that is a RegExp.
 */
JS_EXPORT TiObjectRef TiObjectMakeRegExp(TiContextRef ctx, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception) AVAILABLE_IN_WEBKIT_VERSION_4_0;

/*!
@function
@abstract Creates a function with a given script as its body.
@param ctx The execution context to use.
@param name A TiString containing the function's name. This will be used when converting the function to string. Pass NULL to create an anonymous function.
@param parameterCount An integer count of the number of parameter names in parameterNames.
@param parameterNames A TiString array containing the names of the function's parameters. Pass NULL if parameterCount is 0.
@param body A TiString containing the script to use as the function's body.
@param sourceURL A TiString containing a URL for the script's source file. This is only used when reporting exceptions. Pass NULL if you do not care to include source file information in exceptions.
@param startingLineNumber An integer value specifying the script's starting line number in the file located at sourceURL. This is only used when reporting exceptions.
@param exception A pointer to a TiValueRef in which to store a syntax error exception, if any. Pass NULL if you do not care to store a syntax error exception.
@result A TiObject that is a function, or NULL if either body or parameterNames contains a syntax error. The object's prototype will be the default function prototype.
@discussion Use this method when you want to execute a script repeatedly, to avoid the cost of re-parsing the script before each execution.
*/
JS_EXPORT TiObjectRef TiObjectMakeFunction(TiContextRef ctx, TiStringRef name, unsigned parameterCount, const TiStringRef parameterNames[], TiStringRef body, TiStringRef sourceURL, int startingLineNumber, TiValueRef* exception);

/*!
@function
@abstract Gets an object's prototype.
@param ctx  The execution context to use.
@param object A TiObject whose prototype you want to get.
@result A TiValue that is the object's prototype.
*/
JS_EXPORT TiValueRef TiObjectGetPrototype(TiContextRef ctx, TiObjectRef object);

/*!
@function
@abstract Sets an object's prototype.
@param ctx  The execution context to use.
@param object The TiObject whose prototype you want to set.
@param value A TiValue to set as the object's prototype.
*/
JS_EXPORT void TiObjectSetPrototype(TiContextRef ctx, TiObjectRef object, TiValueRef value);

/*!
@function
@abstract Tests whether an object has a given property.
@param object The TiObject to test.
@param propertyName A TiString containing the property's name.
@result true if the object has a property whose name matches propertyName, otherwise false.
*/
JS_EXPORT bool TiObjectHasProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName);

/*!
@function
@abstract Gets a property from an object.
@param ctx The execution context to use.
@param object The TiObject whose property you want to get.
@param propertyName A TiString containing the property's name.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result The property's value if object has the property, otherwise the undefined value.
*/
JS_EXPORT TiValueRef TiObjectGetProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef* exception);

/*!
@function
@abstract Sets a property on an object.
@param ctx The execution context to use.
@param object The TiObject whose property you want to set.
@param propertyName A TiString containing the property's name.
@param value A TiValue to use as the property's value.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@param attributes A logically ORed set of TiPropertyAttributes to give to the property.
*/
JS_EXPORT void TiObjectSetProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef value, TiPropertyAttributes attributes, TiValueRef* exception);

/*!
@function
@abstract Deletes a property from an object.
@param ctx The execution context to use.
@param object The TiObject whose property you want to delete.
@param propertyName A TiString containing the property's name.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result true if the delete operation succeeds, otherwise false (for example, if the property has the kTiPropertyAttributeDontDelete attribute set).
*/
JS_EXPORT bool TiObjectDeleteProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef* exception);

/*!
@function
@abstract Gets a property from an object by numeric index.
@param ctx The execution context to use.
@param object The TiObject whose property you want to get.
@param propertyIndex An integer value that is the property's name.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result The property's value if object has the property, otherwise the undefined value.
@discussion Calling TiObjectGetPropertyAtIndex is equivalent to calling TiObjectGetProperty with a string containing propertyIndex, but TiObjectGetPropertyAtIndex provides optimized access to numeric properties.
*/
JS_EXPORT TiValueRef TiObjectGetPropertyAtIndex(TiContextRef ctx, TiObjectRef object, unsigned propertyIndex, TiValueRef* exception);

/*!
@function
@abstract Sets a property on an object by numeric index.
@param ctx The execution context to use.
@param object The TiObject whose property you want to set.
@param propertyIndex The property's name as a number.
@param value A TiValue to use as the property's value.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@discussion Calling TiObjectSetPropertyAtIndex is equivalent to calling TiObjectSetProperty with a string containing propertyIndex, but TiObjectSetPropertyAtIndex provides optimized access to numeric properties.
*/
JS_EXPORT void TiObjectSetPropertyAtIndex(TiContextRef ctx, TiObjectRef object, unsigned propertyIndex, TiValueRef value, TiValueRef* exception);

/*!
@function
@abstract Gets an object's private data.
@param object A TiObject whose private data you want to get.
@result A void* that is the object's private data, if the object has private data, otherwise NULL.
*/
JS_EXPORT void* TiObjectGetPrivate(TiObjectRef object);

/*!
@function
@abstract Sets a pointer to private data on an object.
@param object The TiObject whose private data you want to set.
@param data A void* to set as the object's private data.
@result true if object can store private data, otherwise false.
@discussion The default object class does not allocate storage for private data. Only objects created with a non-NULL TiClass can store private data.
*/
JS_EXPORT bool TiObjectSetPrivate(TiObjectRef object, void* data);

/*!
@function
@abstract Tests whether an object can be called as a function.
@param ctx  The execution context to use.
@param object The TiObject to test.
@result true if the object can be called as a function, otherwise false.
*/
JS_EXPORT bool TiObjectIsFunction(TiContextRef ctx, TiObjectRef object);

/*!
@function
@abstract Calls an object as a function.
@param ctx The execution context to use.
@param object The TiObject to call as a function.
@param thisObject The object to use as "this," or NULL to use the global object as "this."
@param argumentCount An integer count of the number of arguments in arguments.
@param arguments A TiValue array of arguments to pass to the function. Pass NULL if argumentCount is 0.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result The TiValue that results from calling object as a function, or NULL if an exception is thrown or object is not a function.
*/
JS_EXPORT TiValueRef TiObjectCallAsFunction(TiContextRef ctx, TiObjectRef object, TiObjectRef thisObject, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception);

/*!
@function
@abstract Tests whether an object can be called as a constructor.
@param ctx  The execution context to use.
@param object The TiObject to test.
@result true if the object can be called as a constructor, otherwise false.
*/
JS_EXPORT bool TiObjectIsConstructor(TiContextRef ctx, TiObjectRef object);

/*!
@function
@abstract Calls an object as a constructor.
@param ctx The execution context to use.
@param object The TiObject to call as a constructor.
@param argumentCount An integer count of the number of arguments in arguments.
@param arguments A TiValue array of arguments to pass to the constructor. Pass NULL if argumentCount is 0.
@param exception A pointer to a TiValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result The TiObject that results from calling object as a constructor, or NULL if an exception is thrown or object is not a constructor.
*/
JS_EXPORT TiObjectRef TiObjectCallAsConstructor(TiContextRef ctx, TiObjectRef object, size_t argumentCount, const TiValueRef arguments[], TiValueRef* exception);

/*!
@function
@abstract Gets the names of an object's enumerable properties.
@param ctx The execution context to use.
@param object The object whose property names you want to get.
@result A TiPropertyNameArray containing the names object's enumerable properties. Ownership follows the Create Rule.
*/
JS_EXPORT TiPropertyNameArrayRef TiObjectCopyPropertyNames(TiContextRef ctx, TiObjectRef object);

/*!
@function
@abstract Retains a Ti property name array.
@param array The TiPropertyNameArray to retain.
@result A TiPropertyNameArray that is the same as array.
*/
JS_EXPORT TiPropertyNameArrayRef TiPropertyNameArrayRetain(TiPropertyNameArrayRef array);

/*!
@function
@abstract Releases a Ti property name array.
@param array The JSPropetyNameArray to release.
*/
JS_EXPORT void TiPropertyNameArrayRelease(TiPropertyNameArrayRef array);

/*!
@function
@abstract Gets a count of the number of items in a Ti property name array.
@param array The array from which to retrieve the count.
@result An integer count of the number of names in array.
*/
JS_EXPORT size_t TiPropertyNameArrayGetCount(TiPropertyNameArrayRef array);

/*!
@function
@abstract Gets a property name at a given index in a Ti property name array.
@param array The array from which to retrieve the property name.
@param index The index of the property name to retrieve.
@result A TiStringRef containing the property name.
*/
JS_EXPORT TiStringRef TiPropertyNameArrayGetNameAtIndex(TiPropertyNameArrayRef array, size_t index);

/*!
@function
@abstract Adds a property name to a Ti property name accumulator.
@param accumulator The accumulator object to which to add the property name.
@param propertyName The property name to add.
*/
JS_EXPORT void TiPropertyNameAccumulatorAddName(TiPropertyNameAccumulatorRef accumulator, TiStringRef propertyName);

#ifdef __cplusplus
}
#endif

#endif /* TiObjectRef_h */
