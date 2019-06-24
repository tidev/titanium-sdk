/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUtils+Addons.h"

static NSString *kAppUUIDString = @"com.appcelerator.uuid";

@implementation TiUtils (Addons)

+ (NSString *)appIdentifier
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *uid = [defaults stringForKey:kAppUUIDString];
  if (uid == nil) {
    uid = [TiUtils createUUID];
    [defaults setObject:uid forKey:kAppUUIDString];
    [defaults synchronize];
  }

  return uid;
}

@end
