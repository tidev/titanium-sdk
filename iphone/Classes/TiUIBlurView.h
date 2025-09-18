/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBLURVIEW
#import <TitaniumKit/TiUIView.h>

@interface TiUIBlurView : TiUIView {
  UIVisualEffectView *blurView;

  TiDimension width;
  TiDimension height;
  CGFloat autoHeight;
  CGFloat autoWidth;
}

@end
#endif
