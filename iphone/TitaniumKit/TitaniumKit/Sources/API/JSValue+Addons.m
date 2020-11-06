/**
* Appcelerator Titanium Mobile
* Copyright (c) 2018-Present by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/

#import "JSValue+Addons.h"

@implementation JSValue (Addons)

- (BOOL)isFunction
{
  if (!self.isObject) {
    return NO;
  }

  JSContextRef context = self.context.JSGlobalContextRef;
  JSObjectRef object = JSValueToObject(context, self.JSValueRef, NULL);
  if (object == NULL) {
    return NO;
  }
  return JSObjectIsFunction(context, object);
}

@end
