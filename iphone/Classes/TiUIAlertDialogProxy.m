/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIAlertDialogProxy.h"
#import "TiUtils.h"

@implementation TiUIAlertDialogProxy

-(void)_destroy
{
	// we release our reteain in the show below but then
	// set it to nil so that our subclass doesn't jack with it
	RELEASE_TO_NIL(alert);
	[super _destroy];
}

-(void)show:(id)args
{
	RELEASE_TO_NIL(alert);
	
	ENSURE_UI_THREAD(show,args);
	
	NSMutableArray *buttonNames = [self valueForKey:@"buttonNames"];
	if (buttonNames==nil || (id)buttonNames == [NSNull null])
	{
		buttonNames = [[[NSMutableArray alloc] initWithCapacity:2] autorelease];
		[buttonNames addObject:NSLocalizedString(@"OK",@"Alert OK Button")];
	}
	
	alert = [[UIAlertView alloc] initWithTitle:[TiUtils stringValue:[self valueForKey:@"title"]]
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
}

#pragma mark AlertView Delegate

- (void)alertView:(UIAlertView *)alertView didDismissWithButtonIndex:(NSInteger)buttonIndex
{
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
