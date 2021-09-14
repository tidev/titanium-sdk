/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSYSTEMBUTTONSTYLE

#import "TiUIiOSSystemButtonStyleProxy.h"
#import <TitaniumKit/TiBase.h>

@implementation TiUIiOSSystemButtonStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.SystemButtonStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DONE, UIBarButtonItemStyleDone, @"Ti.UI.iOS.SystemButtonStyle.DONE", @"10.0.0", @"Ti.UI.BUTTON_STYLE_OPTION_POSITIVE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BORDERED, UIBarButtonItemStylePlain, @"Ti.UI.iOS.SystemButtonStyle.BORDERED", @"10.0.0", @"Ti.UI.BUTTON_STYLE_OPTION_NEUTRAL");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(PLAIN, UIBarButtonItemStylePlain, @"Ti.UI.iOS.SystemButtonStyle.PLAIN", @"10.0.0", @"Ti.UI.BUTTON_STYLE_OPTION_NEUTRAL");

@end

#endif
