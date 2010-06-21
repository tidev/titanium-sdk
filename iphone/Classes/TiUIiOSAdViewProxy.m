/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiUIiOSAdViewProxy.h"
#import "TiUtils.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0

#ifdef USE_TI_UIIOSADVIEW

@implementation TiUIiOSAdViewProxy

MAKE_SYSTEM_STR(SIZE_320x50,ADBannerContentSizeIdentifier320x50);
MAKE_SYSTEM_STR(SIZE_480x32,ADBannerContentSizeIdentifier480x32);

-(void)cancelAction:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(cancelAction:) withObject:args waitUntilDone:NO];
}

@end

#endif

#endif