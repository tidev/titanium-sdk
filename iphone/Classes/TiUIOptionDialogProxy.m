/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIOPTIONDIALOG

#import "TiUIOptionDialogProxy.h"
#import "TiToolbarButton.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiTab.h>
#import <TitaniumKit/TiToolbar.h>
#import <TitaniumKit/TiUtils.h>

@implementation TiUIOptionDialogProxy
@synthesize dialogView;

- (void)dealloc
{
  RELEASE_TO_NIL(dialogView);
  RELEASE_TO_NIL(tintColor);
  RELEASE_TO_NIL_AUTORELEASE(alertController);
  [super dealloc];
}

- (NSMutableDictionary *)langConversionTable
{
  return [NSMutableDictionary dictionaryWithObject:@"title" forKey:@"titleid"];
}

- (NSString *)apiName
{
  return @"Ti.UI.OptionDialog";
}

- (void)show:(id)args
{
  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);
  ENSURE_UI_THREAD_1_ARG(args);
  [self rememberSelf];

  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(suspended:) name:kTiSuspendNotification object:nil];

  showDialog = YES;
  NSMutableArray *options = [self valueForKey:@"options"];
  if (IS_NULL_OR_NIL(options)) {
    options = [[[NSMutableArray alloc] initWithCapacity:2] autorelease];
    [options addObject:NSLocalizedString(@"OK", @"Alert OK Button")];
  }

  forceOpaqueBackground = [TiUtils boolValue:[self valueForKey:@"opaquebackground"] def:NO];
  persistentFlag = [TiUtils boolValue:[self valueForKey:@"persistent"] def:YES];
  cancelButtonIndex = [TiUtils intValue:[self valueForKey:@"cancel"] def:-1];
  tintColor = [[TiUtils colorValue:[self valueForKey:@"tintColor"]] _color];
  destructiveButtonIndex = [TiUtils intValue:[self valueForKey:@"destructive"] def:-1];

  if (cancelButtonIndex >= [options count]) {
    cancelButtonIndex = -1;
  }

  if (destructiveButtonIndex >= [options count]) {
    destructiveButtonIndex = -1;
  }

  [self setDialogView:[args objectForKey:@"view"]];
  animated = [TiUtils boolValue:@"animated" properties:args def:YES];
  id obj = [args objectForKey:@"rect"];
  if (obj != nil) {
    dialogRect = [TiUtils rectValue:obj];
  } else {
    dialogRect = CGRectZero;
  }

  RELEASE_TO_NIL(alertController);
  [[[TiApp app] controller] incrementActiveAlertControllerCount];
  alertController = [[UIAlertController alertControllerWithTitle:[TiUtils stringValue:[self valueForKey:@"title"]]
                                                         message:[TiUtils stringValue:[self valueForKey:@"message"]]
                                                  preferredStyle:UIAlertControllerStyleActionSheet] retain];

  if (tintColor) {
    [[alertController view] setTintColor:tintColor];
  }

  int curIndex = 0;
  //Configure the Buttons
  for (id btn in options) {
    NSString *btnName = [TiUtils stringValue:btn];
    if (!IS_NULL_OR_NIL(btnName)) {
      UIAlertAction *theAction = [UIAlertAction actionWithTitle:btnName
                                                          style:((curIndex == cancelButtonIndex) ? UIAlertActionStyleCancel : ((curIndex == destructiveButtonIndex) ? UIAlertActionStyleDestructive : UIAlertActionStyleDefault))
                                                        handler:^(UIAlertAction *action) {
                                                          [self fireClickEventWithAction:action];
                                                        }];
      [alertController addAction:theAction];
    }
    curIndex++;
  }

  if ([TiUtils isIPad] && (cancelButtonIndex == -1)) {
    UIAlertAction *theAction = [UIAlertAction actionWithTitle:NSLocalizedString(@"Cancel", @"Cancel")
                                                        style:UIAlertActionStyleCancel
                                                      handler:^(UIAlertAction *action) {
                                                        [self fireClickEventWithAction:action];
                                                      }];
    [alertController addAction:theAction];
  }
  BOOL isPopover = NO;

  if ([TiUtils isIPad]) {
    UIViewController *topVC = [[[TiApp app] controller] topPresentedController];
    isPopover = ((topVC.modalPresentationStyle == UIModalPresentationPopover) && (![topVC isKindOfClass:[UIAlertController class]]));
    /**
         ** This block commented out since it seems to have no effect on the alert controller.
         ** If you read the modalPresentationStyle after setting the value, it still shows UIModalPresentationPopover
         ** However not configuring the UIPopoverPresentationController seems to do the trick.
         ** This hack in place to conserve current behavior. Should revisit when iOS7 is dropped so that
         ** option dialogs are always presented in UIModalPresentationPopover
         if (isPopover) {
         alertController.modalPresentationStyle = UIModalPresentationCurrentContext;
         alertController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
         }
         */
  }
  /*See Comment above. Remove if condition to see difference in behavior on iOS8*/
  if (!isPopover) {
    UIPopoverPresentationController *presentationController = alertController.popoverPresentationController;
    presentationController.permittedArrowDirections = UIPopoverArrowDirectionAny;
    presentationController.delegate = self;
  }

  [self retain];
  [[TiApp app] showModalController:alertController animated:animated];
}

