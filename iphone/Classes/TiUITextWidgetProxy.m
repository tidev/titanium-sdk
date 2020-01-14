/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITEXTWIDGET) || defined(USE_TI_UITEXTAREA) || defined(USE_TI_UITEXTFIELD)

#import "TiUITextWidgetProxy.h"
#import "TiUITextWidget.h"

#import <TitaniumKit/TiUtils.h>

@implementation TiUITextWidgetProxy
@synthesize suppressFocusEvents;
DEFINE_DEF_BOOL_PROP(suppressReturn, YES);

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self initializeProperty:@"enabled" defaultValue:NUMBOOL(YES)];
  [self initializeProperty:@"editable" defaultValue:NUMBOOL(YES)];
  [super _initWithProperties:properties];
}

- (void)windowWillClose
{
  if ([self viewInitialized]) {
    [self blur:nil];
  }
  [(TiViewProxy *)[keyboardTiView proxy] windowWillClose];
  for (TiViewProxy *thisToolBarItem in keyboardToolbarItems) {
    [thisToolBarItem windowWillClose];
    [self forgetProxy:thisToolBarItem];
  }
  [super windowWillClose];
}

- (void)dealloc
{
  [keyboardTiView removeFromSuperview];
  [keyboardUIToolbar removeFromSuperview];
  RELEASE_TO_NIL(keyboardTiView);
  for (TiProxy *proxy in keyboardToolbarItems) {
    [self forgetProxy:proxy];
  }
  RELEASE_TO_NIL(keyboardToolbarItems);
  RELEASE_TO_NIL(keyboardUIToolbar);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.TextWidget";
}

- (NSNumber *)hasText:(id)unused
{
  if ([self viewAttached]) {
    __block BOOL viewHasText = NO;
    TiThreadPerformOnMainThread(
        ^{
          viewHasText = [(TiUITextWidget *)[self view] hasText];
        },
        YES);
    return [NSNumber numberWithBool:viewHasText];
  } else {
    NSString *value = [TiUtils stringValue:[self valueForKey:@"value"]];
    BOOL viewHasText = value != nil && [value length] > 0;
    return [NSNumber numberWithBool:viewHasText];
  }
}

- (void)blur:(id)args
{
  ENSURE_UI_THREAD_1_ARG(args)
  if ([self viewAttached]) {
    [[(TiUITextWidget *)[self view] textWidgetView] resignFirstResponder];
  }
}

- (void)focus:(id)args
{
  ENSURE_UI_THREAD_1_ARG(args)
  if ([self viewAttached]) {
    [[(TiUITextWidget *)[self view] textWidgetView] becomeFirstResponder];
  }
}

// This is exposed to JS as "focused" property
- (BOOL)isFocused
{
  return [self focused:nil];
}

- (BOOL)focused:(id)unused
{
  if (![NSThread isMainThread]) {
    __block BOOL result = NO;
    TiThreadPerformOnMainThread(
        ^{
          result = [self focused:nil];
        },
        YES);
    return result;
  }
  BOOL result = NO;
  if ([self viewAttached]) {
    result = [(TiUITextWidget *)[self view] isFirstResponder];
  }

  return result;
}

