/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITEXTFIELD

#import "TiUITextField.h"
#import "TiUITextFieldProxy.h"

#import "TiUITextWidget.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>
#ifdef USE_TI_UIATTRIBUTEDSTRING
#import "TiUIAttributedStringProxy.h"
#endif

@implementation TiTextField

@synthesize leftButtonPadding, rightButtonPadding, paddingLeft, paddingRight;

- (void)configure
{
  // defaults
  leftMode = UITextFieldViewModeAlways;
  rightMode = UITextFieldViewModeAlways;
  leftButtonPadding = 0;
  rightButtonPadding = 0;
  paddingLeft = 0;
  paddingRight = 0;
  [super setLeftViewMode:UITextFieldViewModeAlways];
  [super setRightViewMode:UITextFieldViewModeAlways];
}

- (void)dealloc
{
  RELEASE_TO_NIL(left);
  RELEASE_TO_NIL(right);
  RELEASE_TO_NIL(leftView);
  RELEASE_TO_NIL(rightView);
  [super dealloc];
}

- (void)setTouchHandler:(TiUIView *)handler
{
  //Assign only. No retain
  touchHandler = handler;
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  [touchHandler processTouchesBegan:touches withEvent:event];
  [super touchesBegan:touches withEvent:event];
}
- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
  [touchHandler processTouchesMoved:touches withEvent:event];
  [super touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  [touchHandler processTouchesEnded:touches withEvent:event];
  [super touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  [touchHandler processTouchesCancelled:touches withEvent:event];
  [super touchesCancelled:touches withEvent:event];
}

- (UIView *)newPadView:(CGFloat)width height:(CGFloat)height
{
  UIView *view = [[UIView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
  view.backgroundColor = [UIColor clearColor];
  return view;
}

- (void)updateLeftView
{
  if (left == nil) {
    left = [self newPadView:leftButtonPadding + paddingLeft height:10];
    left.frame = CGRectMake(0, 0, left.frame.size.width, left.frame.size.height);
    [super setLeftView:left];
  } else {
    CGFloat width = leftButtonPadding + paddingLeft;
    CGFloat height = 10;
    if (leftView != nil) {
      width += leftView.frame.size.width;
      height = leftView.frame.size.height;
    }
    left.frame = CGRectMake(leftButtonPadding, 0, width, height);
  }
}

- (void)updateRightView
{
  if (right == nil) {
    right = [self newPadView:rightButtonPadding + paddingRight height:10];
    right.frame = CGRectMake(0, 0, right.frame.size.width, right.frame.size.height);
    [super setRightView:right];
  } else {
    CGFloat width = rightButtonPadding + paddingRight;
    CGFloat height = 10;
    if (rightView != nil) {
      width += rightView.frame.size.width;
      height = rightView.frame.size.height;
    }
    right.frame = CGRectMake(rightButtonPadding, 0, width, height);
  }
}

- (void)setPaddingLeft:(CGFloat)left_
{
  paddingLeft = left_;
  [self updateLeftView];
}

- (void)setPaddingRight:(CGFloat)right_
{
  paddingRight = right_;
  [self updateRightView];
}

- (void)setLeftButtonPadding:(CGFloat)left_
{
  leftButtonPadding = left_;
  [self updateLeftView];
}

- (void)setRightButtonPadding:(CGFloat)right_
{
  rightButtonPadding = right_;
  [self updateRightView];
}

- (void)setSubviewVisibility:(UIView *)view hidden:(BOOL)hidden
{
  for (UIView *v in [view subviews]) {
    v.hidden = hidden;
  }
}

- (void)updateMode:(UITextFieldViewMode)mode forView:(UIView *)view
{
  switch (mode) {
  case UITextFieldViewModeNever: {
    [self setSubviewVisibility:view hidden:YES];
    break;
  }
  case UITextFieldViewModeWhileEditing: {
    [self setSubviewVisibility:view hidden:![self isEditing]];
    break;
  }
  case UITextFieldViewModeUnlessEditing: {
    [self setSubviewVisibility:view hidden:[self isEditing]];
    break;
  }
  case UITextFieldViewModeAlways:
  default: {
    [self setSubviewVisibility:view hidden:NO];
    break;
  }
  }
}

- (void)repaintMode
{
  if (left != nil) {
    [self updateMode:leftMode forView:left];
  }
  if (right != nil) {
    [self updateMode:rightMode forView:right];
  }
}

- (BOOL)resignFirstResponder
{
  if ([super resignFirstResponder]) {
    [self repaintMode];
    [touchHandler makeRootViewFirstResponder];
    return YES;
  }
  return NO;
}

- (BOOL)becomeFirstResponder
{
  if ([super becomeFirstResponder]) {
    [self repaintMode];
    return YES;
  }
  return NO;
}

- (void)setLeftView:(UIView *)value
{
  if ((value != nil) && (paddingLeft > 0.5)) {
    CGRect wrapperFrame = [value bounds];
    wrapperFrame.size.width += paddingLeft;
    UIView *wrapperView = [[UIView alloc] initWithFrame:wrapperFrame];

    CGPoint valueCenter = [value center];
    valueCenter.x += paddingLeft;
    [value setCenter:valueCenter];

    [wrapperView addSubview:value];
    value = wrapperView;
    [wrapperView autorelease];
  }

  [super setLeftView:value];
}

- (void)setRightView:(UIView *)value
{
  if ((value != nil) && (paddingRight > 0.5)) {
    CGRect wrapperFrame = [value bounds];
    wrapperFrame.size.width += paddingRight;
    UIView *wrapperView = [[UIView alloc] initWithFrame:wrapperFrame];

    [wrapperView addSubview:value];
    value = wrapperView;
    [wrapperView autorelease];
  }

  [super setRightView:value];
}

@end

@implementation TiUITextField

#pragma mark Internal

#ifndef TI_USE_AUTOLAYOUT
- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  [TiUtils setView:textWidgetView positionRect:bounds];
  [super frameSizeChanged:frame bounds:bounds];
}

#endif

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoSize];
  [self setDefaultWidth:TiDimensionAutoFill];
}
#endif

