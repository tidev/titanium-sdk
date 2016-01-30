/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"
#import <WatchConnectivity/watchConnectivity.h>

@interface WatchSessionModule : TiModule<WCSessionDelegate> {
@private
    WCSession *watchSession;
}

@end