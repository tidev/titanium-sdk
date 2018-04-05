//
//  TiSharedConfig.m
//  TitaniumKit
//
//  Created by Hans Knöchel on 05.04.18.
//  Copyright © 2018 Hans Knoechel. All rights reserved.
//

#import "TiSharedConfig.h"

@implementation TiSharedConfig

+ (id)defaultConfig
{
  static TiSharedConfig *sharedConfig = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedConfig = [[self alloc] init];
  });
  return sharedConfig;
}

@end
