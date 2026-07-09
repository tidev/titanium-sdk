/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UICANVAS

#import "TiUICanvasViewProxy.h"
#import "TiUICanvasView.h"

@implementation TiUICanvasViewProxy

- (void)begin:(id)args
{
  TiUICanvasView *canvas = (TiUICanvasView *)[self view];
  [canvas begin];
}

- (void)commit:(id)args
{
  TiUICanvasView *canvas = (TiUICanvasView *)[self view];
  [canvas commit];
}

@end

#endif
