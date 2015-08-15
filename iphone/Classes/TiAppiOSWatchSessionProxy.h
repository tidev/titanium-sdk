/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import <WatchConnectivity/watchConnectivity.h>
#ifdef USE_TI_APPIOS

@interface TiAppiOSWatchSessionProxy : TiProxy<WCSessionDelegate> {
@private
    BOOL _supported;
    WCSession *watchSession;
}
-(id)init;

@end

#endif