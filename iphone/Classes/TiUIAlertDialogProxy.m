/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIAlertDialogProxy.h"
#import "TiUtils.h"

static NSCondition* alertCondition;
static BOOL alertShowing = NO;

@implementation TiUIAlertDialogProxy

-(void)show:(id)args
{
	if (alertCondition==nil)
	{
		alertCondition = [[NSCondition alloc] init];
	}
	
	// prevent more than one JS thread from showing an alert box at a time
	if ([NSThread isMainThread]==NO)
	{
		[alertCondition lock];
		if (alertShowing)
		{
			[alertCondition wait];
		}
		alertShowing = YES;
		[alertCondition unlock];
		
		// alert show should block the JS thread like the browser
		[self performSelectorOnMainThread:@selector(show:) withObject:args waitUntilDone:YES];
	}
	else
	{
		NSMutableArray *buttonNames = [self valueForKey:@"buttonNames"];
		if (buttonNames==nil || (id)buttonNames == [NSNull null])
		{
			buttonNames = [[[NSMutableArray alloc] initWithCapacity:2] autorelease];
			[buttonNames addObject:NSLocalizedString(@"OK",@"Alert OK Button")];
		}
		
		UIAlertView *alert = [[UIAlertView alloc] initWithTitle:[TiUtils stringValue:[self valueForKey:@"title"]]
												message:[TiUtils stringValue:[self valueForKey:@"message"]] 
												delegate:self cancelButtonTitle:nil otherButtonTitles:nil];
		for (id btn in buttonNames)
		{
			NSString * thisButtonName = [TiUtils stringValue:btn];
			[alert addButtonWithTitle:thisButtonName];
		}

		[alert setCancelButtonIndex:[TiUtils intValue:[self valueForKey:@"cancel"] def:-1]];
		
		[self retain];
		[alert show];
		
		RELEASE_TO_NIL(alert);
	}
}

#pragma mark AlertView Delegate

- (void)alertView:(UIAlertView *)alertView didDismissWithButtonIndex:(NSInteger)buttonIndex
{
	[alertCondition lock];
	alertShowing = NO;
	[alertCondition broadcast];
	[alertCondition unlock];
	[self autorelease];
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
	if ([self _hasListeners:@"click"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
							   [NSNumber numberWithInt:buttonIndex],@"index",
							   [NSNumber numberWithInt:[alertView cancelButtonIndex]],@"cancel",
							   nil];
		[self fireEvent:@"click" withObject:event];
	}
}

@end
