/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import "TiUITabGroupProxy.h"
#import "TiUITabGroup.h"
#import "TiUITabProxy.h"
#import <TitaniumKit/TiApp.h>

@implementation TiUITabGroupProxy

static NSArray *tabGroupKeySequence;
- (NSArray *)keySequence
{
  if (tabGroupKeySequence == nil) {
    //URL has to be processed first since the spinner depends on URL being remote
    tabGroupKeySequence = [[NSArray arrayWithObjects:@"tabs", @"activeTab", nil] retain];
  }
  return tabGroupKeySequence;
}

- (void)dealloc
{
  for (id thisTab in tabs) {
    [thisTab removeFromTabGroup];
    [thisTab setParentOrientationController:nil];
    [thisTab setTabGroup:nil];
  }
  RELEASE_TO_NIL(tabs);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.TabGroup";
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self initializeProperty:@"allowUserCustomization" defaultValue:NUMBOOL(YES)];
  [self initializeProperty:@"extendEdges" defaultValue:[NSArray arrayWithObjects:NUMINT(15), nil]];
  [super _initWithProperties:properties];
}

- (void)_destroy
{
  RELEASE_TO_NIL(tabs);
  [super _destroy];
}

- (TiUIView *)newView
{
  TiUITabGroup *group = [[TiUITabGroup alloc] initWithFrame:[self appFrame]];
  return group;
}

- (UITabBar *)tabbar
{
  return [(TiUITabGroup *)[self view] tabbar];
}

- (BOOL)canFocusTabs
{
  return focussed;
}

#pragma mark Public APIs

- (void)addTab:(id)tabProxy
{
  ENSURE_SINGLE_ARG(tabProxy, TiUITabProxy);
  if (tabs == nil) {
    tabs = [[NSMutableArray alloc] initWithCapacity:4];
  }
  [tabProxy setParentOrientationController:self];
  [tabs addObject:tabProxy];
  [tabProxy setTabGroup:self];
  [self replaceValue:tabs forKey:@"tabs" notification:YES];
}

- (void)removeTab:(id)tabProxy
{
  ENSURE_SINGLE_ARG(tabProxy, NSObject);
  if (tabs != nil) {
    if (![tabProxy isKindOfClass:[TiUITabProxy class]]) {
      int value = [TiUtils intValue:tabProxy];
      tabProxy = [tabs objectAtIndex:value];
      if (tabProxy == nil) {
        [self throwException:TiExceptionRangeError subreason:@"invalid tab index" location:CODELOCATION];
      }
    }

    //TODO: close all the tabs and fire events

    [tabProxy removeFromTabGroup];
    [tabProxy setParentOrientationController:nil];
    [tabProxy setTabGroup:nil];
    [tabs removeObject:tabProxy];
    [self replaceValue:tabs forKey:@"tabs" notification:YES];
  }
}

- (void)setTabs:(NSArray *)newTabs
{
  if (newTabs == tabs) {
    return;
  }

  ENSURE_TYPE_OR_NIL(newTabs, NSArray);
  for (id thisTab in newTabs) {
    ENSURE_TYPE(thisTab, TiUITabProxy);
  }

  for (id thisTab in tabs) {
    if (![newTabs containsObject:thisTab]) {
      [thisTab removeFromTabGroup];
      [thisTab setParentOrientationController:nil];
      [thisTab setTabGroup:nil];
    }
  }
  for (id thisTab in newTabs) {
    if (![tabs containsObject:thisTab]) {
      [thisTab setTabGroup:self];
      [thisTab setParentOrientationController:self];
    }
  }
  [tabs release];
  tabs = [newTabs mutableCopy];

  [self replaceValue:tabs forKey:@"tabs" notification:YES];
}

// Used to set the tab array without replacing values in the controller.
- (void)_resetTabArray:(NSArray *)newTabOrder
{
  RELEASE_TO_NIL(tabs);
  tabs = [newTabOrder mutableCopy];
}

#pragma mark Window Management

- (void)windowWillOpen
{
  TiUITabGroup *tg = (TiUITabGroup *)self.view;
  [tg open:nil];
  return [super windowWillOpen];
}

