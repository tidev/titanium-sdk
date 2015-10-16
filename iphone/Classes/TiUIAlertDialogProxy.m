/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIAlertDialogProxy.h"
#import "TiUtils.h"
#import "TiApp.h"

static NSCondition* alertCondition;
static BOOL alertShowing = NO;

@implementation TiUIAlertDialogProxy

-(void)_destroy
{
    if (alert != nil) {
        [alertCondition lock];
        alertShowing = NO;
        persistentFlag = NO;
        [alertCondition broadcast];
        [alertCondition unlock];
    }
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    RELEASE_TO_NIL(alert);
    RELEASE_TO_NIL(alertController);
    [super _destroy];
}

-(NSMutableDictionary*)langConversionTable
{
	return [NSMutableDictionary dictionaryWithObjectsAndKeys:
			@"title",@"titleid",
			@"ok",@"okid",
			@"message",@"messageid",
			nil];
}

-(NSString*)apiName
{
    return @"Ti.UI.AlertDialog";
}

-(void) cleanup
{
	if(alert != nil || alertController != nil)
	{
		[alertCondition lock];
		alertShowing = NO;
        persistentFlag = NO;
		[alertCondition broadcast];
		[alertCondition unlock];
		[self forgetSelf];
		[self autorelease];
		RELEASE_TO_NIL(alert);
		RELEASE_TO_NIL_AUTORELEASE(alertController);
		[[[TiApp app] controller] decrementActiveAlertControllerCount];
		[[NSNotificationCenter defaultCenter] removeObserver:self];
	}
}

-(void)hide:(id)args
{
    ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
    ENSURE_UI_THREAD_1_ARG(args);
    BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
    if (alert!=nil) {
        //On IOS5 sometimes the delegate does not get called when hide is called soon after show
        //So we do the cleanup here itself
		
        //Remove ourselves as the delegate. This ensures didDismissWithButtonIndex is not called on dismissWithClickedButtonIndex
        [alert setDelegate:nil];
        [alert dismissWithClickedButtonIndex:[alert cancelButtonIndex] animated:animated];
        [self cleanup];
    } else if (alertController != nil){
        [alertController dismissViewControllerAnimated:animated completion:^{
            [self cleanup];
        }];
    }
}

-(void)show:(id)args
{
	if (alertCondition==nil) {
        alertCondition = [[NSCondition alloc] init];
    }

    // prevent more than one JS thread from showing an alert box at a time
    if ([NSThread isMainThread]==NO) {
        [self rememberSelf];
		
        [alertCondition lock];
        if (alertShowing) {
            [alertCondition wait];
        }
        alertShowing = YES;
        [alertCondition unlock];
        // alert show should block the JS thread like the browser
        TiThreadPerformOnMainThread(^{[self show:args];}, YES);
    }
    else {
        persistentFlag = [TiUtils boolValue:[self valueForKey:@"persistent"] def:NO];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(suspended:) name:kTiSuspendNotification object:nil];
        NSMutableArray *buttonNames = [self valueForKey:@"buttonNames"];
        if (buttonNames==nil || (id)buttonNames == [NSNull null]) {
            buttonNames = [[[NSMutableArray alloc] initWithCapacity:2] autorelease];
            NSString *ok = [self valueForUndefinedKey:@"ok"];
            if (ok==nil) {
                ok = @"OK";
            }
            [buttonNames addObject:ok];
        }
        
        cancelIndex = [TiUtils intValue:[self valueForKey:@"cancel"] def:-1];
        destructiveIndex = [TiUtils intValue:[self valueForKey:@"destructive"] def:-1];
        
        if (cancelIndex >= [buttonNames count]) {
            cancelIndex = -1;
        }
        
        if (destructiveIndex >= [buttonNames count]) {
            destructiveIndex = -1;
        }
        
        style = [TiUtils intValue:[self valueForKey:@"style"] def:UIAlertViewStyleDefault];
        
        if ([TiUtils isIOS8OrGreater]) {
            RELEASE_TO_NIL(alertController);
            [[[TiApp app] controller] incrementActiveAlertControllerCount];
            
            alertController = [[UIAlertController alertControllerWithTitle:[TiUtils stringValue:[self valueForKey:@"title"]]
                                                                  message:[TiUtils stringValue:[self valueForKey:@"message"]]
                                                            preferredStyle:UIAlertControllerStyleAlert] retain];
            int curIndex = 0;
            
            //Configure the Buttons
            for (id btn in buttonNames) {
                NSString* btnName = [TiUtils stringValue:btn];
                if (!IS_NULL_OR_NIL(btnName)) {
                    
                    UIAlertActionStyle alertActionStyle;
                    
                    if (curIndex == cancelIndex) {
                        alertActionStyle = UIAlertActionStyleCancel;
                    } else if (curIndex == destructiveIndex) {
                        alertActionStyle = UIAlertActionStyleDestructive;
                    } else {
                        alertActionStyle  = UIAlertActionStyleDefault;
                    }

                    UIAlertAction* theAction = [UIAlertAction actionWithTitle:btnName
                                                                        style:alertActionStyle
                                                                      handler:^(UIAlertAction * action){
                                                                                [self fireClickEventWithAction:action];
                                                                                }];
                    [alertController addAction:theAction];
                }
                curIndex++;
            }
            
            //Configure the TextFields
            if ( (style == UIAlertViewStylePlainTextInput) || (style == UIAlertViewStyleSecureTextInput) ) {
                [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
                    textField.secureTextEntry = (style == UIAlertViewStyleSecureTextInput);
                    textField.placeholder = [TiUtils stringValue:[self valueForKey:@"placeholder"]] ?: @"";
                    textField.keyboardType = [TiUtils intValue:[self valueForKey:@"keyboardType"] def:UIKeyboardTypeDefault];
                    textField.returnKeyType = [TiUtils intValue:[self valueForKey:@"returnKeyType"] def:UIReturnKeyDefault];
                }];
            } else if ((style == UIAlertViewStyleLoginAndPasswordInput)) {
                [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
                    textField.keyboardType = [TiUtils intValue:[self valueForKey:@"loginKeyboardType"] def:UIKeyboardTypeDefault];
                    textField.returnKeyType = [TiUtils intValue:[self valueForKey:@"loginReturnKeyType"] def:UIReturnKeyNext];
                    textField.placeholder = [TiUtils stringValue:[self valueForKey:@"loginPlaceholder"]] ?: @"Login";
                }];
                [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
                    textField.keyboardType = [TiUtils intValue:[self valueForKey:@"passwordKeyboardType"] def:UIKeyboardTypeDefault];
                    textField.returnKeyType = [TiUtils intValue:[self valueForKey:@"passwordReturnKeyType"] def:UIReturnKeyDone];
                    textField.placeholder = [TiUtils stringValue:[self valueForKey:@"passwordPlaceholder"]] ?: @"Password";
                    textField.secureTextEntry = YES;
                }];
            }
            
            [self retain];
            [[TiApp app] showModalController:alertController animated:YES];
            
        } else {
            RELEASE_TO_NIL(alert);
            alert = [[UIAlertView alloc] initWithTitle:[TiUtils stringValue:[self valueForKey:@"title"]]
                                               message:[TiUtils stringValue:[self valueForKey:@"message"]]
                                              delegate:self cancelButtonTitle:nil otherButtonTitles:nil];
            for (id btn in buttonNames)
            {
                NSString * thisButtonName = [TiUtils stringValue:btn];
                [alert addButtonWithTitle:thisButtonName];
            }
            
            [alert setCancelButtonIndex:cancelIndex];
            
            
            [alert setAlertViewStyle:style];
            
            [self retain];
            [alert show];
        }
	}
}

