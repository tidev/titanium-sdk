/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITEXTWIDGET) || defined(USE_TI_UITEXTAREA) || defined(USE_TI_UITEXTFIELD)

#import "TiUITextWidget.h"
#import "TiUITextWidgetProxy.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>
#ifdef USE_TI_UIATTRIBUTEDSTRING
#import "TiUIAttributedStringProxy.h"
#endif

@implementation TiUITextWidget

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoSize];
  [self setDefaultWidth:TiDimensionAutoFill];
}
#endif

- (id)init
{
  self = [super init];
  if (self != nil) {
    suppressReturn = YES;
    maxLength = -1;
    [self textWidgetView];
  }
  return self;
}

- (void)setAttributedString_:(id)arg
{
#ifdef USE_TI_UIATTRIBUTEDSTRING
  ENSURE_SINGLE_ARG(arg, TiUIAttributedStringProxy);
  [[self proxy] replaceValue:arg forKey:@"attributedString" notification:NO];
  [(id)[self textWidgetView] setAttributedText:[arg attributedString]];
#endif
}

- (void)setValue_:(id)value
{
  NSString *string = [TiUtils stringValue:value];
  if (string == nil) {
    return;
  }
  if (maxLength > -1 && [string length] > maxLength) {
    string = [string substringToIndex:maxLength];
  }
  [(id)[self textWidgetView] setText:string];
  [(TiUITextWidgetProxy *)[self proxy] noteValueChange:string];
}

- (void)setMaxLength_:(id)value
{
  maxLength = [TiUtils intValue:value def:-1];
  [self setValue_:[[self proxy] valueForUndefinedKey:@"value"]];
  [[self proxy] replaceValue:value forKey:@"maxLength" notification:NO];
}

- (void)setSuppressReturn_:(id)value
{
  suppressReturn = [TiUtils boolValue:value def:YES];
}

- (void)dealloc
{
  //Because text fields MUST be played with on main thread, we cannot release if there's the chance we're on a BG thread
  TiThreadPerformOnMainThread(^{
    [textWidgetView removeFromSuperview];
    RELEASE_TO_NIL(textWidgetView);
  },
      YES);
  [super dealloc];
}

- (BOOL)hasTouchableListener
{
  // since this guy only works with touch events, we always want them
  // just always return YES no matter what listeners we have registered
  return YES;
}

#pragma mark Must override
- (BOOL)hasText
{
  return NO;
}

- (UIView<UITextInputTraits> *)textWidgetView
{
  return nil;
}

- (id)accessibilityElement
{
  return [self textWidgetView];
}

#pragma mark Common values

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  [textWidgetView setFrame:[self bounds]];
  [super frameSizeChanged:frame bounds:bounds];
}

- (void)setColor_:(id)color
{
  UIColor *newColor = [[TiUtils colorValue:color] _color];
  [(id)[self textWidgetView] setTextColor:(newColor != nil) ? newColor : [UIColor darkTextColor]];
}

- (void)setFont_:(id)font
{
  [(id)[self textWidgetView] setFont:[[TiUtils fontValue:font] font]];
}

// <0.9 is textAlign
- (void)setTextAlign_:(id)alignment
{
  [(id)[self textWidgetView] setTextAlignment:[TiUtils textAlignmentValue:alignment]];
}

- (void)setReturnKeyType_:(id)value
{
  [[self textWidgetView] setReturnKeyType:[TiUtils intValue:value]];
}

- (void)setEnableReturnKey_:(id)value
{
  [[self textWidgetView] setEnablesReturnKeyAutomatically:[TiUtils boolValue:value]];
}

- (void)setKeyboardType_:(id)value
{
  [[self textWidgetView] setKeyboardType:[TiUtils intValue:value]];
}

- (void)setAutocorrect_:(id)value
{
  [[self textWidgetView] setAutocorrectionType:[TiUtils boolValue:value] ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo];
}

- (void)setAutofillType_:(id)value
{
  ENSURE_TYPE_OR_NIL(value, NSString);

  if (![TiUtils isIOSVersionOrGreater:@"10.0"]) {
    NSLog(@"[ERROR] The 'autofillHint' property is only available on iOS 10 and later.");
    return;
  }

  [[self textWidgetView] setTextContentType:[TiUtils stringValue:value]];
}

- (void)setPasswordMask_:(id)value
{
  [[self textWidgetView] setSecureTextEntry:[TiUtils boolValue:value]];
}

