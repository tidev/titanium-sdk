/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiUIViewProxy.h"

#ifdef USE_TI_UIIOSADVIEW


@interface TiUIiOSAdViewProxy : TiUIViewProxy {

}

// Need these for sanity checking and constants, so they
// must be class-available rather than instance-available
+(NSString*)portraitSize;
+(NSString*)landscapeSize;
#pragma mark internal
-(void)fireLoad:(id)unused;
@end

#endif
