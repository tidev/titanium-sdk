/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSMENUPOPUP
#import "TiUIiOSMenuPopupProxy.h"
#import "TiUIiOSMenuPopup.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiUtils.h>

@interface TiUIiOSMenuPopupProxy ()
@property (nonatomic, assign) TiUIiOSMenuPopup *menuPopup;
@end

@implementation TiUIiOSMenuPopupProxy

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self registerNotificationCenter];
  [super _initWithProperties:properties];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  RELEASE_TO_NIL(_menuItems);
  [super dealloc];
}

- (TiUIiOSMenuPopup *)menuPopup
{
  return (TiUIiOSMenuPopup *)self.view;
}

#pragma mark Public APIs

- (void)show:(id)args
{
  ENSURE_UI_THREAD(show, args);
  [[self menuPopup] show:args];
}

- (void)hide:(id)args
{
  ENSURE_UI_THREAD(hide, args);
  [[self menuPopup] hide:args];
}

- (void)setItems:(id)args
{
  ENSURE_UI_THREAD(setItems, args);
  ENSURE_TYPE_OR_NIL(args, NSArray);

  [self replaceValue:args forKey:@"items" notification:NO];
  [self setMenuItems:[NSMutableArray array]];

  if (args != nil) {
    for (NSString *item in args) {
      NSString *identifier = [NSString stringWithFormat:@"menuItem-%lu", (unsigned long)[args indexOfObject:item]];

      UIMenuItem *menuItem = [[[UIMenuItem alloc] initWithTitle:[TiUtils stringValue:item] action:NSSelectorFromString(identifier)] autorelease];
      [[self menuItems] addObject:menuItem];
    }
  }
}

- (NSNumber *)isVisible:(id)unused
{
  return NUMBOOL([[UIMenuController sharedMenuController] isMenuVisible]);
}

#pragma mark Notifications

- (void)menuPopupWillShow:(NSNotification *)notification
{
  [self rememberSelf];
}

- (void)menuPopupWillHide:(NSNotification *)notification
{
  [self forgetSelf];
  [[self menuPopup] removeFromSuperview];
}

- (void)registerNotificationCenter
{
  // Will show
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(menuPopupWillShow:) name:UIMenuControllerWillShowMenuNotification object:nil];

  // Did show - Not used, yet
  // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(menuPopupDidShow:) name:UIMenuControllerDidShowMenuNotification object:nil];

  // Will hide
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(menuPopupWillHide:) name:UIMenuControllerWillHideMenuNotification object:nil];

  // Did hide - Not used, yet
  // [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(menuPopupDidHide:) name:UIMenuControllerDidHideMenuNotification object:nil];
}

@end
#endif
