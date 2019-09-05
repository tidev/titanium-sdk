/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIAlertDialogProxy.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiUtils.h>

static NSCondition *alertCondition;
static BOOL alertShowing = NO;

@implementation TiUIAlertDialogProxy

- (void)_destroy
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  RELEASE_TO_NIL(alertController);
  [super _destroy];
}

- (NSMutableDictionary *)langConversionTable
{
  return [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                  @"title", @"titleid",
                              @"ok", @"okid",
                              @"message", @"messageid",
                              @"hintText", @"hinttextid",
                              @"loginHintText", @"loginhinttextid",
                              @"passwordHintText", @"passwordhinttextid",
                              nil];
}

- (NSString *)apiName
{
  return @"Ti.UI.AlertDialog";
}

- (void)cleanup
{
  if (alertController != nil) {
    [alertCondition lock];
    alertShowing = NO;
    persistentFlag = NO;
    [alertCondition broadcast];
    [alertCondition unlock];
    [self forgetSelf];
    [self autorelease];
    RELEASE_TO_NIL_AUTORELEASE(alertController);
    [[[TiApp app] controller] decrementActiveAlertControllerCount];
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  }
}

- (void)hide:(id)args
{
  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);
  ENSURE_UI_THREAD_1_ARG(args);
  BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
  if (alertController != nil) {
    [alertController dismissViewControllerAnimated:animated
                                        completion:^{
                                          [self cleanup];
                                        }];
  }
}

- (void)show:(id)unused
{
  ENSURE_UI_THREAD_1_ARG(unused);
  [self rememberSelf];

  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(suspended:) name:kTiSuspendNotification object:nil];
  NSMutableArray *buttonNames = [self valueForKey:@"buttonNames"];
  if (buttonNames == nil || (id)buttonNames == [NSNull null]) {
    buttonNames = [[[NSMutableArray alloc] initWithCapacity:2] autorelease];
    NSString *ok = [self valueForUndefinedKey:@"ok"];
    if (ok == nil) {
      ok = @"OK";
    }
    [buttonNames addObject:ok];
  }

  persistentFlag = [TiUtils boolValue:[self valueForKey:@"persistent"] def:NO];
  cancelIndex = [TiUtils intValue:[self valueForKey:@"cancel"] def:-1];
  destructiveIndex = [TiUtils intValue:[self valueForKey:@"destructive"] def:-1];
  preferredIndex = [TiUtils intValue:[self valueForKey:@"preferred"] def:-1];

  if (cancelIndex >= [buttonNames count]) {
    cancelIndex = -1;
  }

  if (destructiveIndex >= [buttonNames count]) {
    destructiveIndex = -1;
  }

  if (preferredIndex >= [buttonNames count]) {
    preferredIndex = -1;
  }

  style = [TiUtils intValue:[self valueForKey:@"style"] def:UIAlertViewStyleDefault];

  RELEASE_TO_NIL(alertController);
  [[[TiApp app] controller] incrementActiveAlertControllerCount];

  alertController = [[UIAlertController alertControllerWithTitle:[TiUtils stringValue:[self valueForKey:@"title"]]
                                                         message:[TiUtils stringValue:[self valueForKey:@"message"]]
                                                  preferredStyle:UIAlertControllerStyleAlert] retain];
  int curIndex = 0;
  id tintColor = [self valueForKey:@"tintColor"];

  if (tintColor != nil) {
    [[alertController view] setTintColor:[[TiUtils colorValue:tintColor] color]];
  }

  // Configure the Buttons
  for (id btn in buttonNames) {
    NSString *btnName = [TiUtils stringValue:btn];
    if (!IS_NULL_OR_NIL(btnName)) {

      UIAlertActionStyle alertActionStyle;

      if (curIndex == cancelIndex) {
        alertActionStyle = UIAlertActionStyleCancel;
      } else if (curIndex == destructiveIndex) {
        alertActionStyle = UIAlertActionStyleDestructive;
      } else {
        alertActionStyle = UIAlertActionStyleDefault;
      }

      UIAlertAction *theAction = [UIAlertAction actionWithTitle:btnName
                                                          style:alertActionStyle
                                                        handler:^(UIAlertAction *action) {
                                                          [self fireClickEventWithAction:action];
                                                        }];
      [alertController addAction:theAction];
    }
    curIndex++;
  }

  if (preferredIndex >= 0) {
    [alertController setPreferredAction:[[alertController actions] objectAtIndex:preferredIndex]];
  }

  //Configure the TextFields
  if ((style == UIAlertViewStylePlainTextInput) || (style == UIAlertViewStyleSecureTextInput)) {
    [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
      textField.secureTextEntry = (style == UIAlertViewStyleSecureTextInput);
      textField.placeholder = [TiUtils stringValue:[self valueForKey:@"hintText"]];
      textField.text = [TiUtils stringValue:[self valueForKey:@"value"]];
      textField.keyboardType = [TiUtils intValue:[self valueForKey:@"keyboardType"] def:UIKeyboardTypeDefault];
      textField.returnKeyType = [TiUtils intValue:[self valueForKey:@"returnKeyType"] def:UIReturnKeyDefault];
      textField.keyboardAppearance = [TiUtils intValue:[self valueForKey:@"keyboardAppearance"] def:UIKeyboardAppearanceDefault];
    }];
  } else if ((style == UIAlertViewStyleLoginAndPasswordInput)) {
    [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
      textField.keyboardType = [TiUtils intValue:[self valueForKey:@"loginKeyboardType"] def:UIKeyboardTypeDefault];
      textField.text = [TiUtils stringValue:[self valueForKey:@"loginValue"]];
      textField.returnKeyType = [TiUtils intValue:[self valueForKey:@"loginReturnKeyType"] def:UIReturnKeyNext];
      textField.keyboardAppearance = [TiUtils intValue:[self valueForKey:@"keyboardAppearance"] def:UIKeyboardAppearanceDefault];
      textField.placeholder = [TiUtils stringValue:[self valueForKey:@"loginHintText"]] ?: NSLocalizedString(@"Login", @"Login");
    }];
    [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
      textField.keyboardType = [TiUtils intValue:[self valueForKey:@"passwordKeyboardType"] def:UIKeyboardTypeDefault];
      textField.text = [TiUtils stringValue:[self valueForKey:@"passwordValue"]];
      textField.returnKeyType = [TiUtils intValue:[self valueForKey:@"passwordReturnKeyType"] def:UIReturnKeyDone];
      textField.keyboardAppearance = [TiUtils intValue:[self valueForKey:@"keyboardAppearance"] def:UIKeyboardAppearanceDefault];
      textField.placeholder = [TiUtils stringValue:[self valueForKey:@"passwordHintText"]] ?: NSLocalizedString(@"Password", @"Password");
      textField.secureTextEntry = YES;
    }];
  }

  [self retain];
  [[TiApp app] showModalController:alertController animated:YES];
}

