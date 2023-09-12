/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMNotationProxy.h"

@implementation TiDOMNotationProxy

- (NSString *)apiName
{
  return @"Ti.XML.Notation";
}

- (id)nodeValue
{
  // DOM spec says nodeValue must return null
  return [NSNull null];
}

- (id)publicId
{
  //TODO
  return [NSNull null];
}
- (id)systemId
{
  //TODO
  return [NSNull null];
}
@end
#endif
