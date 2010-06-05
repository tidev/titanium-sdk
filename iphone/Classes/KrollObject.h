/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TiCore.h"

@class KrollContext;
extern TiClassRef KrollObjectClassRef;

void KrollFinalizer(TiObjectRef ref);
void KrollInitializer(TiContextRef ctx, TiObjectRef object);
TiValueRef KrollGetProperty(TiContextRef jsContext, TiObjectRef obj, TiStringRef prop, TiValueRef* exception);
bool KrollSetProperty(TiContextRef jsContext, TiObjectRef obj, TiStringRef prop, TiValueRef value, TiValueRef* exception);
bool KrollDeleteProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef* exception);

// this is simply a marker interface that we can use 
// to determine if a object is undefined
@interface KrollUndefined : NSObject
+(KrollUndefined*)undefined;
@end


//
// KrollObject is a generic native wrapper around a native object exposed as a JS object 
// in JS land. 
//
@interface KrollObject : NSObject {
@protected
	id target;
	KrollContext *context;
	NSMutableDictionary *properties;
	TiObjectRef jsobject;
}
-(id)initWithTarget:(id)target_ context:(KrollContext*)context_;

+(TiValueRef)create:(id)object context:(KrollContext*)context_;
+(id)toID:(KrollContext*)context value:(TiValueRef)ref;
+(TiValueRef)toValue:(KrollContext*)context value:(id)obj;
+(id)nonNull:(id)value;


-(id)valueForKey:(NSString *)key;
-(void)deleteKey:(NSString *)key;
-(void)setValue:(id)value forKey:(NSString *)key;
-(void)setStaticValue:(id)value forKey:(NSString*)key;
-(KrollContext*)context;
-(id)target;

@end