-(void)suspended:(NSNotification*)note
{
    if (!persistentFlag) {
        [self hide:[NSDictionary dictionaryWithObject:NUMBOOL(NO) forKey:@"animated"]];
    }
}

-(void) fireClickEventWithAction:(UIAlertAction*)theAction
{
    if ([self _hasListeners:@"click"]) {
        NSUInteger indexOfAction = [[alertController actions] indexOfObject:theAction];
        
        NSMutableDictionary *event = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                      NUMUINTEGER(indexOfAction),@"index",
                                      [NSNumber numberWithInt:cancelIndex],@"cancel",
                                      [NSNumber numberWithInt:destructiveIndex],@"destructive",
                                      nil];
        
        
        if (style == UIAlertViewStylePlainTextInput || style == UIAlertViewStyleSecureTextInput) {
            NSString* theText = [[[alertController textFields] objectAtIndex:0] text];
            [event setObject:(IS_NULL_OR_NIL(theText) ? @"" : theText) forKey:@"text"];
        }
        else if (style == UIAlertViewStyleLoginAndPasswordInput) {
            NSArray* textFields = [alertController textFields];
            for (UITextField* theField in textFields) {
                NSString* theText = [theField text];
                [event setObject:(IS_NULL_OR_NIL(theText) ? @"" : theText) forKey:([theField isSecureTextEntry] ? @"password" : @"login")];
            }
        }
        [self fireEvent:@"click" withObject:event];
    }
    [self cleanup];
}
#pragma mark AlertView Delegate

- (void)alertView:(UIAlertView *)alertView didDismissWithButtonIndex:(NSInteger)buttonIndex
{
	[self cleanup];
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
	if ([self _hasListeners:@"click"]) {
        NSMutableDictionary *event = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                            NUMINTEGER(buttonIndex),@"index",
                            NUMINTEGER([alertView cancelButtonIndex]),@"cancel",
                            nil];

        if ([alertView alertViewStyle] == UIAlertViewStylePlainTextInput || [alertView alertViewStyle] == UIAlertViewStyleSecureTextInput) {
            NSString* theText = [[alertView textFieldAtIndex:0] text];
            [event setObject:(IS_NULL_OR_NIL(theText) ? @"" : theText) forKey:@"text"];
        }
        else if ([alertView alertViewStyle] == UIAlertViewStyleLoginAndPasswordInput) {
            NSString* theText = [[alertView textFieldAtIndex:0] text];
            [event setObject:(IS_NULL_OR_NIL(theText) ? @"" : theText) forKey:@"login"];

            // If password field never gets focus, `text` property becomes `nil`.
            NSString *password = [[alertView textFieldAtIndex:1] text];
            [event setObject:(IS_NULL_OR_NIL(password) ? @"" : password) forKey:@"password"];
        }

        [self fireEvent:@"click" withObject:event];
    }
}

-(void)alertViewCancel:(UIAlertView *)alertView
{
    if (!persistentFlag) {
        [self hide:[NSDictionary dictionaryWithObject:NUMBOOL(NO) forKey:@"animated"]];
    }
}

@end
