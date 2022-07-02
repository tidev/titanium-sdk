/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSPROGRESSBARSTYLE

#import "TiUIiOSProgressBarStyleProxy.h"
#import <TitaniumKit/TiBase.h>

@implementation TiUIiOSProgressBarStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.ProgressBarStyle";
}

MAKE_SYSTEM_PROP(PLAIN, UIProgressViewStyleDefault);
MAKE_SYSTEM_PROP(DEFAULT, UIProgressViewStyleDefault);
MAKE_SYSTEM_PROP(BAR, UIProgressViewStyleBar);

@end

#endif
