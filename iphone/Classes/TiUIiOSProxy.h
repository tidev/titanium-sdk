/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_UIIOS

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0

#ifdef USE_TI_UIIOSADVIEW
	#import "TiUIiOSAdViewProxy.h"
#endif

#endif

@interface TiUIiOSProxy : TiProxy {
@private

}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
#ifdef USE_TI_UIIOSADVIEW
-(id)createAdView:(id)args;
#endif
#endif

@end

#endif