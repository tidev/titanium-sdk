/**
 * Appcelerator Titanium License
 * This source code and all modifications done by Appcelerator
 * are licensed under the Apache Public License (version 2) and
 * are Copyright (c) 2009-2014 by Appcelerator, Inc.
 */

/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#ifndef TiValue_h
#define TiValue_h

#if JSC_OBJC_API_ENABLED

#import <CoreGraphics/CGGeometry.h>

@class TiContext;

/*!
@interface
@discussion A TiValue is a reference to a value within the JavaScript object space of a
 TiVirtualMachine. All instances of TiValue originate from a TiContext and
 hold a strong reference to this TiContext. As long as any value associated with 
 a particular TiContext is retained, that TiContext will remain alive. 
 Where an instance method is invoked upon a TiValue, and this returns another 
 TiValue, the returned TiValue will originate from the same TiContext as the 
 TiValue on which the method was invoked.

 All JavaScript values are associated with a particular TiVirtualMachine
 (the associated TiVirtualMachine is available indirectly via the context
 property). An instance of TiValue may only be passed as an argument to
 methods on instances of TiValue and TiContext that belong to the same
 TiVirtualMachine - passing a TiValue to a method on an object originating
 from a different TiVirtualMachine will result in an Objective-C exception
 being raised.
*/
NS_CLASS_AVAILABLE(10_9, 7_0)
@interface TiValue : NSObject

/*!
@property
@abstract The TiContext that this value originates from.
*/
@property (readonly, strong) TiContext *context;

/*!
@methodgroup Creating JavaScript Values
*/
/*!
@method
@abstract Create a TiValue by converting an Objective-C object.
@discussion The resulting TiValue retains the provided Objective-C object.
@param value The Objective-C object to be converted.
@result The new TiValue.
*/
+ (TiValue *)valueWithObject:(id)value inContext:(TiContext *)context;

/*!
@method
@abstract Create a JavaScript value from a BOOL primitive.
@param value
@param context The TiContext in which the resulting TiValue will be created.
@result The new TiValue representing the equivalent boolean value.
*/
+ (TiValue *)valueWithBool:(BOOL)value inContext:(TiContext *)context;

/*!
@method
@abstract Create a JavaScript value from a double primitive.
@param value
@param context The TiContext in which the resulting TiValue will be created.
@result The new TiValue representing the equivalent boolean value.
*/
+ (TiValue *)valueWithDouble:(double)value inContext:(TiContext *)context;

/*!
@method
@abstract Create a JavaScript value from an <code>int32_t</code> primitive.
@param value
@param context The TiContext in which the resulting TiValue will be created.
@result The new TiValue representing the equivalent boolean value.
*/
+ (TiValue *)valueWithInt32:(int32_t)value inContext:(TiContext *)context;

/*!
@method
@abstract Create a JavaScript value from a <code>uint32_t</code> primitive.
@param value
@param context The TiContext in which the resulting TiValue will be created.
@result The new TiValue representing the equivalent boolean value.
*/
+ (TiValue *)valueWithUInt32:(uint32_t)value inContext:(TiContext *)context;

/*!
@method
@abstract Create a new, empty JavaScript object.
@param context The TiContext in which the resulting object will be created.
@result The new JavaScript object.
*/
+ (TiValue *)valueWithNewObjectInContext:(TiContext *)context;

/*!
@method
@abstract Create a new, empty JavaScript array.
@param context The TiContext in which the resulting array will be created.
@result The new JavaScript array.
*/
+ (TiValue *)valueWithNewArrayInContext:(TiContext *)context;

/*!
@method
@abstract Create a new JavaScript regular expression object.
@param pattern The regular expression pattern.
@param flags The regular expression flags.
@param context The TiContext in which the resulting regular expression object will be created.
@result The new JavaScript regular expression object.
*/
+ (TiValue *)valueWithNewRegularExpressionFromPattern:(NSString *)pattern flags:(NSString *)flags inContext:(TiContext *)context;

/*!
@method
@abstract Create a new JavaScript error object.
@param message The error message.
@param context The TiContext in which the resulting error object will be created.
@result The new JavaScript error object.
*/
+ (TiValue *)valueWithNewErrorFromMessage:(NSString *)message inContext:(TiContext *)context;

