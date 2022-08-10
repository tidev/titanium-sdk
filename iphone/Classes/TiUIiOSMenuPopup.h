/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSMENUPOPUP
#import "TiUIiOSMenuPopupProxy.h"
#import <TitaniumKit/TiUIView.h>
#import <UIKit/UIKit.h>

@interface TiUIiOSMenuPopup : TiUIView

/**
 Shows the menu popup.
 */
- (void)show:(id)args;

/**
 Hides the menu popup.
 */
- (void)hide:(id)args;

@end
#endif
