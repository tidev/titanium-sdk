/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW
#import "TiUIiOSSplitWindow.h"
#import "TiUIiOSSplitWindowProxy.h"

@implementation TiUIiOSSplitWindow

- (void)dealloc
{
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
    if (UIInterfaceOrientationIsLandscape([[UIApplication sharedApplication] statusBarOrientation])) {
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
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self initWrappers];
  [self layoutSubviewsForOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
}

- (void)layoutSubviewsForOrientation:(UIInterfaceOrientation)orientation
{
  CGSize refSize = self.bounds.size;
  BOOL isPortrait = UIApplication.sharedApplication.keyWindow.frame.size.height > UIApplication.sharedApplication.keyWindow.frame.size.width;

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
  [self layoutSubviewsForOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
}

- (void)setShowMasterInPortrait_:(id)value withObject:(id)animated
{
  BOOL oldVal = showMasterInPortrait;
  showMasterInPortrait = [TiUtils boolValue:value def:oldVal];
  if (showMasterInPortrait == oldVal) {
    return;
  }
  BOOL animate = [TiUtils boolValue:@"animated" properties:animated def:NO];

  UIInterfaceOrientation curOrientation = [[UIApplication sharedApplication] statusBarOrientation];
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

  UIInterfaceOrientation curOrientation = [[UIApplication sharedApplication] statusBarOrientation];
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

#if IS_SDK_IOS_11
  TiWindowProxy *masterWindowProxy = (TiWindowProxy *)masterProxy;
  masterWindowProxy.isMasterWindow = YES;
#endif

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

#if IS_SDK_IOS_11
  TiWindowProxy *detailWindowProxy = (TiWindowProxy *)detailProxy;
  detailWindowProxy.isDetailWindow = YES;
#endif

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
    UIInterfaceOrientation curOrientation = [[UIApplication sharedApplication] statusBarOrientation];
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
    UIInterfaceOrientation curOrientation = [[UIApplication sharedApplication] statusBarOrientation];
    if (viewsInitialized && UIInterfaceOrientationIsLandscape(curOrientation)) {
      [self layoutSubviewsForOrientation:curOrientation];
    }
  } else {
    [self.proxy replaceValue:NUMFLOAT(splitRatioLandscape) forKey:@"landscapeSplit" notification:NO];
  }
}

@end
#endif