#if IS_SDK_IOS_12
- (void)setPasswordRules_:(NSString *)passwordRules
{
  ENSURE_TYPE_OR_NIL(passwordRules, NSString);

  if (![TiUtils isIOSVersionOrGreater:@"12.0"]) {
    NSLog(@"[ERROR] The 'passwordRules' property is only available on iOS 12 and later.");
    return;
  }

  [[self textWidgetView] setPasswordRules:[UITextInputPasswordRules passwordRulesWithDescriptor:passwordRules]];
}
#endif

#pragma mark Responder methods

- (void)setKeyboardAppearance_:(id)value
{
  [[self textWidgetView] setKeyboardAppearance:[TiUtils intValue:value]];
}

- (void)setAutocapitalization_:(id)value
{
  [[self textWidgetView] setAutocapitalizationType:[TiUtils intValue:value]];
}

#pragma mark Keyboard Delegates

- (void)textWidget:(UIView<UITextInputTraits> *)tw didFocusWithText:(NSString *)value
{
  TiUITextWidgetProxy *ourProxy = (TiUITextWidgetProxy *)[self proxy];
  [[ourProxy keyboardAccessoryView] setBounds:CGRectMake(0, 0, 0, [ourProxy keyboardAccessoryHeight])];

  [[TiApp controller] didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)ourProxy];

  if ([ourProxy suppressFocusEvents]) {
    return;
  }

  if ([ourProxy _hasListeners:@"focus"]) {
    [ourProxy fireEvent:@"focus" withObject:[NSDictionary dictionaryWithObject:value forKey:@"value"] propagate:NO];
  }
}

- (void)textWidget:(UIView<UITextInputTraits> *)tw didBlurWithText:(NSString *)value
{
  TiUITextWidgetProxy *ourProxy = (TiUITextWidgetProxy *)[self proxy];

  [[TiApp controller] didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)ourProxy];

  if ([ourProxy suppressFocusEvents]) {
    return;
  }

  if ([ourProxy _hasListeners:@"blur"]) {
    [ourProxy fireEvent:@"blur" withObject:[NSDictionary dictionaryWithObject:value forKey:@"value"] propagate:NO];
  }

  // In order to capture gestures properly, we need to force the root view to become the first responder.
  [self makeRootViewFirstResponder];
}

- (NSDictionary *)selectedRange
{
  id<UITextInput> textView = (id<UITextInput>)[self textWidgetView];
  if ([textView conformsToProtocol:@protocol(UITextInput)]) {
    UITextRange *theRange = [textView selectedTextRange];
    if (theRange != nil) {
      UITextPosition *beginning = textView.beginningOfDocument;
      UITextPosition *start = theRange.start;
      UITextPosition *end = theRange.end;
      NSInteger startPos = [textView offsetFromPosition:beginning toPosition:start];
      NSInteger endPos = [textView offsetFromPosition:beginning toPosition:end];
      NSInteger length = endPos - startPos;

      return [NSDictionary dictionaryWithObjectsAndKeys:NUMINTEGER(startPos), @"location", NUMINTEGER(length), @"length", nil];
    }
  }
  return nil;
}

- (void)setSelectionFrom:(id)start to:(id)end
{
  UIView<UITextInput> *textView = (UIView<UITextInput> *)[self textWidgetView];
  if ([textView conformsToProtocol:@protocol(UITextInput)]) {
    if ([textView becomeFirstResponder] || [textView isFirstResponder]) {
      UITextPosition *beginning = textView.beginningOfDocument;
      UITextPosition *startPos = [textView positionFromPosition:beginning offset:[TiUtils intValue:start]];
      UITextPosition *endPos = [textView positionFromPosition:beginning offset:[TiUtils intValue:end]];
      UITextRange *textRange;
      textRange = [textView textRangeFromPosition:startPos toPosition:endPos];
      [textView setSelectedTextRange:textRange];
    }
  } else {
    DebugLog(@"TextWidget does not conform with UITextInput protocol. Ignore");
  }
}

#pragma mark - Titanium Internal Use Only
- (void)updateKeyboardStatus
{
  if (([[[TiApp app] controller] keyboardVisible]) && ([[[TiApp app] controller] keyboardFocusedProxy] == [self proxy])) {
    [[[TiApp app] controller] performSelector:@selector(handleNewKeyboardStatus) withObject:nil afterDelay:0.0];
  }
}

@end

#endif
