/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW
#import "TiUIiOSSplitWindowProxy.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiTab.h>

@implementation TiUIiOSSplitWindowProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.SplitWindow";
}

- (void)dealloc
{
  if (splitController != nil) {
    UISplitViewController *split = splitController;
    splitController = nil;
    TiThreadPerformOnMainThread(
        ^{
          split.delegate = nil;
          [split release];
        },
        YES);
  }
  RELEASE_TO_NIL(masterWindow);
  RELEASE_TO_NIL(detailWindow);
  [super dealloc];
}

#pragma mark - Split view controller

- (UISplitViewController *)splitViewController
{
  if (splitController == nil) {
    splitController = [[UISplitViewController alloc] initWithStyle:UISplitViewControllerStyleDoubleColumn];
    splitController.delegate = self;
    [TiUtils configureController:splitController withObject:self];

    for (NSString *key in @[ @"displayMode", @"splitBehavior", @"presentsWithGesture", @"primaryColumnWidthFraction", @"minimumPrimaryColumnWidth", @"maximumPrimaryColumnWidth" ]) {
      id value = [self valueForUndefinedKey:key];
      if (!IS_NULL_OR_NIL(value)) {
        [self applyNativeProperty:key value:value];
      }
    }
  }
  return splitController;
}

// Opens the pane as a managed window. The window opens on the next turn of the main thread, so the column of the
// split view controller is assigned after that (see installPanes), once a NavigationWindow has set up its
// navigation controller.
- (void)openPane:(TiWindowProxy *)pane
{
  if (pane == nil || ![[pane closed] boolValue]) {
    return;
  }
  [pane setIsManaged:YES];
  [pane open:nil];
}

- (TiWindowProxy *)paneForColumn:(UISplitViewControllerColumn)column
{
  return column == UISplitViewControllerColumnPrimary ? masterWindow : detailWindow;
}

- (void)closePane:(TiWindowProxy *)pane
{
  if (pane != nil && ![[pane closed] boolValue]) {
    [pane close:nil];
  }
}

// The view controller the split view controller shows for the pane. A NavigationWindow is represented by its
// navigation controller, so the split view controller places its display mode button into the navigation bar of the
// pane. Any other window is wrapped in a navigation controller by the split view controller, which gives the window a
// navigation bar.
- (UIViewController *)columnControllerForPane:(TiWindowProxy *)pane
{
  if (pane == nil) {
    return nil;
  }
  if ([pane conformsToProtocol:@protocol(TiTab)]) {
    return [(id<TiTab>)pane controller];
  }
  return [pane hostingController];
}

- (void)installPanes
{
  if (splitController == nil) {
    return;
  }
  [splitController setViewController:[self columnControllerForPane:masterWindow] forColumn:UISplitViewControllerColumnPrimary];
  [splitController setViewController:[self columnControllerForPane:detailWindow] forColumn:UISplitViewControllerColumnSecondary];
}

// Makes the split view controller a child of the view controller that shows this window, so UIKit forwards appearance,
// trait and size changes to the panes. The parent is only known once this window has a hosting controller or its view
// is on screen, so this is called at every point where that can have happened.
- (void)attachSplitController
{
  if (splitController == nil || ![self viewInitialized]) {
    return;
  }
  if (controller == nil && [[self view] window] == nil) {
    return;
  }

  UIViewController *parent = [self windowHoldingController];
  if (parent == nil || splitController.parentViewController == parent) {
    return;
  }
  if (splitController.parentViewController != nil) {
    [splitController willMoveToParentViewController:nil];
    [splitController removeFromParentViewController];
  }
  [parent addChildViewController:splitController];
  [splitController didMoveToParentViewController:parent];
}

- (void)detachSplitController
{
  if (splitController == nil) {
    return;
  }
  UISplitViewController *split = splitController;
  splitController = nil;

  split.delegate = nil;
  [split willMoveToParentViewController:nil];
  [split.view removeFromSuperview];
  [split removeFromParentViewController];

  [self closePane:masterWindow];
  [self closePane:detailWindow];

  // The panes close on the next turn of the main thread and a NavigationWindow detaches its navigation controller
  // from the split view controller while doing so. Keep the split view controller alive until then.
  TiThreadPerformOnMainThread(
      ^{
        [split release];
      },
      NO);
}

#pragma mark - Panes

- (void)setMasterView:(id)value
{
  ENSURE_TYPE(value, TiWindowProxy);
  [self replaceValue:value forKey:@"masterView" notification:NO];
  if (value == masterWindow) {
    return;
  }

  TiWindowProxy *oldPane = masterWindow;
  masterWindow = [value retain];
  masterWindow.isMasterWindow = YES;
  [self replacePane:oldPane with:masterWindow inColumn:UISplitViewControllerColumnPrimary];
  [oldPane release];
}

