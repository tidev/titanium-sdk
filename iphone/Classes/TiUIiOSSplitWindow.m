/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW
#import "TiUIiOSSplitWindow.h"
#import "TiUIiOSSplitWindowProxy.h"
#import <TitaniumKit/TiApp.h>

// Implemented in Swift (TiArrangementShim.swift) and looked up by name at runtime, because the class
// only exists if the app is built with the iOS 27.1 SDK or later.
@protocol TiArrangementShim <NSObject>
+ (BOOL)applyStyle:(NSInteger)style toController:(UIViewController *)controller animated:(BOOL)animated;
@end

// Arrangement styles, matching the SPLIT_WINDOW_ARRANGEMENT_STYLE_* constants of Ti.UI.iOS
typedef NS_ENUM(NSInteger, TiUIiOSSplitWindowArrangementStyle) {
  TiUIiOSSplitWindowArrangementStyleDefault = 0,
  TiUIiOSSplitWindowArrangementStyleSplit = 1,
  TiUIiOSSplitWindowArrangementStyleOverlay = 2
};

/**
 Hosts one pane (master or detail) of the split window as a view controller, so that it can be placed by an
 UIArrangementViewController. The view of the controller is a container that fills the wrapper view of the pane.
 The wrapper is not used as the view of the controller directly, because it is already part of the view hierarchy
 of the split window and UIKit would reject it as a child of the arrangement.
 */
@interface TiUIiOSSplitWindowPaneController : UIViewController {
  UIView *paneView;
  void (^layoutHandler)(void);
}
- (instancetype)initWithPaneView:(UIView *)view layoutHandler:(void (^)(void))handler;
@end

@implementation TiUIiOSSplitWindowPaneController

- (instancetype)initWithPaneView:(UIView *)view layoutHandler:(void (^)(void))handler
{
  if (self = [super init]) {
    paneView = [view retain];
    layoutHandler = [handler copy];
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(paneView);
  RELEASE_TO_NIL(layoutHandler);
  [super dealloc];
}

- (void)loadView
{
  UIView *container = [[UIView alloc] initWithFrame:CGRectZero];
  container.clipsToBounds = YES;
  [paneView removeFromSuperview];
  paneView.transform = CGAffineTransformIdentity;
  paneView.frame = container.bounds;
  paneView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [container addSubview:paneView];
  self.view = container;
  [container release];
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  if (!CGRectEqualToRect(paneView.frame, self.view.bounds)) {
    paneView.frame = self.view.bounds;
  }
  if (layoutHandler != nil) {
    layoutHandler();
  }
}

@end

@implementation TiUIiOSSplitWindow

- (void)dealloc
{
  [self removeArrangementController];
  RELEASE_TO_NIL(masterViewWrapper);
  RELEASE_TO_NIL(detailViewWrapper);
  RELEASE_TO_NIL(masterProxy);
  RELEASE_TO_NIL(detailProxy);
  [super dealloc];
}

- (void)initProxy:(TiViewProxy *)theProxy withWrapper:(UIView *)wrapper
{
  [theProxy setSandboxBounds:[wrapper bounds]];
  if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(TiWindowProxy *)theProxy setIsManaged:YES];
    [(TiWindowProxy *)theProxy open:nil];
  } else {
    [theProxy windowWillOpen];
    [theProxy windowDidOpen];
  }
  [wrapper addSubview:[theProxy view]];
}

- (void)setMasterViewVisible_:(NSNumber *)value
{
  BOOL visible = [TiUtils boolValue:value def:YES];

  masterViewVisible = visible;
  masterViewWrapper.hidden = !visible;
}