/*!
@method
@abstract Create the JavaScript value <code>null</code>.
@param context The TiContext to which the resulting TiValue belongs.
@result The TiValue representing the JavaScript value <code>null</code>.
*/
+ (TiValue *)valueWithNullInContext:(TiContext *)context;

/*!
@method
@abstract Create the JavaScript value <code>undefined</code>.
@param context The TiContext to which the resulting TiValue belongs.
@result The TiValue representing the JavaScript value <code>undefined</code>.
*/
+ (TiValue *)valueWithUndefinedInContext:(TiContext *)context;

/*!
@methodgroup Converting to Objective-C Types
@discussion When converting between JavaScript values and Objective-C objects a copy is
 performed. Values of types listed below are copied to the corresponding
 types on conversion in each direction. For NSDictionaries, entries in the
 dictionary that are keyed by strings are copied onto a JavaScript object.
 For dictionaries and arrays, conversion is recursive, with the same object
 conversion being applied to all entries in the collection.

<pre>
@textblock
   Objective-C type  |   JavaScript type
 --------------------+---------------------
         nil         |     undefined
        NSNull       |        null
       NSString      |       string
       NSNumber      |   number, boolean
     NSDictionary    |   Object object
       NSArray       |    Array object
        NSDate       |     Date object
       NSBlock (1)   |   Function object (1)
          id (2)     |   Wrapper object (2)
        Class (3)    | Constructor object (3)
@/textblock
</pre>

 (1) Instances of NSBlock with supported arguments types will be presented to
 JavaScript as a callable Function object. For more information on supported
 argument types see TiExport.h. If a JavaScript Function originating from an
 Objective-C block is converted back to an Objective-C object the block will
 be returned. All other JavaScript functions will be converted in the same
 manner as a JavaScript object of type Object.

 (2) For Objective-C instances that do not derive from the set of types listed
 above, a wrapper object to provide a retaining handle to the Objective-C
 instance from JavaScript. For more information on these wrapper objects, see
 TiExport.h. When a JavaScript wrapper object is converted back to Objective-C
 the Objective-C instance being retained by the wrapper is returned.

 (3) For Objective-C Class objects a constructor object containing exported
 class methods will be returned. See TiExport.h for more information on
 constructor objects.

 For all methods taking arguments of type id, arguments will be converted
 into a JavaScript value according to the above conversion.
*/
/*!
@method
@abstract Convert this TiValue to an Objective-C object.
@discussion The TiValue is converted to an Objective-C object according 
 to the conversion rules specified above.
@result The Objective-C representation of this TiValue.
*/
- (id)toObject;

/*!
@method
@abstract Convert a TiValue to an Objective-C object of a specific class.
@discussion The TiValue is converted to an Objective-C object of the specified Class. 
 If the result is not of the specified Class then <code>nil</code> will be returned.
@result An Objective-C object of the specified Class or <code>nil</code>.
*/
- (id)toObjectOfClass:(Class)expectedClass;

/*!
@method
@abstract Convert a TiValue to a boolean.
@discussion The TiValue is converted to a boolean according to the rules specified 
 by the JavaScript language.
@result The boolean result of the conversion.
*/
- (BOOL)toBool;

/*!
@method
@abstract Convert a TiValue to a double.
@discussion The TiValue is converted to a number according to the rules specified 
 by the JavaScript language.
@result The double result of the conversion.
*/
- (double)toDouble;

/*!
@method
@abstract Convert a TiValue to an <code>int32_t</code>.
@discussion The TiValue is converted to an integer according to the rules specified 
 by the JavaScript language.
@result The <code>int32_t</code> result of the conversion.
*/
- (int32_t)toInt32;

/*!
@method
@abstract Convert a TiValue to a <code>uint32_t</code>.
@discussion The TiValue is converted to an integer according to the rules specified 
 by the JavaScript language.
@result The <code>uint32_t</code> result of the conversion.
*/
- (uint32_t)toUInt32;

/*!
@method
@abstract Convert a TiValue to a NSNumber.
@discussion If the TiValue represents a boolean, a NSNumber value of YES or NO 
 will be returned. For all other types the value will be converted to a number according 
 to the rules specified by the JavaScript language.
@result The NSNumber result of the conversion.
*/
- (NSNumber *)toNumber;