- (void)windowWillClose
{
  TiUITabGroup *tabGroup = (TiUITabGroup *)self.view;
  if (tabGroup != nil) {
    [tabGroup close:nil];
  }
  return [super windowWillClose];
}

- (void)didReceiveMemoryWarning:(NSNotification *)notification
{
  // override but don't drop the tab group, causes problems
}

- (BOOL)handleFocusEvents
{
  return NO;
}

- (void)gainFocus
{
  if (!focussed) {
    UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
    NSUInteger blessedController = [tabController selectedIndex];
    if (blessedController != NSNotFound) {
      [[tabs objectAtIndex:blessedController] handleDidFocus:nil];
    }
  }
  [super gainFocus];
}

- (void)resignFocus
{
  if (focussed) {
    UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
    NSUInteger blessedController = [tabController selectedIndex];
    if (blessedController != NSNotFound) {
      [[tabs objectAtIndex:blessedController] handleDidBlur:nil];
    }
  }
  [super resignFocus];
}

- (void)viewWillAppear:(BOOL)animated;
{
  if ([self viewAttached]) {
    UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
    [tabController viewWillAppear:animated];
  }
  [super viewWillAppear:animated];
}

- (void)viewDidAppear:(BOOL)animated;
{
  if ([self viewAttached]) {
    UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
    [tabController viewDidAppear:animated];
  }
  [super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated;
{
  if ([self viewAttached]) {
    UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
    [tabController viewWillDisappear:animated];
  }
  [super viewWillDisappear:animated];
}

- (void)viewDidDisappear:(BOOL)animated;
{
  if ([self viewAttached]) {
    UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
    [tabController viewDidDisappear:animated];
  }
  [super viewDidDisappear:animated];
}

- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  if ([self viewAttached]) {
    [(TiUITabGroup *)[self view] viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
  }
}

- (void)willTransitionToTraitCollection:(UITraitCollection *)newCollection withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  if ([self viewAttached]) {
    [(TiUITabGroup *)[self view] willTransitionToTraitCollection:newCollection withTransitionCoordinator:coordinator];
  }
}

- (void)systemLayoutFittingSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
  if ([self viewAttached]) {
    [(TiUITabGroup *)[self view] systemLayoutFittingSizeDidChangeForChildContentContainer:container];
  }
}

- (void)preferredContentSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
  if ([self viewAttached]) {
    [(TiUITabGroup *)[self view] preferredContentSizeDidChangeForChildContentContainer:container];
  }
}

- (UIStatusBarStyle)preferredStatusBarStyle;
{
  UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
  NSUInteger blessedController = [tabController selectedIndex];
  if (blessedController != NSNotFound) {
    return [[tabs objectAtIndex:blessedController] preferredStatusBarStyle];
  }
  return [super preferredStatusBarStyle];
}

- (BOOL)homeIndicatorAutoHide
{
  UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
  NSUInteger blessedController = [tabController selectedIndex];
  if (blessedController != NSNotFound) {
    return [[tabs objectAtIndex:blessedController] homeIndicatorAutoHide];
  }
  return [super homeIndicatorAutoHide];
}

- (BOOL)hidesStatusBar
{
  UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
  NSUInteger blessedController = [tabController selectedIndex];
  if (blessedController != NSNotFound) {
    return [[tabs objectAtIndex:blessedController] hidesStatusBar];
  }
  return [super hidesStatusBar];
}

- (TiOrientationFlags)orientationFlags
{
  UITabBarController *tabController = [(TiUITabGroup *)[self view] tabController];
  NSUInteger blessedController = [tabController selectedIndex];
  if (blessedController != NSNotFound) {
    TiOrientationFlags result = [[tabs objectAtIndex:blessedController] orientationFlags];
    if (result != TiOrientationNone) {
      return result;
    }
  }
  return [super orientationFlags];
}

- (void)willChangeSize
{
  [super willChangeSize];

  [tabs makeObjectsPerformSelector:@selector(willChangeSize)];
  //TODO: Shouldn't tabs have a lock protecting them?
}

@end

#endif
