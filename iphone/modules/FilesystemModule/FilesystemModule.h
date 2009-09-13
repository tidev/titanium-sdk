/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_FILESYSTEM

#import <Foundation/Foundation.h>
#import "TitaniumModule.h"

@interface FilesystemModule : NSObject<TitaniumModule> {
	NSOperationQueue * fileCopyQueue;
}

@end

#endif