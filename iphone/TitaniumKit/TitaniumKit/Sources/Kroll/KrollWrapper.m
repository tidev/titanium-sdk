/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollWrapper.h"
#import "KrollBridge.h"
#import "KrollCallback.h"
#import "KrollObject.h"
#import "TiExceptionHandler.h"

@implementation KrollWrapper
@synthesize jsobject, bridge;

/*  NOTE:
 *  Until KrollWrapper takes a more expanded role as a general purpose wrapper,
 *  protectJsobject is to be used during commonJS inclusion ONLY.
 *  For example, KrollBridge ensures that this is only done in the JS thread,
 *  and unlike KrollObject, KrollWrapper does not have the infrastructure to
 *  handle being called outside the JS.
 *  Furthermore, KrollWrapper does not get notified of JSObject finalization,
 *  etc, etc. The specific cases where KrollWrapper is currently used do not
 *  make this an issue, but KrollWrapper needs hardening if it is to be a base
 *  class.
 */

- (void)dealloc
{
  if (protecting) {
    [self unprotectJsobject];
  }
  [super dealloc];
}

- (void)protectJsobject
{
  if (protecting || ![KrollBridge krollBridgeExists:bridge]) {
    return;
  }

  if (![[bridge krollContext] isKJSThread]) {
    DeveloperLog(@"[WARN] KrollWrapper trying to protect in the wrong thread.%@", CODELOCATION);
    return;
  }
  protecting = YES;
  JSValueProtect([[bridge krollContext] context], jsobject);
}

- (void)unprotectJsobject
{
  if (!protecting || ![KrollBridge krollBridgeExists:bridge]) {
    return;
  }

  if (![[bridge krollContext] isKJSThread]) {
    DeveloperLog(@"[WARN] KrollWrapper trying to unprotect in the wrong thread.%@", CODELOCATION);
    return;
  }
  protecting = NO;
  JSValueUnprotect([[bridge krollContext] context], jsobject);
}

- (void)replaceValue:(id)value forKey:(NSString *)key notification:(BOOL)notify
{ /*
   *  This is to be used ONLY from KrollBridge's require call, due to some
   *  JS files assigning exports to a function instead of a standard
   *  JS object.
   */
  KrollContext *context = [bridge krollContext];
  JSValueRef valueRef = [KrollObject toValue:context value:value];

  /*
   * Properties can only be added to objects
   */
  if (JSValueIsObject([context context], jsobject)) {
    JSStringRef keyRef = JSStringCreateWithCFString((CFStringRef)key);
    JSObjectSetProperty([context context], jsobject, keyRef, valueRef, kJSPropertyAttributeReadOnly, NULL);
    JSStringRelease(keyRef);
  }
}

- (JSValueRef)executeWithArguments:(NSArray<id> *)arguments
{
  if (![KrollBridge krollBridgeExists:[self bridge]]) {
    return NULL;
  }

  JSObjectRef value = [self jsobject];
  JSContextRef context = [self.bridge.krollContext context];

  JSValueRef callException = NULL;
  JSValueRef callArgs[arguments.count];

  for (NSUInteger i = 0; i < arguments.count; i++) {
    callArgs[i] = [KrollObject toValue:self.bridge.krollContext value:[arguments objectAtIndex:i]];
  }

  JSValueRef functionResult = JSObjectCallAsFunction(context, value, NULL, 1, callArgs, &callException);

  if (callException != NULL) {
    [TiExceptionHandler.defaultExceptionHandler reportScriptError:callException inKrollContext:context];
  }

  return functionResult;
}

@end
