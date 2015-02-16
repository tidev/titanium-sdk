/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIOPTIONDIALOG

#import "TiUIOptionDialogProxy.h"
#import "TiUtils.h"
#import "TiApp.h"
#import "TiToolbar.h"
#import "TiToolbarButton.h"
#import	"TiTab.h"

@implementation TiUIOptionDialogProxy
@synthesize dialogView;

- (void) dealloc
{
	RELEASE_TO_NIL(actionSheet);
	RELEASE_TO_NIL(dialogView);
	RELEASE_TO_NIL_AUTORELEASE(alertController);
	[super dealloc];
}

-(NSMutableDictionary*)langConversionTable
{
    return [NSMutableDictionary dictionaryWithObject:@"title" forKey:@"titleid"];
}

-(NSString*)apiName
{
    return @"Ti.UI.OptionDialog";
}

-(void)show:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
    // prevent more than one JS thread from showing an alert box at a time
    if ([NSThread isMainThread]==NO) {
        [self rememberSelf];
        TiThreadPerformOnMainThread(^{[self show:args];}, YES);
        return;
    }

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(suspended:) name:kTiSuspendNotification object:nil];

	showDialog = YES;
	NSMutableArray *options = [self valueForKey:@"options"];
	if (IS_NULL_OR_NIL(options))
	{
		options = [[[NSMutableArray alloc] initWithCapacity:2] autorelease];
		[options addObject:NSLocalizedString(@"OK",@"Alert OK Button")];
	}

    forceOpaqueBackground = [TiUtils boolValue:[self valueForKey:@"opaquebackground"] def:NO];
    persistentFlag = [TiUtils boolValue:[self valueForKey:@"persistent"] def:YES];
    cancelButtonIndex = [TiUtils intValue:[self valueForKey:@"cancel"] def:-1];
    destructiveButtonIndex = [TiUtils intValue:[self valueForKey:@"destructive"] def:-1];
    if (cancelButtonIndex >= [options count]) {
        cancelButtonIndex = -1;
    }
    if (destructiveButtonIndex >= [options count]) {
        destructiveButtonIndex = -1;
    }
    

    [self setDialogView:[args objectForKey:@"view"]];
    animated = [TiUtils boolValue:@"animated" properties:args def:YES];
    id obj = [args objectForKey:@"rect"];
    if (obj!=nil)
    {
        dialogRect = [TiUtils rectValue:obj];
    }
    else
    {
        dialogRect = CGRectZero;
    }
    
    if ([TiUtils isIOS8OrGreater]) {
        RELEASE_TO_NIL(alertController);
        [[[TiApp app] controller] incrementActiveAlertControllerCount];
        alertController = [[UIAlertController alertControllerWithTitle:[TiUtils stringValue:[self valueForKey:@"title"]]
                                                               message:[TiUtils stringValue:[self valueForKey:@"message"]]
                                                        preferredStyle:UIAlertControllerStyleActionSheet] retain];
        
        int curIndex = 0;
        //Configure the Buttons
        for (id btn in options) {
            NSString* btnName = [TiUtils stringValue:btn];
            if (!IS_NULL_OR_NIL(btnName)) {
                UIAlertAction* theAction = [UIAlertAction actionWithTitle:btnName
                                                                    style:((curIndex == cancelButtonIndex) ? UIAlertActionStyleCancel : ((curIndex == destructiveButtonIndex) ? UIAlertActionStyleDestructive : UIAlertActionStyleDefault))
                                                                  handler:^(UIAlertAction * action){
                                                                      [self fireClickEventWithAction:action];
                                                                  }];
                [alertController addAction:theAction];
            }
            curIndex++;
        }
        
        if ([TiUtils isIPad] && (cancelButtonIndex == -1)) {
            UIAlertAction* theAction = [UIAlertAction actionWithTitle:@"Cancel"
                                                                style:UIAlertActionStyleCancel
                                                              handler:^(UIAlertAction * action){
                                                                  [self fireClickEventWithAction:action];
                                                              }];
            [alertController addAction:theAction];
        }
        BOOL isPopover = NO;
        
        if ([TiUtils isIPad]) {
            UIViewController* topVC = [[[TiApp app] controller] topPresentedController];
            isPopover = ( (topVC.modalPresentationStyle == UIModalPresentationPopover) && (![topVC isKindOfClass:[UIAlertController class]]) );
            /**
             ** This block commented out since it seems to have no effect on the alert controller.
             ** If you read the modalPresentationStyle after setting the value, it still shows UIModalPresentationPopover
             ** However not configuring the UIPopoverPresentationController seems to do the trick.
             ** This hack in place to conserve current behavior. Should revisit when iOS7 is dropped so that
             ** option dialogs are always presented in UIModalPresentationPopover
            if (isPopover) {
                alertController.modalPresentationStyle = UIModalPresentationCurrentContext;
                alertController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
            }
            */
        }
        /*See Comment above. Remove if condition to see difference in behavior on iOS8*/
        if (!isPopover) {
            UIPopoverPresentationController* presentationController =  alertController.popoverPresentationController;
            presentationController.permittedArrowDirections = UIPopoverArrowDirectionAny;
            presentationController.delegate = self;
        }
        
        [self retain];
        [[TiApp app] showModalController:alertController animated:animated];
        
    } else {
        if (actionSheet != nil) {
            [actionSheet setDelegate:nil];
            [actionSheet release];
        }
        actionSheet = [[UIActionSheet alloc] init];
        [actionSheet setDelegate:self];
        
        [actionSheet setTitle:[TiUtils stringValue:[self valueForKey:@"title"]]];
        
        for (id thisOption in options)
        {
            NSString * thisButtonName = [TiUtils stringValue:thisOption];
            [actionSheet addButtonWithTitle:thisButtonName];
        }
        
        
        [actionSheet setCancelButtonIndex:cancelButtonIndex];
        [actionSheet setDestructiveButtonIndex:destructiveButtonIndex];
        
        [self retain];
        
        if ([TiUtils isIPad])
        {
            [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(deviceRotationBegan:) name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
            [self updateOptionDialogNow];
            return;
        }
        [actionSheet showInView:[[TiApp app] topMostView]];
    }
}

