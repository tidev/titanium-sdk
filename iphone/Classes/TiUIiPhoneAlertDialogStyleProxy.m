/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEALERTDIALOGSTYLE

#import "TiUIiPhoneAlertDialogStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneAlertDialogStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.AlertDialogStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DEFAULT, UIAlertViewStyleDefault, @"UI.iPhone.AlertDialogStyle.DEFAULT", @"5.4.0", @"UI.iOS.AlertDialogStyle.DEFAULT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(PLAIN_TEXT_INPUT, UIAlertViewStylePlainTextInput, @"UI.iPhone.AlertDialogStyle.PLAIN_TEXT_INPUT", @"5.4.0", @"UI.iOS.AlertDialogStyle.PLAIN_TEXT_INPUT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(SECURE_TEXT_INPUT, UIAlertViewStyleSecureTextInput, @"UI.iPhone.AlertDialogStyle.SECURE_TEXT_INPUT", @"5.4.0", @"UI.iOS.AlertDialogStyle.SECURE_TEXT_INPUT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(LOGIN_AND_PASSWORD_INPUT, UIAlertViewStyleLoginAndPasswordInput, @"UI.iPhone.AlertDialogStyle.LOGIN_AND_PASSWORD_INPUT", @"5.4.0", @"UI.iOS.AlertDialogStyle.LOGIN_AND_PASSWORD_INPUT");

@end

#endif