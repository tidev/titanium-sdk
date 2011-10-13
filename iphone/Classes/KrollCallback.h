/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TiCore.h"
#import "KrollContext.h"

@class KrollBridge;
//
// KrollCallback is a wrapper around a JS function object which is passed
// from JS land to native.  This object can be passed around on the native
// side as a normal opaque object and then passed back through to Kroll
// for function invocation (or just to pass the function object back as-is)
//
@interface KrollCallback : NSObject {
@private
	TiContextRef jsContext;
	TiObjectRef thisObj;
	TiObjectRef function;
	KrollContext *context;
	KrollBridge * bridge;
	NSLock* contextLock;
	NSString *type;
}

@property(nonatomic,readwrite,retain) NSString *type;

-(id)initWithCallback:(TiValueRef)function_ thisObject:(TiObjectRef)thisObject_ context:(KrollContext*)context_;
-(id)call:(NSArray*)args thisObject:(id)thisObject_;
-(TiObjectRef)function;
-(KrollContext*)context;
+(void)shutdownContext:(KrollContext*)context;

@end

// 
// KrollCallback has one fatal flaw: It can lead to retention loops. So when a
// function is to be a property of a proxy, we store this on the JS object. But
// if the proxy spans multiple contexts, we need to take a rain check on other
// contexts.

// In the mean time, for functions passed as a property between contexts, we
// need a lightweight wrapper. This is probably not the best way, but this
// should be sufficient for 1.7 in the edge case of one context needing to call
// another context's function.

// Until KrollObjectProperty and such are addressed in the future, this is an object that is never
// made explicitly by TiIdToValue; instead, all JS functions become KrollCallbacks, and both
// KrollCallbacks and KrollObjectProperties will be converted into functions (or TiObjectRefs at
// any rate)

@class KrollBridge;

@interface KrollFunction : NSObject
{
	TiObjectRef remoteFunction;
	KrollBridge * remoteBridge;
}

@property (nonatomic,readwrite,assign)	TiObjectRef remoteFunction;
@property (nonatomic,readwrite,assign)	KrollBridge * remoteBridge;

@end