- (void)cleanup
{
  [self removeArrangementController];

  if (masterProxy != nil) {
    if ([masterProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      [(TiWindowProxy *)masterProxy close:nil];
    } else {
      [masterProxy windowWillClose];
      [masterProxy windowDidClose];
    }
  }
  if (detailProxy != nil) {
    if ([detailProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      [(TiWindowProxy *)detailProxy close:nil];
    } else {
      [detailProxy windowWillClose];
      [detailProxy windowDidClose];
    }
  }
}

- (void)initWrappers
{
  if (!viewsInitialized) {
    masterViewWrapper = [[UIView alloc] initWithFrame:[self bounds]];
    detailViewWrapper = [[UIView alloc] initWithFrame:[self bounds]];
    [self addSubview:detailViewWrapper];
    [self addSubview:masterViewWrapper];
    [self setClipsToBounds:YES];
    if (masterProxy != nil) {
      [self initProxy:masterProxy withWrapper:masterViewWrapper];
    }
    if (detailProxy != nil) {
      [self initProxy:detailProxy withWrapper:detailViewWrapper];
    }

    CGSize screenSize = [[UIScreen mainScreen] bounds].size;
    if (UIInterfaceOrientationIsLandscape([TiUtils interfaceOrientationForScene:[self.proxy owningInstance].window.windowScene])) {
      screenSize = CGSizeMake(screenSize.height, screenSize.width);
    }

    CGFloat masterWidth = screenSize.height - screenSize.width;
    if (splitRatioPortrait == 0) {
      splitRatioPortrait = masterWidth / screenSize.width;
      if (splitRatioPortrait < 0.25) {
        splitRatioPortrait = 0.25;
      } else if (splitRatioPortrait > 0.5) {
        splitRatioPortrait = 0.5;
      }
      [self.proxy replaceValue:NUMFLOAT(splitRatioPortrait) forKey:@"portraitSplit" notification:NO];
    }

    if (splitRatioLandscape == 0) {
      splitRatioLandscape = masterWidth / screenSize.height;

      if (splitRatioLandscape < 0.25) {
        splitRatioLandscape = 0.25;
      } else if (splitRatioLandscape > 0.5) {
        splitRatioLandscape = 0.5;
      }
      [self.proxy replaceValue:NUMFLOAT(splitRatioLandscape) forKey:@"landscapeSplit" notification:NO];
    }
    viewsInitialized = YES;
    masterViewWrapper.hidden = !masterViewVisible;

    [self applyArrangementStyle:NO];
  }
}

#pragma mark - Arrangement (iPhone Duo, iOS 27.1+)

- (BOOL)usesArrangementController
{
  return arrangementController != nil;
}

- (void)setArrangementStyle_:(id)value
{
  NSInteger style = [TiUtils intValue:value def:TiUIiOSSplitWindowArrangementStyleDefault];
  if (style < TiUIiOSSplitWindowArrangementStyleDefault || style > TiUIiOSSplitWindowArrangementStyleOverlay) {
    style = TiUIiOSSplitWindowArrangementStyleDefault;
  }
  if (style == arrangementStyle) {
    return;
  }
  arrangementStyle = style;

  if (viewsInitialized) {
    [self applyArrangementStyle:YES];
  }
}

- (void)applyArrangementStyle:(BOOL)animated
{
  if (arrangementStyle == TiUIiOSSplitWindowArrangementStyleDefault) {
    if (arrangementController != nil) {
      [self removeArrangementController];
      [self restoreWrappers];
    }
    return;
  }

#if IS_SDK_IOS_27_1
  if (@available(iOS 27.1, *)) {
    Class<TiArrangementShim> shim = NSClassFromString(@"TiArrangementShim");
    if (shim != nil) {
      if (arrangementController == nil) {
        [self installArrangementController];
      }
      if ([shim applyStyle:arrangementStyle toController:arrangementController animated:animated]) {
        return;
      }
    }
  }
#endif

  NSLog(@"[WARN] SplitWindow.arrangementStyle requires iOS 27.1 and an app built with the iOS 27.1 SDK or later. Using the default layout instead.");
  [self removeArrangementController];
  [self restoreWrappers];
}

- (void)installArrangementController
{
#if IS_SDK_IOS_27_1
  if (@available(iOS 27.1, *)) {
    UIViewController *parent = [(TiWindowProxy *)self.proxy windowHoldingController];
    if (parent == nil) {
      return;
    }

    __block TiUIiOSSplitWindow *blockSelf = self;
    masterPaneController = [[TiUIiOSSplitWindowPaneController alloc] initWithPaneView:masterViewWrapper
                                                                        layoutHandler:^{
                                                                          [blockSelf paneDidLayout:blockSelf->masterProxy];
                                                                        }];
    detailPaneController = [[TiUIiOSSplitWindowPaneController alloc] initWithPaneView:detailViewWrapper
                                                                        layoutHandler:^{
                                                                          [blockSelf paneDidLayout:blockSelf->detailProxy];
                                                                        }];

    UIArrangementViewController *controller = [[UIArrangementViewController alloc] init];
    arrangementController = controller;

    // Put the arrangement into the view hierarchy first, so it is a proper child of the controller
    // that owns the split window before it takes over the panes.
    [parent addChildViewController:controller];
    controller.view.frame = self.bounds;
    controller.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:controller.view];
    [controller didMoveToParentViewController:parent];

    // The wrappers end up in the containers of the pane controllers and are positioned by the arrangement
    [controller setViewController:masterPaneController forPlacement:UIArrangementViewControllerViewPlacementPrimary animated:NO];
    [controller setViewController:detailPaneController forPlacement:UIArrangementViewControllerViewPlacementSecondary animated:NO];
  }
#endif
}

- (void)removeArrangementController
{
#if IS_SDK_IOS_27_1
  if (@available(iOS 27.1, *)) {
    if (arrangementController != nil) {
      UIArrangementViewController *controller = (UIArrangementViewController *)arrangementController;
      [controller willMoveToParentViewController:nil];
      [controller.view removeFromSuperview];
      [controller removeFromParentViewController];
      [controller setViewController:nil forPlacement:UIArrangementViewControllerViewPlacementPrimary animated:NO];
      [controller setViewController:nil forPlacement:UIArrangementViewControllerViewPlacementSecondary animated:NO];
    }
  }
#endif
  RELEASE_TO_NIL(arrangementController);
  RELEASE_TO_NIL(masterPaneController);
  RELEASE_TO_NIL(detailPaneController);
}

// Puts the wrappers back into the split window, after they have been owned by the arrangement
- (void)restoreWrappers
{
  [self addSubview:detailViewWrapper];
  [self addSubview:masterViewWrapper];
  masterViewWrapper.hidden = !masterViewVisible;
  [self setNeedsLayout];
}

// The arrangement resized a pane, so the content of the pane needs to be laid out again
- (void)paneDidLayout:(TiViewProxy *)paneProxy
{
  [paneProxy parentSizeWillChange];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self initWrappers];
  [self layoutSubviewsForOrientation:[TiUtils interfaceOrientationForScene:[self.proxy owningInstance].window.windowScene]];
}

