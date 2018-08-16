/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

@interface TiUIApplication : UIApplication

#ifdef USE_TI_APPTRACKUSERINTERACTION
- (void)sendEvent:(UIEvent *)event;
#endif

@end
