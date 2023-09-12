/**
* Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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

- (void)defineReadOnlyProperty:(NSString *)propertyName withValue:(id)value
{
  [self defineProperty:propertyName
            descriptor:@{
              JSPropertyDescriptorEnumerableKey : @NO,
              JSPropertyDescriptorWritableKey : @NO,
              JSPropertyDescriptorConfigurableKey : @NO,
              JSPropertyDescriptorValueKey : value
            }];
}

@end
