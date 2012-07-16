/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TiCore.h"
#import "TiBase.h"

@class KrollContext, KrollCallback;
extern TiClassRef KrollObjectClassRef;
extern TiStringRef kTiStringExportsKey;

void KrollFinalizer(TiObjectRef ref);
void KrollInitializer(TiContextRef ctx, TiObjectRef object);
TiValueRef KrollGetProperty(TiContextRef jsContext, TiObjectRef obj, TiStringRef prop, TiValueRef* exception);
bool KrollSetProperty(TiContextRef jsContext, TiObjectRef obj, TiStringRef prop, TiValueRef value, TiValueRef* exception);
bool KrollDeleteProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef* exception);


//
// KrollObject is a generic native wrapper around a native object exposed as a JS object 
// in JS land. 
//

@class KrollBridge;
@interface KrollObject : NSObject {
@private
	NSMutableDictionary *properties;
	NSMutableDictionary *statics;
	TiObjectRef jsobject;
	TiObjectRef propsObject;
	BOOL targetable;
	BOOL finalized;
	BOOL protecting;
@protected
	id target;
	KrollContext *context;
	KrollBridge *bridge;	//Used only in finalizing for sake of safe lookup.
}
@property(nonatomic,assign) BOOL finalized;
@property(nonatomic,readonly) KrollBridge *bridge;

-(id)initWithTarget:(id)target_ context:(KrollContext*)context_;

+(TiValueRef)create:(id)object context:(KrollContext*)context_;
+(id)toID:(KrollContext*)context value:(TiValueRef)ref;
+(TiValueRef)toValue:(KrollContext*)context value:(id)obj;
+(id)nonNull:(id)value;


-(id)valueForKey:(NSString *)key;
-(void)deleteKey:(NSString *)key;
-(void)setValue:(id)value forKey:(NSString *)key;
-(void)setStaticValue:(id)value forKey:(NSString*)key purgable:(BOOL)purgable;
-(KrollContext*)context;
-(id)target;

//TODO: Lots of copypasted code in these methods could be refactored out.
@property(nonatomic,assign) TiObjectRef propsObject;
-(TiObjectRef)jsobject;
-(void)invalidateJsobject;
-(TiValueRef)jsvalueForUndefinedKey:(NSString *)key;

-(void)noteKeylessKrollObject:(KrollObject *)value;
-(void)forgetKeylessKrollObject:(KrollObject *)value;
-(void)protectJsobject;
-(void)unprotectJsobject;

-(void)noteKrollObject:(KrollObject *)value forKey:(NSString *)key;
-(void)forgetKrollObjectforKey:(NSString *)key;
-(void)noteObject:(TiObjectRef)storedJSObject forTiString:(TiStringRef) keyString context:(TiContextRef) jsxContext;
-(void)forgetObjectForTiString:(TiStringRef) keyString context:(TiContextRef) jsContext;
-(TiObjectRef)objectForTiString:(TiStringRef) keyString context:(TiContextRef) jsContext;

-(void)noteCallback:(KrollCallback *)eventCallback forKey:(NSString *)key;
-(void)forgetCallbackForKey:(NSString *)key;
-(void)invokeCallbackForKey:(NSString *)key withObject:(NSDictionary *)eventData thisObject:(KrollObject *)thisObject;


-(void)storeListener:(KrollCallback *)eventCallback forEvent:(NSString *)eventName;
-(void)removeListener:(KrollCallback *)eventCallback forEvent:(NSString *)eventName;
-(void)triggerEvent:(NSString *)eventName withObject:(NSDictionary *)eventData thisObject:(KrollObject *)thisObject;

@end

