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

MAKE_SYSTEM_PROP(DONE, UIBarButtonItemStyleDone);
MAKE_SYSTEM_PROP(BORDERED, UIBarButtonItemStylePlain);
MAKE_SYSTEM_PROP(PLAIN, UIBarButtonItemStylePlain);

@end

#endif
