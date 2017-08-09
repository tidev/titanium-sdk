/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSTOOLBAR
#import "TiUIView.h"

@protocol TiToolbarLayoutDelegate
- (NSInteger)positionForBar:(id)bar;
@end

@interface TiUIToolbar : TiUIView <LayoutAutosizing, TiToolbarLayoutDelegate> {
  UIToolbar *toolBar;
  BOOL hideTopBorder;
  BOOL showBottomBorder;
  BOOL extendsBackground;
}

- (UIToolbar *)toolBar;

@end

#endif
