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
	[super dealloc];
}

-(NSMutableDictionary*)langConversionTable
{
    return [NSMutableDictionary dictionaryWithObject:@"title" forKey:@"titleid"];
}

-(void)show:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	[self rememberSelf];
	ENSURE_UI_THREAD(show,args);

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(suspended:) name:kTiSuspendNotification object:nil];

	showDialog = YES;
	NSMutableArray *options = [self valueForKey:@"options"];
	if (options==nil)
	{
		options = [[[NSMutableArray alloc] initWithCapacity:2] autorelease];
		[options addObject:NSLocalizedString(@"OK",@"Alert OK Button")];
	}

    persistentFlag = [TiUtils boolValue:[self valueForKey:@"persistent"] def:YES];

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

	[actionSheet setCancelButtonIndex:[TiUtils intValue:[self valueForKey:@"cancel"] def:-1]];
	[actionSheet setDestructiveButtonIndex:[TiUtils intValue:[self valueForKey:@"destructive"] def:-1]];

	[self retain];

	if ([TiUtils isIPad])
	{
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
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(deviceRotationBegan:) name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
		[self updateOptionDialogNow];
		return;
	}
	[actionSheet showInView:[[TiApp app] topMostView]];
}

-(void)completeWithButton:(int)buttonIndex
{
    if (showDialog) {
        showDialog = NO;
        if ([self _hasListeners:@"click"])
        {
            NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                                   [NSNumber numberWithInt:buttonIndex],@"index",
                                   [NSNumber numberWithInt:[actionSheet cancelButtonIndex]],@"cancel",
                                   [NSNumber numberWithInt:[actionSheet destructiveButtonIndex]],@"destructive",
                                   nil];
            [self fireEvent:@"click" withObject:event];
        }
        [[NSNotificationCenter defaultCenter] removeObserver:self];
        [self forgetSelf];
        [self release];
    }
}

-(void)hide:(id)args
{
	if(actionSheet == nil || !showDialog){
		return;
	}

	id options = nil;
	if ([args count]>0) {
		options = [args objectAtIndex:0];
	}
	BOOL animatedhide = [TiUtils boolValue:@"animated" properties:options def:YES];

    TiThreadPerformOnMainThread(^{
        if ([actionSheet isVisible]) {
            [actionSheet dismissWithClickedButtonIndex:[actionSheet cancelButtonIndex] animated:animatedhide];
        }
        else if(showDialog) {
            [self completeWithButton:[actionSheet cancelButtonIndex]];
        }
    }, NO);
}

-(void)suspended:(NSNotification*)note
{
    if (!persistentFlag) {
        [self hide:[NSArray arrayWithObject: [NSDictionary dictionaryWithObject:NUMBOOL(NO) forKey:@"animated"]]];
    }
}

#pragma mark AlertView Delegate

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
