/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiComplexValue.h"
#import "TiBase.h"

@implementation TiComplexValue

@synthesize value, properties;

- (id)initWithValue:(id)value_ properties:(NSDictionary *)properties_
{
  if (self = [super init]) {
    value = [value_ retain];
    properties = [properties_ retain];
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(value);
  RELEASE_TO_NIL(properties);
  [super dealloc];
}

@end
