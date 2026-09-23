/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcModule.h"

@implementation ObjcModule

// TODO: Actually implement once we support native modules via Obj-C API!
- (void)_setName:(NSString *)moduleClassName
{
  // no-op
}

- (void)setExecutionContext:(id<TiEvaluator>)context
{
  // no-op
}

- (void)setHost:(TiHost *)host
{
  // no-op
}

- (BOOL)isJSModule
{
  return NO;
}

- (NSData *)moduleJS
{
  return nil;
}

- (BOOL)destroyed
{
  return NO;
}

- (void)release
{
  // no-op
}

- (NSData *)loadModuleAsset:(NSString *)fromPath
{
  return nil;
}

@end