-(void)hide:(id)args
{
    if (!showDialog) {
        return;
    }
	if (actionSheet == nil && alertController == nil){
		return;
	}

	id options = nil;
	if ([args count]>0) {
		options = [args objectAtIndex:0];
	}
	BOOL animatedhide = [TiUtils boolValue:@"animated" properties:options def:YES];

    TiThreadPerformOnMainThread(^{
        if (actionSheet != nil) {
            if ([actionSheet isVisible]) {
                [actionSheet dismissWithClickedButtonIndex:[actionSheet cancelButtonIndex] animated:animatedhide];
            }
            else if(showDialog) {
                [self completeWithButton:[actionSheet cancelButtonIndex]];
            }
        } else if (alertController != nil) {
            [alertController dismissViewControllerAnimated:animated completion:^{
                [self cleanup];
            }];
        }
    }, NO);
}

-(void)suspended:(NSNotification*)note
{
    if (!persistentFlag) {
        [self hide:[NSArray arrayWithObject: [NSDictionary dictionaryWithObject:NUMBOOL(NO) forKey:@"animated"]]];
    }
}

#pragma mark UIPopoverPresentationControllerDelegate
- (void)prepareForPopoverPresentation:(UIPopoverPresentationController *)popoverPresentationController
{
    if (dialogView != nil) {
        if ([dialogView supportsNavBarPositioning] && [dialogView isUsingBarButtonItem]) {
            UIBarButtonItem* theItem = [dialogView barButtonItem];
            if (theItem != nil) {
                popoverPresentationController.barButtonItem = [dialogView barButtonItem];
                return;
            }
        }
        
        if ([dialogView conformsToProtocol:@protocol(TiToolbar)])
        {
            UIToolbar *toolbar = [(id<TiToolbar>)dialogView toolbar];
            if (toolbar != nil) {
                popoverPresentationController.sourceView = toolbar;
                popoverPresentationController.sourceRect = [toolbar bounds];
                return;
            }
        }
        
        if ([dialogView conformsToProtocol:@protocol(TiTab)])
        {
            id<TiTab> tab = (id<TiTab>)dialogView;
            UITabBar *tabbar = [[tab tabGroup] tabbar];
            if (tabbar != nil) {
                popoverPresentationController.sourceView = tabbar;
                popoverPresentationController.sourceRect = [tabbar bounds];
                return;
            }
        }

        UIView* view = [dialogView view];
        if (view != nil) {
            popoverPresentationController.sourceView = view;
            popoverPresentationController.sourceRect = (CGRectEqualToRect(CGRectZero, dialogRect)?CGRectMake(view.bounds.size.width/2, view.bounds.size.height/2, 1, 1):dialogRect);
            return;
        }
    }
    
    //Fell through.
    UIViewController* presentingController = [alertController presentingViewController];
    popoverPresentationController.permittedArrowDirections = 0;
    popoverPresentationController.sourceView = [presentingController view];
    popoverPresentationController.sourceRect = (CGRectEqualToRect(CGRectZero, dialogRect)?CGRectMake(presentingController.view.bounds.size.width/2, presentingController.view.bounds.size.height/2, 1, 1):dialogRect);;
}