- (void)noteValueChange:(NSString *)newValue
{
  if (![[self valueForKey:@"value"] isEqual:newValue]) {
    [self replaceValue:newValue forKey:@"value" notification:NO];
    [self contentsWillChange];
    [self fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
    TiThreadPerformOnMainThread(
        ^{
          //Make sure the text widget is in view when editing.
          [(TiUITextWidget *)[self view] updateKeyboardStatus];
        },
        NO);
  }
}

#pragma mark Toolbar

- (CGFloat)keyboardAccessoryHeight
{
  CGFloat result = MAX(keyboardAccessoryHeight, 40);
#ifndef TI_USE_AUTOLAYOUT
  if ([[keyboardTiView proxy] respondsToSelector:@selector(verifyHeight:)]) {
    result = [(TiViewProxy<LayoutAutosizing> *)[keyboardTiView proxy] verifyHeight:result];
  }
#endif
  return result;
}

- (void)setKeyboardToolbarHeight:(id)value
{
  ENSURE_UI_THREAD_1_ARG(value);
  keyboardAccessoryHeight = [TiUtils floatValue:value];
  //TODO: If we're focused or the toolbar is otherwise onscreen, we need to let the root view controller know and update.
}

- (void)setKeyboardToolbarColor:(id)value
{
  //Because views aren't lock-protected, ANY and all references, even checking if non-nil, should be done in the main thread.
  ENSURE_UI_THREAD_1_ARG(value);
  [self replaceValue:value forKey:@"keyboardToolbarColor" notification:YES];
  if (keyboardUIToolbar != nil) { //It already exists, update it.
    UIColor *newColor = [[TiUtils colorValue:value] _color];
    [keyboardUIToolbar setBarTintColor:newColor];
  }
}

- (void)updateUIToolbar
{
  NSMutableArray *items = [NSMutableArray arrayWithCapacity:[keyboardToolbarItems count]];
  for (TiViewProxy *proxy in keyboardToolbarItems) {
    if ([proxy supportsNavBarPositioning]) {
      UIBarButtonItem *button = [proxy barButtonItem];
      [items addObject:button];
    }
  }
  [keyboardUIToolbar setItems:items animated:YES];
}

- (UIToolbar *)keyboardUIToolbar
{
  if (keyboardUIToolbar == nil) {
    keyboardUIToolbar = [[UIToolbar alloc] initWithFrame:CGRectMake(0, 0, 320, [self keyboardAccessoryHeight])];
    UIColor *newColor = [[TiUtils colorValue:[self valueForKey:@"keyboardToolbarColor"]] _color];
    if (newColor != nil) {
      [keyboardUIToolbar setBarTintColor:newColor];
    }
    [self updateUIToolbar];
  }
  return keyboardUIToolbar;
}

- (void)setKeyboardToolbar:(id)value
{
  // TODO: The entire codebase needs to be evaluated for the following:
  //
  // - Any property setter which potentially takes an array of proxies MUST ALWAYS have its
  // content evaluated to protect them. This is INCREDIBLY CRITICAL and almost certainly a major
  // source of memory bugs in Titanium iOS!!!
  //
  // - Any property setter which is active on the main thread only MAY NOT protect their object
  // correctly or in time (see the comment in -[KrollObject noteKeylessKrollObject:]).
  //
  // This may have to be done as part of TIMOB-6990 (convert KrollContext to serialized GCD)

  if ([value isKindOfClass:[NSArray class]]) {
    for (id item in value) {
      ENSURE_TYPE(item, TiProxy);
      [self rememberProxy:item];
    }
  }

  //Because views aren't lock-protected, ANY and all references, even checking if non-nil, should be done in the main thread.

  // TODO: ENSURE_UI_THREAD needs to be deprecated in favor of more effective and concicse mechanisms
  // which use the main thread only when necessary to reduce latency.
  ENSURE_UI_THREAD_1_ARG(value);
  [self replaceValue:value forKey:@"keyboardToolbar" notification:YES];

  if (value == nil) {
    for (TiProxy *proxy in keyboardToolbarItems) {
      [self forgetProxy:proxy];
    }
    RELEASE_TO_NIL(keyboardTiView);
    RELEASE_TO_NIL(keyboardToolbarItems);
    [keyboardUIToolbar setItems:nil];
    [(UITextField *)[(TiUITextWidget *)[self view] textWidgetView] setInputAccessoryView:nil];
    [[(TiUITextWidget *)[self view] textWidgetView] reloadInputViews];
    return;
  }

  if ([value isKindOfClass:[NSArray class]]) {
    RELEASE_TO_NIL(keyboardTiView);

    // TODO: Check for proxies
    [keyboardToolbarItems autorelease];
    for (TiProxy *proxy in keyboardToolbarItems) {
      [self forgetProxy:proxy];
    }

    keyboardToolbarItems = [value copy];
    if (keyboardUIToolbar != nil) {
      [self updateUIToolbar];
    }
    [[self keyboardAccessoryView] setBounds:CGRectMake(0, 0, 0, [self keyboardAccessoryHeight])];
    [(UITextField *)[(TiUITextWidget *)[self view] textWidgetView] setInputAccessoryView:[self keyboardAccessoryView]];
    [[(TiUITextWidget *)[self view] textWidgetView] reloadInputViews];
    return;
  }

  if ([value isKindOfClass:[TiViewProxy class]]) {
    TiUIView *valueView = [(TiViewProxy *)value view];
    if (valueView == keyboardTiView) { //Nothing to do here.
      return;
    }
    RELEASE_TO_NIL(keyboardTiView);
    for (TiProxy *proxy in keyboardToolbarItems) {
      [self forgetProxy:proxy];
    }
    RELEASE_TO_NIL(keyboardToolbarItems);
    [keyboardUIToolbar setItems:nil];

    keyboardTiView = [valueView retain];
    [keyboardTiView setBounds:CGRectMake(0, 0, 0, [self keyboardAccessoryHeight])];
    [(UITextField *)[(TiUITextWidget *)[self view] textWidgetView] setInputAccessoryView:keyboardTiView];
    [[(TiUITextWidget *)[self view] textWidgetView] reloadInputViews];
  }
}

- (UIView *)keyboardAccessoryView;
{
  if (keyboardTiView != nil) {
    return keyboardTiView;
  }

  if ([keyboardToolbarItems count] > 0) {
    return [self keyboardUIToolbar];
  }

  return nil;
}

#ifndef TI_USE_AUTOLAYOUT
- (TiDimension)defaultAutoWidthBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
- (TiDimension)defaultAutoHeightBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
#endif

- (NSDictionary *)selection
{
  if ([self viewAttached]) {
    __block NSDictionary *result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[(TiUITextWidget *)[self view] selectedRange] retain];
        },
        YES);
    return [result autorelease];
  }
  return nil;
}

- (void)setSelection:(id)arg withObject:(id)property
{
  NSInteger start = [TiUtils intValue:arg def:-1];
  NSInteger end = [TiUtils intValue:property def:-1];
  NSString *curValue = [TiUtils stringValue:[self valueForKey:@"value"]];
  NSInteger textLength = [curValue length];
  if ((start < 0) || (start > textLength) || (end < 0) || (end > textLength)) {
    DebugLog(@"Invalid range for text selection. Ignoring.");
    return;
  }
  TiThreadPerformOnMainThread(
      ^{
        [(TiUITextWidget *)[self view] setSelectionFrom:arg to:property];
      },
      NO);
}
#ifndef TI_USE_AUTOLAYOUT
USE_VIEW_FOR_CONTENT_HEIGHT
USE_VIEW_FOR_CONTENT_WIDTH
#endif
@end

#endif
