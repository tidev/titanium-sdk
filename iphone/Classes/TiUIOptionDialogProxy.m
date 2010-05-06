/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIOPTIONDIALOG

#import "TiUIOptionDialogProxy.h"
#import "TiUtils.h"
#import "TitaniumApp.h"
#import "TiToolbar.h"
#import "TiToolbarButton.h"
#import	"TiTab.h"

@implementation TiUIOptionDialogProxy

-(void)show:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
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
	
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	UIView *view = nil;
	TiViewProxy *proxy = [args objectForKey:@"view"];
	if (proxy==nil)
	{
		view = [[TitaniumApp app] controller].view;
	}
	else 
	{
		//TODO: need to deal with button in a Toolbar which will have a nil view
		
		BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
		if ([proxy supportsNavBarPositioning] && [proxy isUsingBarButtonItem])
		{
			UIBarButtonItem *button = [proxy barButtonItem];
			[actionSheet showFromBarButtonItem:button animated:animated];
			return;
		}
		else if ([proxy isKindOfClass:[TiToolbar class]])
		{
			UIToolbar *toolbar = [(TiToolbar*)proxy toolbar];
			[actionSheet showFromToolbar:toolbar];
			return;
		}
		else if ([proxy conformsToProtocol:@protocol(TiTab)])
		{
			id<TiTab> tab = (id<TiTab>)proxy;
			UITabBar *tabbar = [[tab tabGroup] tabbar];
			[actionSheet showFromTabBar:tabbar];
			return;
		}
		else
		{
			id obj = [args objectForKey:@"rect"];
			if (obj!=nil)
			{
				CGRect rect = [TiUtils rectValue:obj];
				[actionSheet showFromRect:rect inView:[proxy view] animated:animated];
				return;
			}
			view = [proxy view];
		}
	}
	[actionSheet showInView:view];
#else
	[actionSheet showInView:[[TitaniumApp app] window]];
#endif
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

#endif
