/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiSharedConfig.h"

@implementation TiSharedConfig

+ (TiSharedConfig *)defaultConfig
{
  static TiSharedConfig *sharedConfig = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedConfig = [[self alloc] init];
  });
  return sharedConfig;
}

@end
