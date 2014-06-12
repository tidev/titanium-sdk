/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_APPIOS

#import "TiAppiOSBackgroundServiceProxy.h"

@interface TiAppiOSProxy : TiProxy {
@private
	NSMutableDictionary *backgroundServices;
}
@property (nonatomic, readonly) NSString *EVENT_ACCESSIBILITY_LAYOUT_CHANGED;
@property (nonatomic, readonly) NSString *EVENT_ACCESSIBILITY_SCREEN_CHANGED;

@end

#endif
