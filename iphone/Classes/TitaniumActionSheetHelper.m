/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TitaniumActionSheetHelper.h"
#import "TitaniumAppDelegate.h"

@implementation TitaniumActionSheetHelper
@synthesize subjectSheet, invocationDictionary;

- (void)dealloc;
{
	[subjectSheet release];
	[invocationDictionary release];
	[super dealloc];
}

- (UIActionSheet *) subjectSheet;
{
	if (subjectSheet == nil){
		subjectSheet = [[UIActionSheet alloc] init];
		[subjectSheet setDelegate:self];
	}
	return subjectSheet;
}

- (NSMutableDictionary *) invocationDictionary;
{
	if (invocationDictionary == nil) {
		invocationDictionary = [[NSMutableDictionary alloc] init];
	}
	return invocationDictionary;
}

- (NSInteger) addButton:(NSInvocation *) newInvocation title: (NSString *) newTitle;
{
	NSInteger result = [[self subjectSheet] addButtonWithTitle:newTitle];
	NSNumber * resultNumber = [NSNumber numberWithInt:result];
	if (newInvocation != nil){
		[[self invocationDictionary] setObject:newInvocation forKey:resultNumber];
	}
	return result;
}

- (NSInteger) addDestructiveButton:(NSInvocation *) newInvocation title: (NSString *) newTitle;
{
	NSInteger result=[self addButton:newInvocation title:newTitle];
	[subjectSheet setDestructiveButtonIndex:result];
	return result;
}

- (NSInteger) addCancelButton:(NSInvocation *) newInvocation title: (NSString *) newTitle;
{
	NSInteger result=[self addButton:newInvocation title:newTitle];
	[subjectSheet setCancelButtonIndex:result];
	return result;
}

- (NSInteger) addCancelButton:(NSInvocation *) newInvocation;
{
	return [self addCancelButton:newInvocation title:NSLocalizedString(@"Cancel",)];
}

- (NSInteger) addCancelButton;
{
	return [self addCancelButton:nil title:NSLocalizedString(@"Cancel",)];
}

- (void) showSheet;
{	
	//Because of the possible race conditions with viewController and view, we have to fetch this
	//in the main thread.
	NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];
	[subjectSheet showInView:[[[TitaniumAppDelegate sharedDelegate] viewController] view]];
	[pool release];
}

- (void) showSheetInMainThread;
{
	[self performSelectorOnMainThread:@selector(showSheet) withObject:nil waitUntilDone:NO];
}


- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	NSNumber * clickedNumber = [NSNumber numberWithInt:buttonIndex];
	NSInvocation * clickedInvocation = [invocationDictionary objectForKey:clickedNumber];
	if (clickedInvocation != nil){
		[clickedInvocation invoke];
	}
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:NO];
	[self autorelease];
}


@end
