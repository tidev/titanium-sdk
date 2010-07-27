/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollContext.h"
#import "KrollObject.h"

extern TiClassRef KrollMethodClassRef;

typedef enum KrollMethodType {
	KrollMethodSetter,
	KrollMethodGetter,
	KrollMethodInvoke,
	KrollMethodFactory,
	KrollMethodPropertySetter,
	KrollMethodPropertyGetter,
	KrollMethodDynamicProxy
} KrollMethodType;

//
// KrollMethod is a specialization of a KrollObject which represents a 
// function in JS land which can be invoked on the native side as an method
// invocation.
//
@interface KrollMethod : KrollObject {
@private
	SEL selector;
	int argcount;
	KrollMethodType type;
	id name;
}

-(id)initWithTarget:(id)target_ selector:(SEL)selector_ argcount:(int)argcount_ type:(KrollMethodType)type_ name:(id)name_ context:(KrollContext*)context_;
-(id)call:(NSArray*)args;

@end
