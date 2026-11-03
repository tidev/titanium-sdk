/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UICANVAS

#import <TitaniumKit/TiUIView.h>

@class TiUICanvasViewContextProxy;

@interface TiUICanvasView : TiUIView {
  @private
  NSMutableArray *operations;
}

- (void)begin;
- (void)commit;

@end

#endif
