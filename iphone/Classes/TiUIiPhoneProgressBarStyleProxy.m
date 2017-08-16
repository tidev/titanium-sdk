/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEPROGRESSBARSTYLE

#import "TiUIiPhoneProgressBarStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneProgressBarStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.ProgressBarStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(PLAIN, UIProgressViewStyleDefault, @"UI.iPhone.ProgressBarStyle.PLAIN", @"5.4.0", @"UI.iOS.ProgressBarStyle.PLAIN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DEFAULT, UIProgressViewStyleDefault, @"UI.iPhone.ProgressBarStyle.DEFAULT", @"5.4.0", @"UI.iOS.ProgressBarStyle.DEFAULT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BAR, UIProgressViewStyleBar, @"UI.iPhone.ProgressBarStyle.BAR", @"5.4.0", @"UI.iOS.ProgressBarStyle.BAR");

@end

#endif