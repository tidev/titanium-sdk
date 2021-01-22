/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSPREVIEWCONTEXT
#import "TiUIiOSPreviewContextProxy.h"
#import "TiUIListView.h"
#import "TiUIScrollView.h"
#import "TiUITableView.h"

@implementation TiUIiOSPreviewContextProxy

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self setPreview:[properties valueForKey:@"preview"]];
  [self setContentHeight:[TiUtils intValue:@"contentHeight" def:0]];

  [super _initWithProperties:properties];
}

- (void)setActions:(NSMutableArray *)actions
{
  for (TiProxy *proxy in _actions) {
    if ([proxy isKindOfClass:[TiProxy class]]) {
      [self forgetProxy:proxy];
    }
  }

  RELEASE_AND_REPLACE(_actions, actions);

  for (TiProxy *proxy in _actions) {
    if ([proxy isKindOfClass:[TiProxy class]]) {
      [self rememberProxy:proxy];
    }
  }
}

- (void)dealloc
{
  for (TiProxy *proxy in _actions) {
    if ([proxy isKindOfClass:[TiProxy class]]) {
      [self forgetProxy:proxy];
    }
  }

  RELEASE_TO_NIL(_preview);
  RELEASE_TO_NIL(_sourceView);
  RELEASE_TO_NIL(_actions);

  [super dealloc];
}

- (void)connectToDelegate
{
  UIView *nativeSourceView = nil;

#ifdef USE_TI_UILISTVIEW
  if ([[_sourceView view] isKindOfClass:[TiUIListView class]]) {
    nativeSourceView = [(TiUIListView *)[_sourceView view] tableView];
  }
#else
#ifdef USE_TI_UITABLEVIEW
  if ([[_sourceView view] isKindOfClass:[TiUITableView class]]) {
    nativeSourceView = [(TiUITableView *)[_sourceView view] tableView];
  }
#else
#ifdef USE_TI_UISCROLLVIEW
  if ([[_sourceView view] isKindOfClass:[TiUIScrollView class]]) {
    nativeSourceView = [(TiUIScrollView *)[_sourceView view] scrollView];
  }
#endif
#endif
#endif

  if (nativeSourceView == nil) {
    nativeSourceView = [_sourceView view];
  }
  UIViewController *controller = [[[TiApp app] controller] topPresentedController];
  TiPreviewingDelegate *previewingDelegate = [[TiPreviewingDelegate alloc] initWithPreviewContext:self];

  [controller registerForPreviewingWithDelegate:previewingDelegate
                                     sourceView:nativeSourceView];

  RELEASE_TO_NIL(previewingDelegate);
}

@end
#endif