- (void)setDetailView:(id)value
{
  ENSURE_TYPE(value, TiWindowProxy);
  [self replaceValue:value forKey:@"detailView" notification:NO];
  if (value == detailWindow) {
    return;
  }

  TiWindowProxy *oldPane = detailWindow;
  detailWindow = [value retain];
  detailWindow.isDetailWindow = YES;
  [self replacePane:oldPane with:detailWindow inColumn:UISplitViewControllerColumnSecondary];
  [oldPane release];
}

- (void)replacePane:(TiWindowProxy *)oldPane with:(TiWindowProxy *)newPane inColumn:(UISplitViewControllerColumn)column
{
  if (splitController == nil) {
    return; // Installed when the window opens
  }
  [self openPane:newPane];
  TiThreadPerformOnMainThread(
      ^{
        // The panes can have been replaced again in the meantime: only install the pane that still owns the column and
        // only close a pane that no longer owns any column.
        if (splitController != nil && [self paneForColumn:column] == newPane) {
          [splitController setViewController:[self columnControllerForPane:newPane] forColumn:column];
        }
        if (oldPane != masterWindow && oldPane != detailWindow) {
          [self closePane:oldPane];
        }
      },
      NO);
}

#pragma mark - Native properties of UISplitViewController

- (void)applyNativeProperty:(NSString *)key value:(id)value
{
  if (splitController == nil) {
    return;
  }
  TiThreadPerformOnMainThread(
      ^{
        if ([key isEqualToString:@"displayMode"]) {
          NSInteger mode = [TiUtils intValue:value def:UISplitViewControllerDisplayModeAutomatic];
          if (mode < UISplitViewControllerDisplayModeAutomatic || mode > UISplitViewControllerDisplayModeOneOverSecondary) {
            mode = UISplitViewControllerDisplayModeAutomatic;
          }
          splitController.preferredDisplayMode = mode;
        } else if ([key isEqualToString:@"splitBehavior"]) {
          NSInteger behavior = [TiUtils intValue:value def:UISplitViewControllerSplitBehaviorAutomatic];
          if (behavior < UISplitViewControllerSplitBehaviorAutomatic || behavior > UISplitViewControllerSplitBehaviorDisplace) {
            behavior = UISplitViewControllerSplitBehaviorAutomatic;
          }
          splitController.preferredSplitBehavior = behavior;
        } else if ([key isEqualToString:@"presentsWithGesture"]) {
          splitController.presentsWithGesture = [TiUtils boolValue:value def:YES];
        } else if ([key isEqualToString:@"primaryColumnWidthFraction"]) {
          splitController.preferredPrimaryColumnWidthFraction = [TiUtils floatValue:value def:UISplitViewControllerAutomaticDimension];
        } else if ([key isEqualToString:@"minimumPrimaryColumnWidth"]) {
          splitController.minimumPrimaryColumnWidth = [TiUtils floatValue:value def:UISplitViewControllerAutomaticDimension];
        } else if ([key isEqualToString:@"maximumPrimaryColumnWidth"]) {
          splitController.maximumPrimaryColumnWidth = [TiUtils floatValue:value def:UISplitViewControllerAutomaticDimension];
        }
      },
      YES);
}

- (void)setDisplayMode:(id)value
{
  [self replaceValue:value forKey:@"displayMode" notification:NO];
  [self applyNativeProperty:@"displayMode" value:value];
}

// The display mode in use, which can differ from the requested one (e.g. in a compact width)
- (NSNumber *)displayMode
{
  if (splitController != nil) {
    return @(splitController.displayMode);
  }
  return @([TiUtils intValue:[self valueForUndefinedKey:@"displayMode"] def:UISplitViewControllerDisplayModeAutomatic]);
}

- (void)setSplitBehavior:(id)value
{
  [self replaceValue:value forKey:@"splitBehavior" notification:NO];
  [self applyNativeProperty:@"splitBehavior" value:value];
}

- (NSNumber *)splitBehavior
{
  if (splitController != nil) {
    return @(splitController.splitBehavior);
  }
  return @([TiUtils intValue:[self valueForUndefinedKey:@"splitBehavior"] def:UISplitViewControllerSplitBehaviorAutomatic]);
}

- (void)setPresentsWithGesture:(id)value
{
  [self replaceValue:value forKey:@"presentsWithGesture" notification:NO];
  [self applyNativeProperty:@"presentsWithGesture" value:value];
}

- (void)setPrimaryColumnWidthFraction:(id)value
{
  [self replaceValue:value forKey:@"primaryColumnWidthFraction" notification:NO];
  [self applyNativeProperty:@"primaryColumnWidthFraction" value:value];
}

- (void)setMinimumPrimaryColumnWidth:(id)value
{
  [self replaceValue:value forKey:@"minimumPrimaryColumnWidth" notification:NO];
  [self applyNativeProperty:@"minimumPrimaryColumnWidth" value:value];
}