- (void)dealloc
{
  WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UITextFieldTextDidChangeNotification object:nil];
  [super dealloc];
}

- (UIView<UITextInputTraits> *)textWidgetView
{
  if (textWidgetView == nil) {
    textWidgetView = [[TiTextField alloc] init];
#ifdef TI_USE_AUTOLAYOUT
    [textWidgetView setTranslatesAutoresizingMaskIntoConstraints:NO];
#endif
    ((UITextField *)textWidgetView).delegate = self;
    ((UITextField *)textWidgetView).text = @"";
    ((UITextField *)textWidgetView).textAlignment = NSTextAlignmentLeft;
    ((UITextField *)textWidgetView).contentVerticalAlignment = UIControlContentVerticalAlignmentCenter;
    [(TiTextField *)textWidgetView configure];
    [(TiTextField *)textWidgetView setTouchHandler:self];
    [self addSubview:textWidgetView];
    self.clipsToBounds = YES;
    WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
    NSNotificationCenter *theNC = [NSNotificationCenter defaultCenter];
    [theNC addObserver:self selector:@selector(textFieldDidChange:) name:UITextFieldTextDidChangeNotification object:textWidgetView];
  }

  return textWidgetView;
}

#pragma mark Public APIs

- (void)setShowUndoRedoActions_:(id)value
{
  TiTextField *tv = (TiTextField *)[self textWidgetView];

  [[self proxy] replaceValue:value forKey:@"showUndoRedoActions" notification:NO];

  if ([TiUtils boolValue:value]) {
    tv.inputAssistantItem.leadingBarButtonGroups = self.inputAssistantItem.leadingBarButtonGroups;
    tv.inputAssistantItem.trailingBarButtonGroups = self.inputAssistantItem.trailingBarButtonGroups;
  } else {
    tv.inputAssistantItem.leadingBarButtonGroups = @[];
    tv.inputAssistantItem.trailingBarButtonGroups = @[];
  }
}

- (void)setPadding_:(id)args
{
  id _paddingLeft = [args objectForKey:@"left"];
  id _paddingRight = [args objectForKey:@"right"];

  TiTextField *tv = (TiTextField *)[self textWidgetView];

  if (_paddingLeft) {
    tv.paddingLeft = [TiUtils floatValue:_paddingLeft];
  }

  if (_paddingRight) {
    tv.paddingRight = [TiUtils floatValue:_paddingRight];
  }
}

- (void)setLeftButtonPadding_:(id)value
{
  TiTextField *tv = (TiTextField *)[self textWidgetView];
  tv.leftButtonPadding = [TiUtils floatValue:value];
}

- (void)setRightButtonPadding_:(id)value
{
  TiTextField *tv = (TiTextField *)[self textWidgetView];
  tv.rightButtonPadding = [TiUtils floatValue:value];
}

