/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEALERTDIALOGSTYLE

#import "TiProxy.h"

@interface TiUIiPhoneAlertDialogStyleProxy : TiProxy {

}

@property(nonatomic, readonly) NSNumber *DEFAULT;
@property(nonatomic, readonly) NSNumber *PLAIN_TEXT_INPUT;
@property(nonatomic, readonly) NSNumber *SECURE_TEXT_INPUT;
@property(nonatomic, readonly) NSNumber *LOGIN_AND_PASSWORD_INPUT;

@end

#endif