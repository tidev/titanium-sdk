/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TiCore.h"
#import "KrollContext.h"

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
}

-(id)initWithCallback:(TiValueRef)function_ thisObject:(TiObjectRef)thisObject_ context:(KrollContext*)context_;
-(void)call:(NSArray*)args thisObject:(id)thisObject_;
-(TiObjectRef)function;
-(KrollContext*)context;
+(void)shutdownContext:(KrollContext*)context;

@end
