/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIOptionDialogProxy.h"
#import "TiUtils.h"
#import "TitaniumApp.h"

@implementation TiUIOptionDialogProxy

-(void)show:(id)args
{
	ENSURE_UI_THREAD(show,args);
	
	NSMutableArray *options = [self valueForKey:@"options"];
	if (options==nil)
	{
		options = [[[NSMutableArray alloc] initWithCapacity:2] autorelease];
		[options addObject:NSLocalizedString(@"OK",@"Alert OK Button")];
	}
	
	UIActionSheet *actionSheet = [[[UIActionSheet alloc] init] autorelease];
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
	[actionSheet showInView:[[TitaniumApp app] window]];
}

#pragma mark AlertView Delegate

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	if ([self _hasListeners:@"click"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
							   [NSNumber numberWithInt:buttonIndex],@"index",
							   [NSNumber numberWithInt:[actionSheet cancelButtonIndex]],@"cancel",
							   [NSNumber numberWithInt:[actionSheet destructiveButtonIndex]],@"destructive",
							   nil];
		[self fireEvent:@"click" withObject:event];
	}
	[self release];
}

@end