/*!
@method
@abstract Convert a TiValue to a NSString.
@discussion The TiValue is converted to a string according to the rules specified 
 by the JavaScript language.
@result The NSString containing the result of the conversion.
*/
- (NSString *)toString;

/*!
@method
@abstract Convert a TiValue to a NSDate.
@discussion The value is converted to a number representing a time interval 
 since 1970 which is then used to create a new NSDate instance.
@result The NSDate created using the converted time interval.
*/
- (NSDate *)toDate;

/*!
@method
@abstract Convert a TiValue to a NSArray.
@discussion If the value is <code>null</code> or <code>undefined</code> then <code>nil</code> is returned.
 If the value is not an object then a JavaScript TypeError will be thrown.
 The property <code>length</code> is read from the object, converted to an unsigned
 integer, and an NSArray of this size is allocated. Properties corresponding
 to indicies within the array bounds will be copied to the array, with
 TiValues converted to equivalent Objective-C objects as specified.
@result The NSArray containing the recursively converted contents of the 
 converted JavaScript array.
*/
- (NSArray *)toArray;

/*!
@method
@abstract Convert a TiValue to a NSDictionary.
@discussion If the value is <code>null</code> or <code>undefined</code> then <code>nil</code> is returned.
 If the value is not an object then a JavaScript TypeError will be thrown.
 All enumerable properties of the object are copied to the dictionary, with
 TiValues converted to equivalent Objective-C objects as specified.
@result The NSDictionary containing the recursively converted contents of
 the converted JavaScript object.
*/
- (NSDictionary *)toDictionary;

/*!
@methodgroup Accessing Properties
*/
/*!
@method
@abstract Access a property of a TiValue.
@result The TiValue for the requested property or the TiValue <code>undefined</code> 
 if the property does not exist.
*/
- (TiValue *)valueForProperty:(NSString *)property;

/*!
@method
@abstract Set a property on a TiValue.
*/
- (void)setValue:(id)value forProperty:(NSString *)property;

/*!
@method
@abstract Delete a property from a TiValue.
@result YES if deletion is successful, NO otherwise.
*/
- (BOOL)deleteProperty:(NSString *)property;

/*!
@method
@abstract Check if a TiValue has a property.
@discussion This method has the same function as the JavaScript operator <code>in</code>.
@result Returns YES if property is present on the value.
*/
- (BOOL)hasProperty:(NSString *)property;

/*!
@method
@abstract Define properties with custom descriptors on TiValues.
@discussion This method may be used to create a data or accessor property on an object.
 This method operates in accordance with the Object.defineProperty method in the 
 JavaScript language.
*/
- (void)defineProperty:(NSString *)property descriptor:(id)descriptor;

/*!
@method
@abstract Access an indexed (numerical) property on a TiValue.
@result The TiValue for the property at the specified index. 
 Returns the JavaScript value <code>undefined</code> if no property exists at that index. 
*/
- (TiValue *)valueAtIndex:(NSUInteger)index;

/*!
@method
@abstract Set an indexed (numerical) property on a TiValue.
@discussion For TiValues that are JavaScript arrays, indices greater than 
 UINT_MAX - 1 will not affect the length of the array.
*/
- (void)setValue:(id)value atIndex:(NSUInteger)index;

/*!
@methodgroup Checking JavaScript Types
*/
/*!
@method
@abstract Check if a TiValue corresponds to the JavaScript value <code>undefined</code>.
*/ 
- (BOOL)isUndefined;

/*!
@method
@abstract Check if a TiValue corresponds to the JavaScript value <code>null</code>.
*/
- (BOOL)isNull;

/*!
@method
@abstract Check if a TiValue is a boolean.
*/
- (BOOL)isBoolean;

/*!
@method
@abstract Check if a TiValue is a number.
@discussion In JavaScript, there is no differentiation between types of numbers.
 Semantically all numbers behave like doubles except in special cases like bit
 operations. 
*/
- (BOOL)isNumber;

/*!
@method
@abstract Check if a TiValue is a string.
*/
- (BOOL)isString;

/*!
@method
@abstract Check if a TiValue is an object.
*/
- (BOOL)isObject;

