/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiFilesystemFileProxy+Addons.h"

@implementation TiFilesystemFileProxy (Addons)

#ifdef USE_TI_FILESYSTEMCREATEDAT
- (NSDate *)createdAt:(id)unused
{
  NSError *error = nil;
  NSDictionary *resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
  if (error != nil) {
    [self throwException:TiExceptionOSError subreason:[error localizedDescription] location:CODELOCATION];
  }

  return [resultDict objectForKey:NSFileCreationDate] ?: [resultDict objectForKey:NSFileModificationDate];
}
#endif

#ifdef USE_TI_FILESYSTEMMODIFIEDAT
- (NSDate *)modifiedAt:(id)unused
{
  NSError *error = nil;
  NSDictionary *resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
  if (error != nil) {
    [self throwException:TiExceptionOSError subreason:[error localizedDescription] location:CODELOCATION];
  }
  return [resultDict objectForKey:NSFileModificationDate];
}
#endif

#ifdef USE_TI_FILESYSTEMSPACEAVAILABLE
- (NSNumber *)spaceAvailable:(id)unused
{
  NSError *error = nil;
  NSDictionary *resultDict = [[NSFileManager defaultManager] attributesOfFileSystemForPath:path error:&error];
  if (error != nil) {
    NSLog(@"[ERROR] Could not receive available space: %@", error.localizedDescription);
    return @(0.0);
  }
  return [resultDict objectForKey:NSFileSystemFreeSize];
}
#endif

@end
