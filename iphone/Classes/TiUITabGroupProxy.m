/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUITabGroupProxy.h"
#import "TiUITabProxy.h"
#import "TiUITabGroup.h"
#import "TitaniumApp.h"

@implementation TiUITabGroupProxy

-(void)dealloc
{
	RELEASE_TO_NIL(tabs);
	[super dealloc];
}

-(void)_destroy
{
	RELEASE_TO_NIL(tabs);
	[super _destroy];
}

-(TiUIView*)newView
{
	TiUITabGroup *group = [[TiUITabGroup alloc] initWithFrame:[self appFrame]];
	return group;
}

#pragma mark Public APIs

-(void)addTab:(id)tabProxy
{
	ENSURE_SINGLE_ARG(tabProxy,TiUITabProxy);
	if (tabs == nil)
	{
		tabs = [[NSMutableArray alloc] initWithCapacity:4];
	}
	[tabs addObject:tabProxy];
	[tabProxy setTabGroup:self];
	[self replaceValue:tabs forKey:@"tabs" notification:YES];
}

-(void)removeTab:(id)tabProxy
{
	ENSURE_SINGLE_ARG(tabProxy,NSObject);
	if (tabs!=nil)
	{
		if (![tabProxy isKindOfClass:[TiUITabProxy class]])
		{
			int value = [TiUtils intValue:tabProxy];
			tabProxy = [tabs objectAtIndex:value];
			if (tabProxy==nil)
			{
				[self throwException:TiExceptionRangeError subreason:@"invalid tab index" location:CODELOCATION];
			}
		}
		
		//TODO: close all the tabs and fire events
		
		[tabProxy setTabGroup:nil];
		[tabs removeObject:tabProxy];
		[self replaceValue:tabs forKey:@"tabs" notification:YES];
	}
}

-(BOOL)handleFocusEvents
{
	return NO;
}

#pragma mark Window Management

-(BOOL)_handleOpen:(id)args
{
	[(TiUITabGroup*)self.view open:args];
	return YES;
}

-(BOOL)_handleClose:(id)args
{
	TiUITabGroup *tabGroup = (TiUITabGroup*)self.view;
	if (tabGroup!=nil)
	{
		[tabGroup close:args];
	}
	return YES;
}


@end