- (void)layoutSubviewsForOrientation:(UIInterfaceOrientation)orientation
{
  if ([self usesArrangementController]) {
    // The arrangement positions both panes
    return;
  }

  CGSize refSize = self.bounds.size;
  BOOL isPortrait = self.bounds.size.height > self.bounds.size.width;

  CGRect masterRect = CGRectZero;
  CGRect detailRect = CGRectZero;
  CGPoint masterCenter = CGPointZero;
  CGPoint detailCenter = CGPointZero;
  CGSize detailSize = CGSizeZero;
  CGSize masterSize = CGSizeZero;

  CGSize oldMasterSize = masterViewWrapper.bounds.size;
  CGSize oldDetailSize = detailViewWrapper.bounds.size;

  if (isPortrait) {
    CGFloat masterWidth = roundf(splitRatioPortrait * refSize.width);
    if (showMasterInPortrait) {
      if (masterIsOverlayed) {
        /*
         * Detail occupies visible area. Master on top.
         */
        detailSize = CGSizeMake(refSize.width, refSize.height);
        masterSize = CGSizeMake(masterWidth, refSize.height);
        masterRect = CGRectMake(0, 0, masterSize.width, masterSize.height);
        masterCenter = CGPointMake(masterSize.width / 2, masterSize.height / 2);
        detailRect = CGRectMake(0, 0, detailSize.width, detailSize.height);
        detailCenter = CGPointMake(detailSize.width / 2, detailSize.height / 2);
      } else {
        /*
         * Side by side. Master+Detail occupy visible area
         */
        masterSize = CGSizeMake(masterWidth, refSize.height);
        masterRect = CGRectMake(0, 0, masterSize.width, masterSize.height);
        masterCenter = CGPointMake(masterSize.width / 2, masterSize.height / 2);
        detailSize = CGSizeMake(refSize.width - masterSize.width, refSize.height);
        detailRect = CGRectMake(0, 0, detailSize.width, detailSize.height);
        detailCenter = CGPointMake(masterSize.width + (detailSize.width / 2), detailSize.height / 2);
      }

    } else {
      /*
       * Side by side. Detail in visible area. Master off screen to left.
       */
      detailSize = CGSizeMake(refSize.width, refSize.height);
      masterSize = CGSizeMake(masterWidth, refSize.height);
      masterRect = CGRectMake(0, 0, masterSize.width, masterSize.height);
      masterCenter = CGPointMake(-masterSize.width / 2, masterSize.height / 2);
      detailRect = CGRectMake(0, 0, detailSize.width, detailSize.height);
      detailCenter = CGPointMake(detailSize.width / 2, detailSize.height / 2);
    }
  } else {
    /*
     * Side by side. Master+Detail occupy visible area
     */
    CGFloat masterWidth = roundf(splitRatioLandscape * refSize.width);
    detailSize = CGSizeMake(refSize.width - masterWidth, refSize.height);
    masterSize = CGSizeMake(masterWidth, refSize.height);
    masterRect = CGRectMake(0, 0, masterSize.width, masterSize.height);
    masterCenter = CGPointMake(masterSize.width / 2, masterSize.height / 2);
    detailRect = CGRectMake(0, 0, detailSize.width, detailSize.height);
    detailCenter = CGPointMake(masterSize.width + (detailSize.width / 2), detailSize.height / 2);
  }

  [detailViewWrapper setBounds:detailRect];
  [detailViewWrapper setCenter:detailCenter];
  [masterViewWrapper setBounds:masterRect];
  [masterViewWrapper setCenter:masterCenter];

  if (!CGSizeEqualToSize(oldMasterSize, masterSize) && masterProxy != nil) {
    [masterProxy parentSizeWillChange];
  }
  if (!CGSizeEqualToSize(oldDetailSize, detailSize) && detailProxy != nil) {
    [detailProxy parentSizeWillChange];
  }
}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  [super frameSizeChanged:frame bounds:bounds];
  [self layoutSubviewsForOrientation:[TiUtils interfaceOrientationForScene:[self.proxy owningInstance].window.windowScene]];
}

