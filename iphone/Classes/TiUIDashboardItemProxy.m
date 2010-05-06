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
	RELEASE_TO_NIL(item);
	[super _destroy];
}

-(void)setItem:(LauncherItem*)item_
{
	if (item!=nil)
	{
		item.userData = nil;
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

@end

#endif