- (void)popoverPresentationController:(UIPopoverPresentationController *)popoverPresentationController willRepositionPopoverToRect:(inout CGRect *)rect inView:(inout UIView **)view
{
    //This will never be called when using bar button item
    BOOL canUseDialogRect = !CGRectEqualToRect(CGRectZero, dialogRect);
    UIView* theSourceView = *view;
    BOOL shouldUseViewBounds = ([theSourceView isKindOfClass:[UIToolbar class]] || [theSourceView isKindOfClass:[UITabBar class]]);
    
    if (shouldUseViewBounds) {
        rect->origin = CGPointMake(theSourceView.bounds.origin.x, theSourceView.bounds.origin.y);
        rect->size = CGSizeMake(theSourceView.bounds.size.width, theSourceView.bounds.size.height);
    } else if (!canUseDialogRect) {
        rect->origin = CGPointMake(theSourceView.bounds.size.width/2, theSourceView.bounds.size.height/2);
        rect->size = CGSizeMake(1, 1);
    }
    
    popoverPresentationController.sourceRect = *rect;
}

- (void)popoverPresentationControllerDidDismissPopover:(UIPopoverPresentationController *)popoverPresentationController
{
    [self cleanup];
}

#pragma mark AlertView Delegate

- (void)willPresentActionSheet:(UIActionSheet *)actionSheet_
{
    //TIMOB-15939. Workaround rendering issue on iPAD on iOS7
    if (actionSheet_ == actionSheet && forceOpaqueBackground && [TiUtils isIPad]) {
        NSArray* subviews = [actionSheet subviews];
        
        for (UIView* subview in subviews) {
            [subview setBackgroundColor:[UIColor whiteColor]];
        }
        [actionSheet setBackgroundColor:[UIColor whiteColor]];
    }
}

- (void)actionSheet:(UIActionSheet *)actionSheet_ didDismissWithButtonIndex:(NSInteger)buttonIndex;
{
	if (buttonIndex == -2)
	{
		return;
		//A -2 is used by us to indicate that this was programatically dismissed to properly
		//place the option dialog during a roation.
	}
	[self completeWithButton:buttonIndex];
}

#pragma mark Internal Use Only
-(void) fireClickEventWithAction:(UIAlertAction*)theAction
{
    if ([self _hasListeners:@"click"]) {
        NSArray *actions = [alertController actions];
        NSInteger indexOfAction = [actions indexOfObject:theAction];
        
        if ([TiUtils isIPad] && (cancelButtonIndex == -1) && (indexOfAction == ([actions count]-1)) ) {
            indexOfAction = cancelButtonIndex;
        }
        
        NSMutableDictionary *event = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                      NUMINTEGER(indexOfAction),@"index",
                                      NUMINT(cancelButtonIndex),@"cancel",
                                      NUMINT(destructiveButtonIndex),@"destructive",
                                      nil];
        
        
        [self fireEvent:@"click" withObject:event];
    }
    [self cleanup];
}

