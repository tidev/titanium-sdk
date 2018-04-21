/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSTEPPER
#import <TitaniumKit/TiUIView.h>

@interface TiUIiOSStepper : TiUIView {
  @private
  UIStepper *stepper;
  UIImage *backgroundImageCache;
  bool touchStarted;
}
- (UIStepper *)stepper;
@end
#endif
