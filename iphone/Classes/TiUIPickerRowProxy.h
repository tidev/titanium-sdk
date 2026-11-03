/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPICKER

#import <TitaniumKit/TiViewProxy.h>

@interface TiUIPickerRowProxy : TiViewProxy {
  @private
  UIImage *snapshot;
}

- (UIView *)viewWithFrame:(CGRect)theFrame reusingView:(UIView *)theView;

@end

#endif