- (void)setShowMasterInPortrait_:(id)value withObject:(id)animated
{
  BOOL oldVal = showMasterInPortrait;
  showMasterInPortrait = [TiUtils boolValue:value def:oldVal];
  if (showMasterInPortrait == oldVal) {
    return;
  }
  BOOL animate = [TiUtils boolValue:@"animated" properties:animated def:NO];

  UIInterfaceOrientation curOrientation = [TiUtils interfaceOrientationForScene:[self.proxy owningInstance].window.windowScene];
  if (viewsInitialized && UIInterfaceOrientationIsPortrait(curOrientation)) {
    if (animate) {
      void (^animation)() = ^{
        [self layoutSubviewsForOrientation:curOrientation];
      };
      [UIView animateWithDuration:0.2 animations:animation];
    } else {
      [self layoutSubviewsForOrientation:curOrientation];
    }
  }
}

- (void)setMasterIsOverlayed_:(id)value withObject:(id)animated
{
  BOOL oldVal = masterIsOverlayed;
  masterIsOverlayed = [TiUtils boolValue:value def:oldVal];
  if (masterIsOverlayed == oldVal) {
    return;
  }
  BOOL animate = [TiUtils boolValue:@"animated" properties:animated def:NO];

  UIInterfaceOrientation curOrientation = [TiUtils interfaceOrientationForScene:[self.proxy owningInstance].window.windowScene];
  if (viewsInitialized && UIInterfaceOrientationIsPortrait(curOrientation)) {
    if (animate) {
      void (^animation)() = ^{
        [self layoutSubviewsForOrientation:curOrientation];
      };
      [UIView animateWithDuration:0.2 animations:animation];
    } else {
      [self layoutSubviewsForOrientation:curOrientation];
    }
  }
}

