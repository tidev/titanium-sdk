/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIDASHBOARDVIEW

#import "TiUIDashboardItemProxy.h"
#import "TiUtils.h"

@implementation TiUIDashboardItemProxy

@synthesize item;

-(void)_destroy
{
	item.userData = nil;
	item.view = nil;
	RELEASE_TO_NIL(item);
	[super _destroy];
}

-(void)dealloc{
	item.userData = nil;
    item.button = nil;
	item.view = nil;
	RELEASE_TO_NIL(item);
	[super dealloc];
}

-(void)setItem:(LauncherItem*)item_
{
	if (item!=nil)
	{
		item.userData = nil;
		item.view = nil;
		RELEASE_TO_NIL(item);
	}
	item = [item_ retain];
	item.userData = self;
}

-(LauncherItem*)ensureItem
{
	if (item==nil)
	{
		item = [[LauncherItem alloc] init];
		item.userData = self;
	}
	return item;
}

-(void)setBadge:(id)value
{
	NSInteger badgeValue = [TiUtils intValue:value];
	[[self ensureItem] setBadgeValue:badgeValue];
}

-(void)setTitle:(id)value
{
	NSString* badgeValue = [TiUtils stringValue:value];
	[[self ensureItem] setTitle:badgeValue];
}

-(void)setImage:(id)value
{
	UIImage *image = [TiUtils image:value proxy:self];
	[[self ensureItem] setImage:image];
}

-(void)setSelectedImage:(id)value
{
	UIImage *image = [TiUtils image:value proxy:self];
	[[self ensureItem] setSelectedImage:image];
}

-(void)setCanDelete:(id)value
{
	BOOL canDelete = [TiUtils boolValue:value];
	[[self ensureItem] setCanDelete:canDelete];
}

#pragma mark internal

-(void)add:(id)child
{
	[super add:child];
	
	// called when we have a child, which means we want to use ourself
	// as the view
    
    // TODO: This isn't entirely accurate... doing this may cause the view to be set twice
    // because -[TiViewProxy add:] could exit early if it's not on the main thread.
    // On the other hand, blocking this to execute on the main thread only doesn't appear to work right.
    
    dispatch_async(dispatch_get_main_queue(), ^{
        LauncherItem *item_ = [self  ensureItem];
        if (item_.view==nil)
        {
            [item_ setView:[self view]];
        }
    });
}


@end

#endif