/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_UIIOSTOOLBAR) || defined(USE_TI_UITOOLBAR)
#import <TitaniumKit/TiUIView.h>

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
