/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITEXTFIELD

#import "TiUITextFieldProxy.h"
#import "TiUITextField.h"

@implementation TiUITextFieldProxy

#pragma mark Defaults

DEFINE_DEF_PROP(value, @"");
DEFINE_DEF_BOOL_PROP(enabled, YES);
DEFINE_DEF_BOOL_PROP(enableReturnKey, NO);
DEFINE_DEF_BOOL_PROP(editable, YES);
DEFINE_DEF_BOOL_PROP(autocorrect, NO);
DEFINE_DEF_BOOL_PROP(clearOnEdit, NO);
DEFINE_DEF_BOOL_PROP(passwordMask, NO);
DEFINE_DEF_NULL_PROP(backgroundImage);
DEFINE_DEF_NULL_PROP(backgroundDisabledImage);
DEFINE_DEF_NULL_PROP(color);
DEFINE_DEF_NULL_PROP(font);
DEFINE_DEF_NULL_PROP(hintText);
DEFINE_DEF_NULL_PROP(leftButton);
DEFINE_DEF_NULL_PROP(rightButton);
DEFINE_DEF_NULL_PROP(keyboardToolbar);
DEFINE_DEF_NULL_PROP(keyboardToolbarColor);
DEFINE_DEF_INT_PROP(keyboardToolbarHeight, 0);
DEFINE_DEF_INT_PROP(textAlign, NSTextAlignmentLeft);
DEFINE_DEF_INT_PROP(verticalAlign, UIControlContentVerticalAlignmentCenter);
DEFINE_DEF_INT_PROP(returnKeyType, UIReturnKeyDefault);
DEFINE_DEF_INT_PROP(keyboardType, UIKeyboardTypeDefault);
DEFINE_DEF_INT_PROP(borderStyle, UITextBorderStyleLine);
DEFINE_DEF_INT_PROP(clearButtonMode, UITextFieldViewModeNever);
DEFINE_DEF_INT_PROP(leftButtonMode, UITextFieldViewModeNever);
DEFINE_DEF_INT_PROP(rightButtonMode, UITextFieldViewModeNever);
DEFINE_DEF_INT_PROP(keyboardAppearance, UIKeyboardAppearanceDefault);
DEFINE_DEF_INT_PROP(autocapitalization, UITextAutocapitalizationTypeNone);
DEFINE_DEF_INT_PROP(maxLength, -1);

- (NSString *)apiName
{
  return @"Ti.UI.TextField";
}

- (NSMutableDictionary *)langConversionTable
{
  return [NSMutableDictionary dictionaryWithObjectsAndKeys:@"hintText", @"hinttextid", nil];
}

@end

#endif