- (void)hide:(id)args
{
  if (!showDialog) {
    return;
  }
  if (alertController == nil) {
    return;
  }

  TiThreadPerformOnMainThread(^{
    if (alertController != nil) {
      [alertController dismissViewControllerAnimated:animated
                                          completion:^{
                                            [self cleanup];
                                          }];
    }
  },
      NO);
}

- (void)suspended:(NSNotification *)note
{
  if (!persistentFlag) {
    [self hide:[NSArray arrayWithObject:[NSDictionary dictionaryWithObject:NUMBOOL(NO) forKey:@"animated"]]];
  }
}

#pragma mark UIPopoverPresentationControllerDelegate
- (void)prepareForPopoverPresentation:(UIPopoverPresentationController *)popoverPresentationController
{
  if (dialogView != nil) {
    if ([dialogView supportsNavBarPositioning] && [dialogView isUsingBarButtonItem]) {
      UIBarButtonItem *theItem = [dialogView barButtonItem];
      if (theItem != nil) {
        popoverPresentationController.barButtonItem = [dialogView barButtonItem];
        return;
      }
    }

    if ([dialogView conformsToProtocol:@protocol(TiToolbar)]) {
      UIToolbar *toolbar = [(id<TiToolbar>)dialogView toolbar];
      if (toolbar != nil) {
        popoverPresentationController.sourceView = toolbar;
        popoverPresentationController.sourceRect = [toolbar bounds];
        return;
      }
    }

    if ([dialogView conformsToProtocol:@protocol(TiTab)]) {
      id<TiTab> tab = (id<TiTab>)dialogView;
      UITabBar *tabbar = [[tab tabGroup] tabbar];
      if (tabbar != nil) {
        popoverPresentationController.sourceView = tabbar;
        popoverPresentationController.sourceRect = [tabbar bounds];
        return;
      }
    }

    UIView *view = [dialogView view];
    if (view != nil) {
      popoverPresentationController.sourceView = view;
      popoverPresentationController.sourceRect = (CGRectEqualToRect(CGRectZero, dialogRect) ? CGRectMake(view.bounds.size.width / 2, view.bounds.size.height / 2, 1, 1) : dialogRect);
      return;
    }
  }

  //Fell through.
  UIViewController *presentingController = [alertController presentingViewController];
  popoverPresentationController.permittedArrowDirections = 0;
  popoverPresentationController.sourceView = [presentingController view];
  popoverPresentationController.sourceRect = (CGRectEqualToRect(CGRectZero, dialogRect) ? CGRectMake(presentingController.view.bounds.size.width / 2, presentingController.view.bounds.size.height / 2, 1, 1) : dialogRect);
  ;
}

- (void)popoverPresentationController:(UIPopoverPresentationController *)popoverPresentationController willRepositionPopoverToRect:(inout CGRect *)rect inView:(inout UIView **)view
{
  //This will never be called when using bar button item
  BOOL canUseDialogRect = !CGRectEqualToRect(CGRectZero, dialogRect);
  UIView *theSourceView = *view;
  BOOL shouldUseViewBounds = ([theSourceView isKindOfClass:[UIToolbar class]] || [theSourceView isKindOfClass:[UITabBar class]]);

  if (shouldUseViewBounds) {
    rect->origin = CGPointMake(theSourceView.bounds.origin.x, theSourceView.bounds.origin.y);
    rect->size = CGSizeMake(theSourceView.bounds.size.width, theSourceView.bounds.size.height);
  } else if (!canUseDialogRect) {
    rect->origin = CGPointMake(theSourceView.bounds.size.width / 2, theSourceView.bounds.size.height / 2);
    rect->size = CGSizeMake(1, 1);
  }

  popoverPresentationController.sourceRect = *rect;
}

- (void)popoverPresentationControllerDidDismissPopover:(UIPopoverPresentationController *)popoverPresentationController
{
  [self cleanup];
}

#pragma mark Internal Use Only
- (void)fireClickEventWithAction:(UIAlertAction *)theAction
{
  if ([self _hasListeners:@"click"]) {
    NSArray *actions = [alertController actions];
    NSInteger indexOfAction = [actions indexOfObject:theAction];

    if ([TiUtils isIPad] && (cancelButtonIndex == -1) && (indexOfAction == ([actions count] - 1))) {
      indexOfAction = cancelButtonIndex;
    }

    NSMutableDictionary *event = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                                          NUMINTEGER(indexOfAction), @"index",
                                                      NUMINT(cancelButtonIndex), @"cancel",
                                                      NUMINT(destructiveButtonIndex), @"destructive",
                                                      nil];

    TiThreadPerformOnMainThread(^{
      [self fireEvent:@"click" withObject:event];
      [self cleanup];
    },
        YES);
  } else {
    [self cleanup];
  }
}

- (void)cleanup
{
  if (showDialog) {
    showDialog = NO;
    [[[TiApp app] controller] decrementActiveAlertControllerCount];
    RELEASE_TO_NIL_AUTORELEASE(alertController);
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [self forgetSelf];
    [self release];
  }
}

@end

#endif
