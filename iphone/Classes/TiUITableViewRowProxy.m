/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewRowProxy.h"
#import "TiUITableViewAction.h"
#import "TiUITableViewSectionProxy.h"
#import "TiUITableView.h"
#import "TiUtils.h"
#import "ImageLoader.h"

@implementation TiUITableViewRowProxy

@synthesize className, table, section, row;

-(void)_destroy
{
	RELEASE_TO_NIL(className);
}

-(void)_initWithProperties:(NSDictionary *)properties
{
	[super _initWithProperties:properties];
	className = [[TiUtils stringValue:@"class" properties:properties def:@"_default_"] retain];
}

-(void)updateRow:(NSDictionary *)data withObject:(NSDictionary *)properties
{
	[super _initWithProperties:data];
	
	// check to see if we have a section header change, too...
	if ([data objectForKey:@"header"])
	{
		[section setHeaderTitle:[data objectForKey:@"header"]];
		// we can return since we're reloading the section, will cause the 
		// row to be repainted at the same time
	}
	if ([data objectForKey:@"footer"])
	{
		[section setFooterTitle:[data objectForKey:@"footer"]];
		// we can return since we're reloading the section, will cause the 
		// row to be repainted at the same time
	}
	TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:self animation:properties section:section.section type:TiUITableViewActionUpdateRow] autorelease];
	[table dispatchAction:action];
}

-(void)configureTitle:(UITableViewCell*)cell
{
	NSString *title = [self valueForKey:@"title"];
	if (title!=nil)
	{
		[cell.textLabel setText:title];
	}
	else 
	{
		[cell.textLabel setText:nil];
	}
}

-(void)configureRightSide:(UITableViewCell*)cell
{
	BOOL hasChild = [TiUtils boolValue:[self valueForKey:@"hasChild"] def:NO];
	if (hasChild)
	{
		cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator;
	}
	else
	{
		BOOL hasDetail = [TiUtils boolValue:[self valueForKey:@"hasDetail"] def:NO];
		if (hasDetail)
		{
			cell.accessoryType = UITableViewCellAccessoryDetailDisclosureButton;
		}
		else
		{
			BOOL hasCheck = [TiUtils boolValue:[self valueForKey:@"hasCheck"] def:NO];
			if (hasCheck)
			{
				cell.accessoryType = UITableViewCellAccessoryCheckmark;
			}
			else
			{
				cell.accessoryType = UITableViewCellAccessoryNone;
			}
		}
	}
}

-(void)configureBackground:(UITableViewCell*)cell
{
	id bgImage = [self valueForKey:@"backgroundImage"];
	if (bgImage!=nil)
	{
		NSURL *url = [TiUtils toURL:bgImage proxy:(TiProxy*)table.proxy];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
		if ([cell.backgroundView isKindOfClass:[UIImageView class]]==NO)
		{
			UIImageView *view = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];
			cell.backgroundView = view;
		}
		((UIImageView*)cell.backgroundView).image = image;
	}
	else if (cell.backgroundView!=nil && [cell.backgroundView isKindOfClass:[UIImageView class]] && ((UIImageView*)cell.backgroundView).image!=nil)
	{
		cell.backgroundView = nil;
	}
	
	id selBgImage = [self valueForKey:@"selectedBackgroundImage"];
	if (selBgImage!=nil)
	{
		NSURL *url = [TiUtils toURL:selBgImage proxy:(TiProxy*)table.proxy];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
		if ([cell.selectedBackgroundView isKindOfClass:[UIImageView class]]==NO)
		{
			UIImageView *view = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];
			cell.selectedBackgroundView = view;
		}
		((UIImageView*)cell.selectedBackgroundView).image = image;
	}
	else if (cell.selectedBackgroundView!=nil && [cell.selectedBackgroundView isKindOfClass:[UIImageView class]] && ((UIImageView*)cell.selectedBackgroundView).image!=nil)
	{
		cell.selectedBackgroundView = nil;
	}
}

-(void)configureLeftSide:(UITableViewCell*)cell
{
	id image = [self valueForKey:@"image"];
	if (image!=nil)
	{
		NSURL *url = [TiUtils toURL:image proxy:(TiProxy*)table.proxy];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
		cell.imageView.image = image;
	}
	else if (cell.imageView!=nil && cell.imageView.image!=nil)
	{
		cell.imageView.image = nil;
	}
}

-(void)initializeTableViewCell:(UITableViewCell*)cell
{
	[self configureTitle:cell];
	[self configureLeftSide:cell];
	[self configureRightSide:cell];
	[self configureBackground:cell];
}

-(void)renderTableViewCell:(UITableViewCell*)cell
{
	[self configureTitle:cell];
	[self configureLeftSide:cell];
	[self configureRightSide:cell];
	[self configureBackground:cell];
}

@end
