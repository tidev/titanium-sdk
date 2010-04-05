/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIDashboardView.h"
#import "TiUtils.h"
#import "TiRect.h"
#import "TiUIDashboardViewProxy.h"
#import "TiUIDashboardItemProxy.h"
#import "LauncherView.h"
#import "LauncherItem.h"
#import "LauncherButton.h"

@implementation TiUIDashboardView

-(void)dealloc
{
	RELEASE_TO_NIL(launcher);
	[super dealloc];
}

-(LauncherView*)launcher
{
	if (wrapper==nil)
	{
		wrapper = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 320, 480)];
		[self addSubview:wrapper];
	}
	if (launcher==nil)
	{
		launcher = [[LauncherView alloc] initWithFrame:CGRectMake(0, 0, 320, 400)];
		launcher.delegate = self;
		[wrapper addSubview:launcher];
	}
	return launcher;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (!CGRectIsEmpty(bounds))
	{
		[TiUtils setView:wrapper positionRect:bounds];
	}
}

-(void)setData_:(id)args
{
	[self launcher];
	
	for (TiUIDashboardItemProxy *proxy in args)
	{
		ENSURE_TYPE(proxy,TiUIDashboardItemProxy);
		[launcher addItem:proxy.item animated:NO];
	}	
}

-(void)startEditing
{
	[launcher beginEditing];
}

-(void)stopEditing
{
	[launcher endEditing];
}


#pragma mark Delegates 

- (void)launcherView:(LauncherView*)launcher didAddItem:(LauncherItem*)item
{
}

- (void)launcherView:(LauncherView*)launcher didRemoveItem:(LauncherItem*)item
{
	NSMutableDictionary *event = [NSMutableDictionary dictionary];
	[event setObject:item.userData forKey:@"item"];
	
	if ([self.proxy _hasListeners:@"delete"])
	{
		[self.proxy fireEvent:@"delete" withObject:event];
	}
	if ([item.userData _hasListeners:@"delete"])
	{
		[item.userData fireEvent:@"delete" withObject:event];
	}
}

- (void)launcherView:(LauncherView*)launcher didMoveItem:(LauncherItem*)item
{
	NSMutableDictionary *event = [NSMutableDictionary dictionary];
	[event setObject:item.userData forKey:@"item"];
	if ([self.proxy _hasListeners:@"move"])
	{
		[self.proxy fireEvent:@"move" withObject:event];
	}
	if ([item.userData _hasListeners:@"move"])
	{
		[item.userData fireEvent:@"move" withObject:event];
	}
}

- (void)launcherView:(LauncherView*)launcher didSelectItem:(LauncherItem*)item
{
	NSMutableDictionary *event = [NSMutableDictionary dictionary];
	[event setObject:item.userData forKey:@"item"];
	
	// convert our location to the location within our superview
	CGRect curFrame = [self convertRect:item.button.frame toView:[self superview]];
	TiRect *rect = [[TiRect alloc] _initWithPageContext:[self.proxy pageContext]];
	[rect setRect:curFrame];
	[event setObject:rect forKey:@"location"];
	[rect release];
	
	if ([self.proxy _hasListeners:@"click"])
	{
		[self.proxy fireEvent:@"click" withObject:event];
	}
	if ([item.userData _hasListeners:@"click"])
	{
		[item.userData fireEvent:@"click" withObject:event];
	}
}

- (void)launcherViewDidBeginEditing:(LauncherView*)launcher
{
	if ([self.proxy _hasListeners:@"edit"])
	{
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		[self.proxy fireEvent:@"edit" withObject:event];
	}
}

- (void)launcherViewDidEndEditing:(LauncherView*)launcher
{
	if ([self.proxy _hasListeners:@"commit"])
	{
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		[self.proxy fireEvent:@"commit" withObject:event];
	}
}


@end