/*!
@method
@abstract Compare two TiValues using JavaScript's <code>===</code> operator.
*/
- (BOOL)isEqualToObject:(id)value;

/*!
@method
@abstract Compare two TiValues using JavaScript's <code>==</code> operator.
*/
- (BOOL)isEqualWithTypeCoercionToObject:(id)value;

/*!
@method
@abstract Check if a TiValue is an instance of another object.
@discussion This method has the same function as the JavaScript operator <code>instanceof</code>.
 If an object other than a TiValue is passed, it will first be converted according to
 the aforementioned rules.
*/
- (BOOL)isInstanceOf:(id)value;

/*!
@methodgroup Calling Functions and Constructors
*/
/*!
@method
@abstract Invoke a TiValue as a function.
@discussion In JavaScript, if a function doesn't explicitly return a value then it
 implicitly returns the JavaScript value <code>undefined</code>.
@param arguments The arguments to pass to the function.
@result The return value of the function call. 
*/
- (TiValue *)callWithArguments:(NSArray *)arguments;

/*!
@method
@abstract Invoke a TiValue as a constructor.
@discussion This is equivalent to using the <code>new</code> syntax in JavaScript.
@param arguments The arguments to pass to the constructor.
@result The return value of the constructor call.
*/
- (TiValue *)constructWithArguments:(NSArray *)arguments;

/*!
@method
@abstract Invoke a method on a TiValue.
@discussion Accesses the property named <code>method</code> from this value and 
 calls the resulting value as a function, passing this TiValue as the <code>this</code>
 value along with the specified arguments.
@param method The name of the method to be invoked.
@param arguments The arguments to pass to the method.
@result The return value of the method call.
*/
- (TiValue *)invokeMethod:(NSString *)method withArguments:(NSArray *)arguments;

@end

/*!
@category
@discussion Objective-C methods exported to JavaScript may have argument and/or return
 values of struct types, provided that conversion to and from the struct is
 supported by TiValue. Support is provided for any types where TiValue
 contains both a class method <code>valueWith<Type>:inContext:</code>, and and instance
 method <code>to<Type></code>- where the string <code><Type></code> in these selector names match,
 with the first argument to the former being of the same struct type as the
 return type of the latter.
 Support is provided for structs of type CGPoint, NSRange, CGRect and CGSize.
*/
@interface TiValue (StructSupport)

/*!
@method
@abstract Create a TiValue from a CGPoint.
@result A newly allocated JavaScript object containing properties
 named <code>x</code> and <code>y</code>, with values from the CGPoint.
*/
+ (TiValue *)valueWithPoint:(CGPoint)point inContext:(TiContext *)context;

/*!
@method
@abstract Create a TiValue from a NSRange.
@result A newly allocated JavaScript object containing properties
 named <code>location</code> and <code>length</code>, with values from the NSRange.
*/
+ (TiValue *)valueWithRange:(NSRange)range inContext:(TiContext *)context;

/*!
@method
@abstract 
Create a TiValue from a CGRect.
@result A newly allocated JavaScript object containing properties
 named <code>x</code>, <code>y</code>, <code>width</code>, and <code>height</code>, with values from the CGRect.
*/
+ (TiValue *)valueWithRect:(CGRect)rect inContext:(TiContext *)context;

/*!
@method
@abstract Create a TiValue from a CGSize.
@result A newly allocated JavaScript object containing properties
 named <code>width</code> and <code>height</code>, with values from the CGSize.
*/
+ (TiValue *)valueWithSize:(CGSize)size inContext:(TiContext *)context;

/*!
@method
@abstract Convert a TiValue to a CGPoint.
@discussion Reads the properties named <code>x</code> and <code>y</code> from
 this TiValue, and converts the results to double.
@result The new CGPoint.
*/
- (CGPoint)toPoint;

/*!
@method
@abstract Convert a TiValue to an NSRange.
@discussion Reads the properties named <code>location</code> and
 <code>length</code> from this TiValue and converts the results to double.
@result The new NSRange.
*/
- (NSRange)toRange;

