/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW
#import "TiUIiOSSplitWindowProxy.h"
#import "TiUIiOSSplitWindow.h"

@implementation TiUIiOSSplitWindowProxy

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self initializeProperty:@"showMasterInPortrait" defaultValue:NUMBOOL(NO)];
  [self initializeProperty:@"masterIsOverlayed" defaultValue:NUMBOOL(NO)];
  [self initializeProperty:@"masterViewVisible" defaultValue:NUMBOOL(YES)];

  [super _initWithProperties:properties];
}

- (TiUIView *)newView
{
  CGRect frame = [self appFrame];
  TiUIiOSSplitWindow *win = [[TiUIiOSSplitWindow alloc] initWithFrame:frame];
  return win;
}

- (void)setShowMasterInPortrait:(id)value withObject:(id)animated
{
  [self replaceValue:value forKey:@"showMasterInPortrait" notification:NO];
  if ([self viewInitialized]) {
    TiThreadPerformOnMainThread(
        ^{
          [(TiUIiOSSplitWindow *)[self view] setShowMasterInPortrait_:value withObject:animated];
        },
        YES);
  }
}

- (void)setMasterIsOverlayed:(id)value withObject:(id)animated
{
  [self replaceValue:value forKey:@"masterIsOverlayed" notification:NO];
  if ([self viewInitialized]) {
    TiThreadPerformOnMainThread(
        ^{
          [(TiUIiOSSplitWindow *)[self view] setMasterIsOverlayed_:value withObject:animated];
        },
        YES);
  }
}

- (void)setMasterViewVisible:(NSNumber *)value
{
  [self replaceValue:value forKey:@"masterViewVisible" notification:NO];

  if ([self viewInitialized]) {
    TiThreadPerformOnMainThread(
        ^{
          [(TiUIiOSSplitWindow *)[self view] setMasterViewVisible_:value];
        },
        YES);
  }
}

#pragma mark - TiViewProxy Overrides
- (void)windowWillOpen
{
  if ([self viewInitialized]) {
    TiThreadPerformOnMainThread(
        ^{
          [(TiUIiOSSplitWindow *)self.view initWrappers];
        },
        YES);
  }
  [super windowWillOpen];
}

- (void)windowWillClose
{
  if ([self viewInitialized]) {
    TiThreadPerformOnMainThread(
        ^{
          [(TiUIiOSSplitWindow *)self.view cleanup];
        },
        YES);
  }
  [super windowWillOpen];
}

#pragma mark - TiWindowProtocol handler

- (void)gainFocus
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView gainFocus];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView gainFocus];
  }
  [super gainFocus];
}

- (void)resignFocus
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView resignFocus];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView resignFocus];
  }
  [super resignFocus];
}

- (BOOL)_handleOpen:(id)args
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if (![masterView isKindOfClass:[TiViewProxy class]]) {
    DebugLog(@"masterView property must be set to an object of type TiViewProxy");
    return NO;
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if (![detailView isKindOfClass:[TiViewProxy class]]) {
    DebugLog(@"detailView property must be set to an object of type TiViewProxy");
    return NO;
  }

  return [super _handleOpen:args];
}

- (void)viewWillAppear:(BOOL)animated
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView viewWillAppear:animated];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView viewWillAppear:animated];
  }
  [super viewWillAppear:animated];
}
- (void)viewWillDisappear:(BOOL)animated
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView viewWillDisappear:animated];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView viewWillDisappear:animated];
  }
  [super viewWillDisappear:animated];
}
- (void)viewDidAppear:(BOOL)animated
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView viewDidAppear:animated];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView viewDidAppear:animated];
  }
  [super viewDidAppear:animated];
}
- (void)viewDidDisappear:(BOOL)animated
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView viewDidDisappear:animated];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView viewDidDisappear:animated];
  }
  [super viewDidDisappear:animated];
}

- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
  }
  [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
}

- (void)willTransitionToTraitCollection:(UITraitCollection *)newCollection withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView willTransitionToTraitCollection:newCollection withTransitionCoordinator:coordinator];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView willTransitionToTraitCollection:newCollection withTransitionCoordinator:coordinator];
  }
  [super willTransitionToTraitCollection:newCollection withTransitionCoordinator:coordinator];
}

- (void)systemLayoutFittingSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView systemLayoutFittingSizeDidChangeForChildContentContainer:container];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView systemLayoutFittingSizeDidChangeForChildContentContainer:container];
  }
  [super systemLayoutFittingSizeDidChangeForChildContentContainer:container];
}

- (void)preferredContentSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
  id masterView = [self valueForUndefinedKey:@"masterView"];
  if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)masterView preferredContentSizeDidChangeForChildContentContainer:container];
  }
  id detailView = [self valueForUndefinedKey:@"detailView"];
  if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
    [(id<TiWindowProtocol>)detailView preferredContentSizeDidChangeForChildContentContainer:container];
  }
  [super preferredContentSizeDidChangeForChildContentContainer:container];
}

@end
#endif
