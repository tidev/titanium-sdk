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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef TiManagedValue_h
#define TiManagedValue_h

#import <JavaScriptCore/TiBase.h>

#if JSC_OBJC_API_ENABLED

@class TiValue;
@class TiContext;

/*!
@interface
@discussion TiManagedValue represents a "conditionally retained" TiValue. 
 "Conditionally retained" means that as long as either the TiManagedValue's 
 JavaScript value is reachable through the JavaScript object graph
 or the TiManagedValue object is reachable through the external Objective-C 
 object graph as reported to the TiVirtualMachine using 
 addManagedReference:withOwner:, the corresponding JavaScript value will 
 be retained. However, if neither of these conditions are true, the 
 corresponding TiValue will be released and set to nil.

 The primary use case for TiManagedValue is for safely referencing TiValues 
 from the Objective-C heap. It is incorrect to store a TiValue into an 
 Objective-C heap object, as this can very easily create a reference cycle, 
 keeping the entire TiContext alive.
*/ 
NS_CLASS_AVAILABLE(10_9, 7_0)
@interface TiManagedValue : NSObject

/*!
@method
@abstract Create a TiManagedValue from a TiValue.
@param value
@result The new TiManagedValue.
*/
+ (TiManagedValue *)managedValueWithValue:(TiValue *)value;

/*!
@method
@abstract Create a TiManagedValue.
@param value
@result The new TiManagedValue.
*/
- (instancetype)initWithValue:(TiValue *)value;

/*!
@property
@abstract Get the TiValue from the TiManagedValue.
@result The corresponding TiValue for this TiManagedValue or 
 nil if the TiValue has been collected.
*/
@property (readonly, strong) TiValue *value;

@end

#endif // JSC_OBJC_API_ENABLED

#endif // TiManagedValue_h
