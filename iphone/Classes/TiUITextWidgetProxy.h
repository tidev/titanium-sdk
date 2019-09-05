/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITEXTWIDGET) || defined(USE_TI_UITEXTAREA) || defined(USE_TI_UITEXTFIELD)

#import <TitaniumKit/TiViewProxy.h>

@interface TiUITextWidgetProxy : TiViewProxy <TiKeyboardFocusableView> {

  //We can't have this in the view, because it's possible for the view to go away despite there being a reason to hold onto the toolbar
  //Read: When a view in the toolbar has focus instead.

  //Toolbar properties that are semi-exposed
  TiUIView *keyboardTiView;
  CGFloat keyboardAccessoryHeight;
  NSArray *keyboardToolbarItems;

  //Toolbar properties derived from the exposed ones.
  UIToolbar *keyboardUIToolbar;

  BOOL suppressFocusEvents;
  @private
}

//Internal values
- (void)noteValueChange:(NSString *)newValue;

@property (nonatomic, readwrite, assign) BOOL suppressFocusEvents;

@end

#endif
