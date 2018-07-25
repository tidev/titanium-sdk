/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollContext.h"
#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

//
// KrollTimer is a timer implementation in native that is used by JS land
//
@interface KrollTimer : NSObject {
  @private
  JSContextRef context;
  JSObjectRef function;
  JSObjectRef jsThis;
  double duration;
  BOOL onetime;
  BOOL stopped;
  NSCondition *condition;
  KrollContext *kroll;
  double timerId;
}

- (id)initWithContext:(JSContextRef)context function:(JSValueRef)function_ jsThis:(JSObjectRef)jsThis duration:(double)duration_ onetime:(BOOL)onetime_ kroll:(KrollContext *)kroll_ timerId:(double)timerId;
- (void)start;
- (void)cancel;

@end
