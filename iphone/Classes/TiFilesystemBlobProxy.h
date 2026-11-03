/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_FILESYSTEM

#import <TitaniumKit/TiFile.h>

@interface TiFilesystemBlobProxy : TiFile {
  @private
  NSURL *url;
  NSData *data;
}

- (id)initWithURL:(NSURL *)url data:(NSData *)data;

@end

#endif
