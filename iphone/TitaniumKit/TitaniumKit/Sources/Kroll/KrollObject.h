/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

@class KrollContext, KrollCallback, TiProxy;
extern JSClassRef KrollObjectClassRef;
extern JSStringRef kTiStringExportsKey;

void KrollFinalizer(JSObjectRef ref);
void KrollInitializer(JSContextRef ctx, JSObjectRef object);
JSValueRef KrollGetProperty(JSContextRef jsContext, JSObjectRef obj, JSStringRef prop, JSValueRef *exception);
bool KrollSetProperty(JSContextRef jsContext, JSObjectRef obj, JSStringRef prop, JSValueRef value, JSValueRef *exception);
bool KrollDeleteProperty(JSContextRef ctx, JSObjectRef object, JSStringRef propertyName, JSValueRef *exception);

//
// KrollObject is a generic native wrapper around a native object exposed as a JS object
// in JS land.
//

@class KrollBridge;
@interface KrollObject : NSObject {
  @private
  NSMutableDictionary *properties;
  NSMutableDictionary *statics;
  JSObjectRef jsobject;
  JSObjectRef propsObject;
  BOOL targetable;
  BOOL finalized;
  BOOL protecting;
  @protected
  id target;
  KrollContext *context;
  JSContextRef jsContext;
  KrollBridge *bridge; //Used only in finalizing for sake of safe lookup.
}
@property (nonatomic, assign) BOOL finalized;
@property (nonatomic, readonly) KrollBridge *bridge;
@property (nonatomic, readonly) KrollContext *context;
@property (nonatomic, readonly) JSContextRef jsContext;

- (id)initWithTarget:(id)target_ context:(KrollContext *)context_;

+ (JSValueRef)create:(id)object context:(KrollContext *)context_;
+ (id)toID:(KrollContext *)context value:(JSValueRef)ref;
+ (JSValueRef)toValue:(KrollContext *)context value:(id)obj;
+ (id)nonNull:(id)value;

- (id)valueForKey:(NSString *)key;
- (void)deleteKey:(NSString *)key;
- (void)setValue:(id)value forKey:(NSString *)key;
- (void)setStaticValue:(id)value forKey:(NSString *)key purgable:(BOOL)purgable;
- (id)target;

//TODO: Lots of copypasted code in these methods could be refactored out.
@property (nonatomic, assign) JSObjectRef propsObject;
- (JSObjectRef)jsobject;
- (void)invalidateJsobject;
- (JSValueRef)jsvalueForUndefinedKey:(NSString *)key;

- (void)noteKeylessKrollObject:(KrollObject *)value;
- (void)forgetKeylessKrollObject:(KrollObject *)value;
- (void)protectJsobject;
- (void)unprotectJsobject;

- (void)noteKrollObject:(KrollObject *)value forKey:(NSString *)key;
- (void)forgetKrollObjectforKey:(NSString *)key;
- (void)noteObject:(JSObjectRef)storedJSObject forTiString:(JSStringRef)keyString context:(JSContextRef)jsxContext;
- (void)forgetObjectForTiString:(JSStringRef)keyString context:(JSContextRef)jsContext;
- (JSObjectRef)objectForTiString:(JSStringRef)keyString context:(JSContextRef)jsContext;

- (void)noteCallback:(KrollCallback *)eventCallback forKey:(NSString *)key;
- (void)forgetCallbackForKey:(NSString *)key;
- (void)invokeCallbackForKey:(NSString *)key withObject:(NSDictionary *)eventData thisObject:(KrollObject *)thisObject;
- (void)invokeCallbackForKey:(NSString *)key withObject:(NSDictionary *)eventData thisObject:(KrollObject *)thisObject onDone:(void (^)(id result))block;

- (JSObjectRef)callbacksForEvent:(JSStringRef)jsEventTypeString;
- (void)storeListener:(id)eventCallbackOrWrapper forEvent:(NSString *)eventName;
- (void)removeListener:(KrollCallback *)eventCallback forEvent:(NSString *)eventName;
- (void)triggerEvent:(NSString *)eventName withObject:(NSDictionary *)eventData thisObject:(KrollObject *)thisObject;

#ifdef USE_JSCORE_FRAMEWORK
- (void)applyGarbageCollectionSafeguard;
- (void)removeGarbageCollectionSafeguard;
#endif

@end
