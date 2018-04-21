/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSMENUPOPUP
#import "TiUIiOSMenuPopup.h"
#import <TitaniumKit/TiApp.h>

@interface TiUIiOSMenuPopup ()
@property (nonatomic, readonly) TiUIiOSMenuPopupProxy *menuPopupProxy;
@end

@implementation TiUIiOSMenuPopup

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  NSString *sel = NSStringFromSelector(action);
  NSRange match = [sel rangeOfString:@"menuItem-"];
  if (match.location == 0) {
    return YES;
  }
  return NO;
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)sel
{
  if ([super methodSignatureForSelector:sel]) {
    return [super methodSignatureForSelector:sel];
  }
  return [super methodSignatureForSelector:@selector(fireEventWithIndex:)];
}

- (void)forwardInvocation:(NSInvocation *)invocation
{
  NSString *sel = NSStringFromSelector([invocation selector]);
  NSRange match = [sel rangeOfString:@"menuItem-"];
  if (match.location == 0) {
    id index = [sel substringFromIndex:9];
    [self fireEventWithIndex:[TiUtils intValue:index]];
  } else {
    [super forwardInvocation:invocation];
  }
}

- (TiUIiOSMenuPopupProxy *)menuPopupProxy
{
  return (TiUIiOSMenuPopupProxy *)self.proxy;
}

- (void)show:(id)args
{
  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);
  ENSURE_TYPE([args objectForKey:@"view"], TiViewProxy);

  TiViewProxy *sourceView = [args objectForKey:@"view"];
  UIMenuControllerArrowDirection arrowDirection = [TiUtils intValue:@"arrowDirection" properties:args def:UIMenuControllerArrowDefault];
  BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];

  if (sourceView == nil) {
    NSLog(@"[ERROR] The Ti.UI.iOS.MenuPopup.show method must contain the 'view' property.");
    return;
  }

  [self becomeFirstResponder];

  [[[[[TiApp app] controller] topPresentedController] view] addSubview:self];

  UIMenuController *controller = [UIMenuController sharedMenuController];
  UIView *view = [sourceView view];

  [controller setArrowDirection:arrowDirection];
  [controller setMenuItems:[self.menuPopupProxy menuItems]];
  [controller setTargetRect:view.bounds inView:view];
  [controller setMenuVisible:YES animated:animated];
}

- (void)hide:(id)args
{
  id params = [args objectAtIndex:0];
  ENSURE_TYPE_OR_NIL(params, NSDictionary);
  BOOL animated = YES;

  if (params != nil) {
    animated = [TiUtils boolValue:@"animated" properties:params def:YES];
  }

  [[UIMenuController sharedMenuController] setMenuVisible:NO animated:animated];
}

- (void)fireEventWithIndex:(int)index
{
  if ([self.menuPopupProxy _hasListeners:@"click"]) {

    [self.menuPopupProxy fireEvent:@"click"
                        withObject:@{
                          @"index" : NUMINT(index),
                          @"title" : [[[self.menuPopupProxy menuItems] objectAtIndex:index] title]
                        }];
  }
}

@end
#endif
