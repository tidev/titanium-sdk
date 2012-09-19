/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIDASHBOARDVIEW

#import "TiUIDashboardView.h"
#import "TiUtils.h"
#import "TiRect.h"
#import "TiUIDashboardViewProxy.h"
#import "TiUIDashboardItemProxy.h"
#import "LauncherView.h"
#import "LauncherItem.h"
#import "LauncherButton.h"

static const NSInteger kDashboardViewDefaultRowCount = 3;
static const NSInteger kDashboardViewDefaultColumnCount = 3;

@implementation TiUIDashboardView

-(void)dealloc
{
	launcher.delegate = nil;
	if (launcher.editing)
	{
		[launcher endEditing];
	}
	RELEASE_TO_NIL(launcher);
	[super dealloc];
}

-(LauncherView*)launcher
{
	if (launcher==nil)
	{
		int rowCount = [TiUtils intValue:[self.proxy valueForKey:@"rowCount"] def:kDashboardViewDefaultRowCount];
		int columnCount = [TiUtils intValue:[self.proxy valueForKey:@"columnCount"] def:kDashboardViewDefaultColumnCount];
		launcher = [[LauncherView alloc] initWithFrame:CGRectMake(0, 0, 320, 400) 
                                          withRowCount:rowCount 
                                       withColumnCount:columnCount];
		launcher.delegate = self;
        [launcher setEditable:[[[self proxy] valueForUndefinedKey:@"editable"] boolValue]];
		[self addSubview:launcher];
	}
	return launcher;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (!CGRectIsEmpty(bounds))
	{
		[TiUtils setView:launcher positionRect:bounds];
		[launcher layoutButtons];
	}
    [super frameSizeChanged:frame bounds:bounds];
}

-(void)setEditable_:(id)args
{
    ENSURE_TYPE(args, NSNumber);
    
    if (launcher != nil) {
        [launcher setEditable:[args boolValue]];
    }
    [[self proxy] replaceValue:args forKey:@"editable" notification:NO];
}

-(void)setViewData:(id)args
{
	[self launcher];
    
    NSArray* items = [launcher items];
    for (LauncherItem* item in items) {
        [launcher removeItem:item animated:NO];
    }
	
	for (TiUIDashboardItemProxy *proxy in args)
	{
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

- (void)launcherView:(LauncherView*)launcher_ didRemoveItem:(LauncherItem*)item
{
	// update our data array
    [[self proxy] forgetProxy:item.userData];
	[self.proxy replaceValue:[launcher items] forKey:@"data" notification:NO];

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

- (void)launcherView:(LauncherView*)launcher_ willDragItem:(LauncherItem*)item
{
	NSMutableDictionary *event = [NSMutableDictionary dictionary];
	// the actual item being moved
	[event setObject:item.userData forKey:@"item"];
	
	if ([self.proxy _hasListeners:@"dragStart"])
	{	//TODO: Deprecate old event
		[self.proxy fireEvent:@"dragStart" withObject:event];
	}
	if ([item.userData _hasListeners:@"dragStart"])
	{	//TODO: Deprecate old event
		[item.userData fireEvent:@"dragStart" withObject:event];
	}
	if ([self.proxy _hasListeners:@"dragstart"])
	{
		[self.proxy fireEvent:@"dragstart" withObject:event];
	}
	if ([item.userData _hasListeners:@"dragstart"])
	{
		[item.userData fireEvent:@"dragstart" withObject:event];
	}
}

- (void)launcherView:(LauncherView*)launcher_ didDragItem:(LauncherItem*)item
{
	NSMutableDictionary *event = [NSMutableDictionary dictionary];
	// the actual item being moved
	[event setObject:item.userData forKey:@"item"];
	
	if ([self.proxy _hasListeners:@"dragEnd"])
	{	//TODO: Deprecate old event
		[self.proxy fireEvent:@"dragEnd" withObject:event];
	}
	if ([item.userData _hasListeners:@"dragEnd"])
	{	//TODO: Deprecate old event
		[item.userData fireEvent:@"dragEnd" withObject:event];
	}
	if ([self.proxy _hasListeners:@"dragend"])
	{
		[self.proxy fireEvent:@"dragend" withObject:event];
	}
	if ([item.userData _hasListeners:@"dragend"])
	{
		[item.userData fireEvent:@"dragend" withObject:event];
	}
}

- (void)launcherView:(LauncherView*)launcher_ didMoveItem:(LauncherItem*)item
{
	NSMutableDictionary *event = [NSMutableDictionary dictionary];
	// the actual item being moved
	[event setObject:item.userData forKey:@"item"];
	// the new (uncommitted) items in order
	[event setObject:[launcher items] forKey:@"items"];
	
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

- (void)launcherViewDidEndEditing:(LauncherView*)launcher_
{
	// update our data array since it's possible been reordered
	[self.proxy replaceValue:[launcher_ items] forKey:@"data" notification:NO];
	
	if ([self.proxy _hasListeners:@"commit"])
	{
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		[self.proxy fireEvent:@"commit" withObject:event];
	}
}

- (BOOL)launcherViewShouldWobble:(LauncherView *)launcher_
{
	// all the wobble effect to be turned off if required by Apple
	return [TiUtils boolValue:[self.proxy valueForUndefinedKey:@"wobble"] def:YES];
}


@end

#endif
