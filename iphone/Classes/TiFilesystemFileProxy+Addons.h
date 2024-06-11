/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <TitaniumKit/TiBase.h>
#import <TitaniumKit/TiFilesystemFileProxy.h>

@interface TiFilesystemFileProxy (Addons)

#ifdef USE_TI_FILESYSTEMCREATEDAT
- (NSDate *)createdAt:(id)unused;
#endif

#ifdef USE_TI_FILESYSTEMMODIFIEDAT
- (NSDate *)modifiedAt:(id)unused;
#endif

#ifdef USE_TI_FILESYSTEMSPACEAVAILABLE
- (NSNumber *)spaceAvailable:(id)unused;
#endif

@end
