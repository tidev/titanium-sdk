/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_FILESYSTEM

#import "TiFile.h"

@interface TiFilesystemBlobProxy : TiFile {
  @private
  NSURL *_url;
  NSData *_data;
}

- (id)initWithURL:(NSURL *)url data:(NSData *)data;

@end

#endif
