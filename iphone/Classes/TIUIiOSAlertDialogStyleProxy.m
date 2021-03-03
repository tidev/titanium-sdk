/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSALERTDIALOGSTYLE

#import "TIUIiOSAlertDialogStyleProxy.h"
#import <TitaniumKit/TiBase.h>

@implementation TIUIiOSAlertDialogStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.AlertDialogStyle";
}

MAKE_SYSTEM_PROP(DEFAULT, UIAlertViewStyleDefault);
MAKE_SYSTEM_PROP(PLAIN_TEXT_INPUT, UIAlertViewStylePlainTextInput);
MAKE_SYSTEM_PROP(SECURE_TEXT_INPUT, UIAlertViewStyleSecureTextInput);
MAKE_SYSTEM_PROP(LOGIN_AND_PASSWORD_INPUT, UIAlertViewStyleLoginAndPasswordInput);
@end

#endif
