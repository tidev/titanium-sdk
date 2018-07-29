/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollContext.h"
#import "KrollObject.h"

extern JSClassRef KrollMethodClassRef;

typedef enum KrollMethodType {
  KrollMethodSetter = 0x01,
  KrollMethodGetter = 0x02,
  KrollMethodInvoke = 0x04,
  KrollMethodFactory = 0x08,
  KrollMethodPropertySetter = 0x10,
  KrollMethodPropertyGetter = 0x20,
  KrollMethodDynamicProxy = 0x40,

  //	KrollMethodProxyRetainer	=0x80
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
  NSString *propertyKey;
  BOOL updatesProperty;
}

- (id)initWithTarget:(id)target_ selector:(SEL)selector_ argcount:(int)argcount_ type:(KrollMethodType)type_ name:(id)name_ context:(KrollContext *)context_;
- (id)call:(NSArray *)args;
@property (nonatomic, assign) SEL selector;
@property (nonatomic, assign) int argcount;
@property (nonatomic, assign) KrollMethodType type;
@property (nonatomic, retain) id name;

@property (nonatomic, assign) BOOL updatesProperty;
@property (nonatomic, copy) NSString *propertyKey;

@end