- (void)setEditable_:(id)value
{
  BOOL _trulyEnabled = ([TiUtils boolValue:value def:YES] && [TiUtils boolValue:[[self proxy] valueForUndefinedKey:@"enabled"] def:YES]);
  [(TiTextField *)[self textWidgetView] setEnabled:_trulyEnabled];
}

- (void)setEnabled_:(id)value
{
  BOOL _trulyEnabled = ([TiUtils boolValue:value def:YES] && [TiUtils boolValue:[[self proxy] valueForUndefinedKey:@"editable"] def:YES]);
  [(TiTextField *)[self textWidgetView] setEnabled:_trulyEnabled];
}

- (void)setBackgroundImage_:(id)image
{
  TiTextField *tf = (TiTextField *)[self textWidgetView];

  if (image != nil && tf.borderStyle == UITextBorderStyleRoundedRect) {
    // if you have a backround image and your border style is rounded, we
    // need to force into no border or it won't render
    [tf setBorderStyle:UITextBorderStyleNone];
  }
  [tf setBackground:[self loadImage:image]];
  self.backgroundImage = image;
}

- (void)setBackgroundDisabledImage_:(id)image
{
  [(TiTextField *)[self textWidgetView] setDisabledBackground:[self loadImage:image]];
}

- (void)setBackgroundColor_:(id)value
{
  [[self proxy] replaceValue:value forKey:@"backgroundColor" notification:NO];
  [(TiTextField *)[self textWidgetView] setBackgroundColor:[[TiUtils colorValue:value] _color]];
}

- (void)setHintText_:(id)value
{
  [(TiTextField *)[self textWidgetView] setPlaceholder:[TiUtils stringValue:value]];

  if ([[self proxy] valueForUndefinedKey:@"hintTextColor"]) {
    [self setHintTextColor_:[[self proxy] valueForUndefinedKey:@"hintTextColor"]];
  }
}

- (void)setHintTextColor_:(id)value
{
  id hintText = [[self proxy] valueForUndefinedKey:@"hintText"] ?: @"";

  NSAttributedString *placeHolder = [[NSAttributedString alloc] initWithString:[TiUtils stringValue:hintText] attributes:@{ NSForegroundColorAttributeName : [[TiUtils colorValue:value] _color] }];
  [(TiTextField *)[self textWidgetView] setAttributedPlaceholder:placeHolder];
  RELEASE_TO_NIL(placeHolder);
}

- (void)setAttributedHintText_:(id)value
{
#ifdef USE_TI_UIATTRIBUTEDSTRING
  ENSURE_SINGLE_ARG(value, TiUIAttributedStringProxy);
  [[self proxy] replaceValue:value forKey:@"attributedHintText" notification:NO];
  [(TiTextField *)[self textWidgetView] setAttributedPlaceholder:[value attributedString]];
#endif
}

- (void)setMinimumFontSize_:(id)value
{
  CGFloat newSize = [TiUtils floatValue:value];
  if (newSize < 4) {
    [(TiTextField *)[self textWidgetView] setAdjustsFontSizeToFitWidth:NO];
    [(TiTextField *)[self textWidgetView] setMinimumFontSize:0.0];
  } else {
    [(TiTextField *)[self textWidgetView] setAdjustsFontSizeToFitWidth:YES];
    [(TiTextField *)[self textWidgetView] setMinimumFontSize:newSize];
  }
}

- (void)setClearOnEdit_:(id)value
{
  [(TiTextField *)[self textWidgetView] setClearsOnBeginEditing:[TiUtils boolValue:value]];
}

- (void)setBorderStyle_:(id)value
{
  TiThreadPerformOnMainThread(^{
    [(TiTextField *)[self textWidgetView] setBorderStyle:[TiUtils intValue:value]];
  },
      NO);
}

- (void)setClearButtonMode_:(id)value
{
  [(TiTextField *)[self textWidgetView] setClearButtonMode:[TiUtils intValue:value]];
}

//TODO: rename

- (void)setLeftButton_:(id)value
{
  if ([value isKindOfClass:[TiViewProxy class]]) {
    TiViewProxy *vp = (TiViewProxy *)value;
    TiUIView *leftview = [vp view];
    [(TiTextField *)[self textWidgetView] setLeftView:leftview];
  } else {
    //TODO:
  }
}

- (void)setLeftButtonMode_:(id)value
{
  [(TiTextField *)[self textWidgetView] setLeftViewMode:[TiUtils intValue:value]];
}