- (void)setMaximumPrimaryColumnWidth:(id)value
{
  [self replaceValue:value forKey:@"maximumPrimaryColumnWidth" notification:NO];
  [self applyNativeProperty:@"maximumPrimaryColumnWidth" value:value];
}

- (void)showMasterView:(id)unused
{
  TiThreadPerformOnMainThread(
      ^{
        [splitController showColumn:UISplitViewControllerColumnPrimary];
      },
      NO);
}

- (void)hideMasterView:(id)unused
{
  TiThreadPerformOnMainThread(
      ^{
        [splitController hideColumn:UISplitViewControllerColumnPrimary];
      },
      NO);
}

#pragma mark - Deprecated layout properties

// The layout is owned by UISplitViewController since 14.0.0. These properties have no effect anymore.

- (void)setShowMasterInPortrait:(id)value withObject:(id)animated
{
  DEPRECATED_REPLACED(@"UI.iOS.SplitWindow.showMasterInPortrait", @"14.0.0", @"UI.iOS.SplitWindow.displayMode");
  [self replaceValue:value forKey:@"showMasterInPortrait" notification:NO];
}

- (void)setMasterIsOverlayed:(id)value withObject:(id)animated
{
  DEPRECATED_REPLACED(@"UI.iOS.SplitWindow.masterIsOverlayed", @"14.0.0", @"UI.iOS.SplitWindow.splitBehavior");
  [self replaceValue:value forKey:@"masterIsOverlayed" notification:NO];
}

- (void)setMasterViewVisible:(id)value
{
  DEPRECATED_REPLACED(@"UI.iOS.SplitWindow.masterViewVisible", @"14.0.0", @"UI.iOS.SplitWindow.showMasterView");
  [self replaceValue:value forKey:@"masterViewVisible" notification:NO];
}

- (void)setPortraitSplit:(id)value
{
  DEPRECATED_REPLACED(@"UI.iOS.SplitWindow.portraitSplit", @"14.0.0", @"UI.iOS.SplitWindow.primaryColumnWidthFraction");
  [self replaceValue:value forKey:@"portraitSplit" notification:NO];
}

- (void)setLandscapeSplit:(id)value
{
  DEPRECATED_REPLACED(@"UI.iOS.SplitWindow.landscapeSplit", @"14.0.0", @"UI.iOS.SplitWindow.primaryColumnWidthFraction");
  [self replaceValue:value forKey:@"landscapeSplit" notification:NO];
}

#pragma mark - UISplitViewControllerDelegate

- (void)splitViewController:(UISplitViewController *)svc willChangeToDisplayMode:(UISplitViewControllerDisplayMode)displayMode
{
  if ([self _hasListeners:@"displaymodechange"]) {
    [self fireEvent:@"displaymodechange" withObject:@{ @"displayMode" : @(displayMode) }];
  }
}

- (void)splitViewControllerDidCollapse:(UISplitViewController *)svc
{
  if ([self _hasListeners:@"collapse"]) {
    [self fireEvent:@"collapse" withObject:nil];
  }
}

- (void)splitViewControllerDidExpand:(UISplitViewController *)svc
{
  if ([self _hasListeners:@"expand"]) {
    [self fireEvent:@"expand" withObject:nil];
  }
}

#pragma mark - TiWindowProxy overrides

- (BOOL)_handleOpen:(id)args
{
  if (masterWindow == nil || detailWindow == nil) {
    DebugLog(@"[ERROR] The masterView and detailView of a SplitWindow must be set to a Ti.UI.Window before the window is opened.");
    return NO;
  }
  return [super _handleOpen:args];
}

- (void)windowWillOpen
{
  UIView *splitView = [[self splitViewController] view];
  splitView.frame = [[self view] bounds];
  splitView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [[self view] addSubview:splitView];

  [self openPane:masterWindow];
  [self openPane:detailWindow];
  TiThreadPerformOnMainThread(
      ^{
        [self installPanes];
      },
      NO);

  [super windowWillOpen];
}

- (void)windowDidOpen
{
  [self attachSplitController];
  [super windowDidOpen];
}

- (void)parentWillShow
{
  [super parentWillShow];
  [self attachSplitController];
}

- (void)viewWillAppear:(BOOL)animated
{
  [self attachSplitController];
  [super viewWillAppear:animated];
}

- (void)windowDidClose
{
  [self detachSplitController];
  [super windowDidClose];
}

- (void)gainFocus
{
  [masterWindow gainFocus];
  [detailWindow gainFocus];
  [super gainFocus];
}

- (void)resignFocus
{
  [masterWindow resignFocus];
  [detailWindow resignFocus];
  [super resignFocus];
}

@end
#endif
