/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMPIProxy.h"
#import <TitaniumKit/TiBase.h>
// Corresponds to Interface ProcessingInstruction of DOM2 Spec.
@implementation TiDOMPIProxy

- (NSString *)apiName
{
  return @"Ti.XML.ProcessingInstruction";
}

- (NSString *)data
{
  return [node stringValue];
}

- (void)setData:(NSString *)data
{
  ENSURE_TYPE(data, NSString);
  [node setStringValue:data];
}

- (void)setNodeValue:(NSString *)data
{
  [self setData:data];
}

- (NSString *)target
{
  return [node name];
}

@end
#endif
