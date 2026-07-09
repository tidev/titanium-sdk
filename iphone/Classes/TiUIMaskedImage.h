/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIMASKEDIMAGE

#import <QuartzCore/QuartzCore.h>
#import <TitaniumKit/TiUIView.h>

@interface TiUIMaskedImage : TiUIView {
  @private
  NSURL *imageURL;
  NSURL *maskURL;
  UIColor *tint;
  CGBlendMode mode;
}

@end

#endif
