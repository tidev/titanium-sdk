/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_APPIOS

@interface TiAppiOSUserActivityProxy : TiProxy<NSUserActivityDelegate> {
    @private
    BOOL _isValid;
    BOOL _supported;
}

@property(nonatomic,retain) NSUserActivity *userActivity;

@end

#endif