/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import <CoreSpotlight/CoreSpotlight.h>

@interface TiAppiOSSearchQueryProxy : TiProxy {
    CSSearchQuery *query;
}

- (CSSearchQuery*)query;

- (void)start:(id)unused;

- (void)cancel:(id)unused;

@end
