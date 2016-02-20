/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESYSTEMBUTTONSTYLE

#import "TiUIiPhoneSystemButtonStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneSystemButtonStyleProxy

-(NSString*)apiName
{
    return @"Ti.UI.iPhone.SystemButtonStyle";
}


MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DONE,UIBarButtonItemStyleDone,@"UI.iPhone.SystemButtonStyle.DONE",@"6.0.0",@"UI.iOS.SystemButtonStyle.DONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BORDERED,UIBarButtonItemStyleBordered,@"UI.iPhone.SystemButtonStyle.BORDERED",@"6.0.0",@"UI.iOS.SystemButtonStyle.BORDERED");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(PLAIN,UIBarButtonItemStylePlain,@"UI.iPhone.SystemButtonStyle.PLAIN",@"6.0.0",@"UI.iOS.SystemButtonStyle.PLAIN");
MAKE_SYSTEM_PROP_DEPRECATED_REMOVED(BAR,2,@"UI.iPhone.SystemButtonStyle.BAR",@"3.4.2",@"3.6.0");

@end

#endif