/*!
@method
@abstract Convert a TiValue to a CGRect.
@discussion Reads the properties named <code>x</code>, <code>y</code>, 
 <code>width</code>, and <code>height</code> from this TiValue and converts the results to double.
@result The new CGRect.
*/
- (CGRect)toRect;

/*!
@method
@abstract Convert a TiValue to a CGSize.
@discussion Reads the properties named <code>width</code> and
 <code>height</code> from this TiValue and converts the results to double.
@result The new CGSize.
*/
- (CGSize)toSize;

@end

/*!
@category
@discussion Instances of TiValue implement the following methods in order to enable
 support for subscript access by key and index, for example:

@textblock
    TiValue *objectA, *objectB;
    TiValue *v1 = object[@"X"]; // Get value for property "X" from 'object'.
    TiValue *v2 = object[42];   // Get value for index 42 from 'object'.
    object[@"Y"] = v1;          // Assign 'v1' to property "Y" of 'object'.
    object[101] = v2;           // Assign 'v2' to index 101 of 'object'.
@/textblock

 An object key passed as a subscript will be converted to a JavaScript value,
 and then the value converted to a string used as a property name.
*/
@interface TiValue (SubscriptSupport)

- (TiValue *)objectForKeyedSubscript:(id)key;
- (TiValue *)objectAtIndexedSubscript:(NSUInteger)index;
- (void)setObject:(id)object forKeyedSubscript:(NSObject <NSCopying> *)key;
- (void)setObject:(id)object atIndexedSubscript:(NSUInteger)index;

@end

/*!
@category
@discussion  These functions are for bridging between the C API and the Objective-C API.
*/
@interface TiValue (TiValueRefSupport)

/*!
@method
@abstract Creates a TiValue, wrapping its C API counterpart.
@param value
@param context
@result The Objective-C API equivalent of the specified TiValueRef.
*/
+ (TiValue *)valueWithTiValueRef:(TiValueRef)value inContext:(TiContext *)context;

/*!
@property
@abstract Returns the C API counterpart wrapped by a TiContext.
@result The C API equivalent of this TiValue.
*/
@property (readonly) TiValueRef TiValueRef;
@end

#ifdef __cplusplus
extern "C" {
#endif

/*!
@group Property Descriptor Constants
@discussion These keys may assist in creating a property descriptor for use with the
 defineProperty method on TiValue.
 Property descriptors must fit one of three descriptions:

 Data Descriptor:
  - A descriptor containing one or both of the keys <code>value</code> and <code>writable</code>,
    and optionally containing one or both of the keys <code>enumerable</code> and
    <code>configurable</code>. A data descriptor may not contain either the <code>get</code> or
    <code>set</code> key.
    A data descriptor may be used to create or modify the attributes of a
    data property on an object (replacing any existing accessor property).

 Accessor Descriptor:
  - A descriptor containing one or both of the keys <code>get</code> and <code>set</code>, and
    optionally containing one or both of the keys <code>enumerable</code> and
    <code>configurable</code>. An accessor descriptor may not contain either the <code>value</code>
    or <code>writable</code> key.
    An accessor descriptor may be used to create or modify the attributes of
    an accessor property on an object (replacing any existing data property).

 Generic Descriptor:
  - A descriptor containing one or both of the keys <code>enumerable</code> and
    <code>configurable</code>. A generic descriptor may not contain any of the keys
    <code>value</code>, <code>writable</code>, <code>get</code>, or <code>set</code>.
    A generic descriptor may be used to modify the attributes of an existing
    data or accessor property, or to create a new data property.
*/
/*!
@const 
*/
JS_EXPORT extern NSString * const JSPropertyDescriptorWritableKey;
/*!
@const 
*/
JS_EXPORT extern NSString * const JSPropertyDescriptorEnumerableKey;
/*!
@const 
*/
JS_EXPORT extern NSString * const JSPropertyDescriptorConfigurableKey;
/*!
@const 
*/
JS_EXPORT extern NSString * const JSPropertyDescriptorValueKey;
/*!
@const 
*/
JS_EXPORT extern NSString * const JSPropertyDescriptorGetKey;
/*!
@const 
*/
JS_EXPORT extern NSString * const JSPropertyDescriptorSetKey;

#ifdef __cplusplus
} // extern "C"
#endif

#endif

#endif // TiValue_h