- (void)suspended:(NSNotification *)note
{
  if (!persistentFlag) {
    [self hide:[NSDictionary dictionaryWithObject:NUMBOOL(NO) forKey:@"animated"]];
  }
}

- (void)fireClickEventWithAction:(UIAlertAction *)theAction
{
  if ([self _hasListeners:@"click"]) {
    NSUInteger indexOfAction = [[alertController actions] indexOfObject:theAction];

    NSMutableDictionary *event = [NSMutableDictionary dictionaryWithDictionary:@{
      @"index" : NUMUINTEGER(indexOfAction),
      @"cancel" : NUMINTEGER(cancelIndex),
      @"destructive" : NUMINTEGER(destructiveIndex),
      @"preferred" : NUMINTEGER(preferredIndex),
    }];

    if (style == UIAlertViewStylePlainTextInput || style == UIAlertViewStyleSecureTextInput) {
      NSString *theText = [[[alertController textFields] objectAtIndex:0] text];
      [event setObject:(IS_NULL_OR_NIL(theText) ? @"" : theText) forKey:@"text"];
    } else if (style == UIAlertViewStyleLoginAndPasswordInput) {
      NSArray *textFields = [alertController textFields];
      for (UITextField *theField in textFields) {
        NSString *theText = [theField text];
        [event setObject:(IS_NULL_OR_NIL(theText) ? @"" : theText) forKey:([theField isSecureTextEntry] ? @"password" : @"login")];
      }
    }
    TiThreadPerformOnMainThread(^{
      [self fireEvent:@"click" withObject:event];
      [self cleanup];
    },
        YES);
  } else {
    [self cleanup];
  }
}

- (void)setPlaceholder:(id)value
{
  DEPRECATED_REPLACED(@"UI.AlertDialog.placeholder", @"5.4.0", @"UI.AlertDialog.hintText");
  [self setValue:value forKey:@"hintText"];
}

- (void)setLoginPlaceholder:(id)value
{
  DEPRECATED_REPLACED(@"UI.AlertDialog.loginPlaceholder", @"5.4.0", @"UI.AlertDialog.loginHintText");
  [self setValue:value forKey:@"loginHintText"];
}

- (void)setPasswordPlaceholder:(id)value
{
  DEPRECATED_REPLACED(@"UI.AlertDialog.passwordPlaceholder", @"5.4.0", @"UI.AlertDialog.passwordHintText");
  [self setValue:value forKey:@"passwordHintText"];
}
@end