- (void)setMasterView_:(id)args
{
  ENSURE_TYPE(args, TiViewProxy);
  if (args == masterProxy) {
    return;
  }
  if (masterProxy != nil) {
    [masterProxy windowWillClose];
    [masterProxy windowDidClose];
    if ([masterProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      [(TiWindowProxy *)masterProxy setIsManaged:NO];
    }
  }
  RELEASE_TO_NIL(masterProxy);
  masterProxy = [args retain];

  TiWindowProxy *masterWindowProxy = (TiWindowProxy *)masterProxy;
  masterWindowProxy.isMasterWindow = YES;

  if (viewsInitialized) {
    [self initProxy:masterProxy withWrapper:masterViewWrapper];
  }
}

- (void)setDetailView_:(id)args
{
  ENSURE_TYPE(args, TiViewProxy);
  if (args == detailProxy) {
    return;
  }
  if (detailProxy != nil) {
    [detailProxy windowWillClose];
    [detailProxy windowDidClose];
    if ([detailProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      [(TiWindowProxy *)detailProxy setIsManaged:NO];
    }
  }
  RELEASE_TO_NIL(detailProxy);
  detailProxy = [args retain];

  TiWindowProxy *detailWindowProxy = (TiWindowProxy *)detailProxy;
  detailWindowProxy.isDetailWindow = YES;

  if (viewsInitialized) {
    [self initProxy:detailProxy withWrapper:detailViewWrapper];
  }
}

- (void)setPortraitSplit_:(id)args
{
  ENSURE_SINGLE_ARG(args, NSNumber);
  CGFloat newValue = [TiUtils floatValue:args def:-1];

  if ((newValue >= 0.25) && (newValue <= 0.5) && newValue != splitRatioPortrait) {
    splitRatioPortrait = newValue;
    UIInterfaceOrientation curOrientation = [TiUtils interfaceOrientationForScene:[self.proxy owningInstance].window.windowScene];
    if (viewsInitialized && UIInterfaceOrientationIsPortrait(curOrientation)) {
      [self layoutSubviewsForOrientation:curOrientation];
    }
  } else {
    [self.proxy replaceValue:NUMFLOAT(splitRatioPortrait) forKey:@"portraitSplit" notification:NO];
  }
}

- (void)setLandscapeSplit_:(id)args
{
  ENSURE_SINGLE_ARG(args, NSNumber);
  CGFloat newValue = [TiUtils floatValue:args def:-1];

  if ((newValue >= 0.25) && (newValue <= 0.5) && newValue != splitRatioLandscape) {
    splitRatioLandscape = newValue;
    UIInterfaceOrientation curOrientation = [TiUtils interfaceOrientationForScene:[self.proxy owningInstance].window.windowScene];
    if (viewsInitialized && UIInterfaceOrientationIsLandscape(curOrientation)) {
      [self layoutSubviewsForOrientation:curOrientation];
    }
  } else {
    [self.proxy replaceValue:NUMFLOAT(splitRatioLandscape) forKey:@"landscapeSplit" notification:NO];
  }
}

@end
#endif