- (void)setRightButton_:(id)value
{
  if ([value isKindOfClass:[TiViewProxy class]]) {
    TiViewProxy *vp = (TiViewProxy *)value;
    [(TiTextField *)[self textWidgetView] setRightView:[vp view]];
  } else {
    //TODO:
  }
}

- (void)setRightButtonMode_:(id)value
{
  [(TiTextField *)[self textWidgetView] setRightViewMode:[TiUtils intValue:value]];
}

- (void)setVerticalAlign_:(id)value
{
  if ([value isKindOfClass:[NSString class]]) {
    if ([value isEqualToString:@"top"]) {
      [(TiTextField *)[self textWidgetView] setContentVerticalAlignment:UIControlContentVerticalAlignmentTop];
    } else if ([value isEqualToString:@"middle"] || [value isEqualToString:@"center"]) {
      [(TiTextField *)[self textWidgetView] setContentVerticalAlignment:UIControlContentVerticalAlignmentCenter];
    } else {
      [(TiTextField *)[self textWidgetView] setContentVerticalAlignment:UIControlContentVerticalAlignmentBottom];
    }
  } else {
    [(TiTextField *)[self textWidgetView] setContentVerticalAlignment:[TiUtils intValue:value]];
  }
}

#pragma mark Public Method

- (BOOL)hasText
{
  TiTextField *f = (TiTextField *)[self textWidgetView];
  return [[f text] length] > 0;
}

#pragma mark UITextFieldDelegate

- (void)textFieldDidBeginEditing:(UITextField *)tf
{
  TiUITextWidgetProxy *ourProxy = (TiUITextWidgetProxy *)[self proxy];

  //TIMOB-14563. Set the right text value.
  if ([ourProxy suppressFocusEvents]) {
    NSString *theText = [ourProxy valueForKey:@"value"];
    [tf setText:theText];
  }

  [self textWidget:tf didFocusWithText:[tf text]];
  [self performSelector:@selector(textFieldDidChange:) onThread:[NSThread currentThread] withObject:nil waitUntilDone:NO];
}

#pragma mark Keyboard Delegates

- (BOOL)textFieldShouldBeginEditing:(UITextField *)textField; // return NO to disallow editing.
{
  return YES;
}

- (BOOL)textField:(UITextField *)tf shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
  //sanity check for undo bug. Does nothing if undo pressed for certain keyboardsTypes and under some conditions.
  if (range.length + range.location > [[tf text] length]) {
    return NO;
  }

  [self processKeyPressed:string];

  NSString *curText = [[tf text] stringByReplacingCharactersInRange:range withString:string];

  if ((maxLength > -1) && ([curText length] > maxLength)) {
    [self setValue_:curText];
    return NO;
  }
  return YES;
}

- (void)textFieldDidEndEditing:(UITextField *)tf
{
  [self textWidget:tf didBlurWithText:[tf text]];
  //TIMOB-18365. Value not updated when autocorrect is up and return is pressed
  [self textFieldDidChange:nil];
}

- (void)textFieldDidChange:(NSNotification *)notification
{
  TiUITextWidgetProxy *ourProxy = (TiUITextWidgetProxy *)[self proxy];

  //TIMOB-14563. This is incorrect when passowrd mark is used. Just ignore.
  if ([ourProxy suppressFocusEvents]) {
    return;
  }
  [ourProxy noteValueChange:[(UITextField *)textWidgetView text]];
}

- (BOOL)textFieldShouldEndEditing:(UITextField *)tf
{
  return YES;
}

- (BOOL)textFieldShouldClear:(UITextField *)tf
{
  // we notify proxy so he can serialize in the model
  [(TiUITextFieldProxy *)self.proxy noteValueChange:@""];
  return YES;
}

- (BOOL)textFieldShouldReturn:(UITextField *)tf
{
  if ([self.proxy _hasListeners:@"return"]) {
    [self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:[tf text] forKey:@"value"]];
  }

  if (suppressReturn) {
    [tf resignFirstResponder];
    return NO;
  }

  return YES;
}

- (CGFloat)contentWidthForWidth:(CGFloat)value
{
  return [[self textWidgetView] sizeThatFits:CGSizeMake(value, 0)].width;
}

- (CGFloat)contentHeightForWidth:(CGFloat)value
{
  return [[self textWidgetView] sizeThatFits:CGSizeMake(value, 0)].height;
}

@end

#endif
