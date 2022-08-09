/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiStreamProxy.h"

@interface TiFilesystemFileStreamProxy : TiStreamProxy <TiStreamInternal> {

  @private
  NSFileHandle *fileHandle;
  TiStreamMode mode;
}

@end