-(void)cleanup
{
    if (showDialog) {
        showDialog = NO;
        [[[TiApp app] controller] decrementActiveAlertControllerCount];
        RELEASE_TO_NIL_AUTORELEASE(alertController);
        [[NSNotificationCenter defaultCenter] removeObserver:self];
        [self forgetSelf];
        [self release];
    }
}

-(void)completeWithButton:(NSInteger)buttonIndex
{
    if (showDialog) {
        showDialog = NO;
        if ([self _hasListeners:@"click"])
        {
            NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                                   NUMINTEGER(buttonIndex),@"index",
                                   NUMINTEGER([actionSheet cancelButtonIndex]),@"cancel",
                                   NUMINTEGER([actionSheet destructiveButtonIndex]),@"destructive",
                                   nil];
            [self fireEvent:@"click" withObject:event];
        }
        [[NSNotificationCenter defaultCenter] removeObserver:self];
        [self forgetSelf];
        [self release];
    }
}


-(void)deviceRotationBegan:(NSNotification *)notification
{
    [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(updateOptionDialogNow) object:nil];
    NSTimeInterval delay = [[UIApplication sharedApplication] statusBarOrientationAnimationDuration];
    UIInterfaceOrientation nextOrientation = [[notification.userInfo objectForKey:UIApplicationStatusBarOrientationUserInfoKey] intValue];
    UIInterfaceOrientation currentOrientation = [UIApplication sharedApplication].statusBarOrientation;
    if (UIInterfaceOrientationIsPortrait(currentOrientation) == UIInterfaceOrientationIsPortrait(nextOrientation)) {
        ++accumulatedOrientationChanges; // double for a 180 degree orientation change
    }
    if (++accumulatedOrientationChanges > 1) {
        delay *= MIN(accumulatedOrientationChanges, 4);
    }
	[actionSheet dismissWithClickedButtonIndex:-2 animated:animated];
	[self performSelector:@selector(updateOptionDialogNow) withObject:nil afterDelay:delay];
}

-(void)updateOptionDialogNow;
{
	if (!showDialog) {
		return;
	}
    accumulatedOrientationChanges = 0;
	UIView *view = nil;
	if (dialogView==nil)
	{
		view = [[[[TiApp app] window] subviews] lastObject];
	}
	else 
	{
		//TODO: need to deal with button in a Toolbar which will have a nil view
		
		if ([dialogView supportsNavBarPositioning] && [dialogView isUsingBarButtonItem])
		{
			UIBarButtonItem *button = [dialogView barButtonItem];
			[actionSheet showFromBarButtonItem:button animated:animated];
			return;
		}
		
		if ([dialogView conformsToProtocol:@protocol(TiToolbar)])
		{
			UIToolbar *toolbar = [(id<TiToolbar>)dialogView toolbar];
			[actionSheet showFromToolbar:toolbar];
			return;
		}
		
		if ([dialogView conformsToProtocol:@protocol(TiTab)])
		{
			id<TiTab> tab = (id<TiTab>)dialogView;
			UITabBar *tabbar = [[tab tabGroup] tabbar];
			[actionSheet showFromTabBar:tabbar];
			return;
		}
		
		view = [dialogView view];
		CGRect rect;
		if (CGRectIsEmpty(dialogRect))
		{
			if(view == nil)
			{
				rect = CGRectZero;
			}
			else
			{
				rect = [view bounds];
			}

		}
		else
		{
			rect = dialogRect;
		}

		[actionSheet showFromRect:rect inView:view animated:animated];
		return;
	}
	[actionSheet showInView:view];
}


@end

#endif
