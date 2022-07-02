/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSALERTDIALOGSTYLE

#import <TitaniumKit/TiProxy.h>

@interface TIUIiOSAlertDialogStyleProxy : TiProxy {
}

@property (nonatomic, readonly) NSNumber *DEFAULT;
@property (nonatomic, readonly) NSNumber *PLAIN_TEXT_INPUT;
@property (nonatomic, readonly) NSNumber *SECURE_TEXT_INPUT;
@property (nonatomic, readonly) NSNumber *LOGIN_AND_PASSWORD_INPUT;
@end

#endif
