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
#import "TiViewProxy.h"
#import "TiUtils.h"
#import "Webcolor.h"
#import "ImageLoader.h"

@interface TiUITableViewRowView : UIView
{
	UIImageView *background;
}

@end


@implementation TiUITableViewRowProxy

@synthesize tableClass, table, section, row;

-(void)_destroy
{
	RELEASE_TO_NIL(tableClass);
	[super _destroy];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
	[super _initWithProperties:properties];
	self.modelDelegate = self;
}

-(NSString*)tableClass
{
	if (tableClass==nil)
	{
		// must use undefined key since class is a special 
		// property on the NSObject class
		id value = [self valueForUndefinedKey:@"className"];
		if (value==nil)
		{
			value = @"_default_";
		}
		tableClass = [value retain];
	}
	return tableClass;
}

-(void)setHeight:(id)value
{
	height = [TiUtils dimensionValue:value];
}

-(CGFloat)rowHeight:(CGRect)bounds
{
	if (TiDimensionIsPixels(height))
	{
		return height.value;
	}
	CGFloat result = 0;
	if (TiDimensionIsAuto(height))
	{
		SEL autoHeightSelector = @selector(minimumParentHeightForWidth:);
		for (TiViewProxy * proxy in self.children)
		{
			if (![proxy respondsToSelector:autoHeightSelector])
			{
				continue;
			}
			
			CGFloat newResult = [proxy minimumParentHeightForWidth:bounds.size.width];
			if (newResult > result)
			{
				result = newResult;
			}
		}
	}
	return result == 0 ? [table tableRowHeight:0] : result;
}

-(void)updateRow:(NSDictionary *)data withObject:(NSDictionary *)properties
{
	[super _initWithProperties:data];
	
	// check to see if we have a section header change, too...
	if ([data objectForKey:@"header"])
	{
		[section setValue:[data objectForKey:@"header"] forUndefinedKey:@"headerTitle"];
		// we can return since we're reloading the section, will cause the 
		// row to be repainted at the same time
	}
	if ([data objectForKey:@"footer"])
	{
		[section setValue:[data objectForKey:@"footer"] forUndefinedKey:@"footerTitle"];
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
		if ([cell.textLabel.text isEqualToString:title]==NO)
		{
			[cell.textLabel setText:title];
		}
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
	id rightImage = [self valueForKey:@"rightImage"];
	if (rightImage!=nil)
	{
		NSURL *url = [TiUtils toURL:rightImage proxy:self];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
		cell.accessoryView = [[[UIImageView alloc] initWithImage:image] autorelease];
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
		if (image!=((UIImageView*)cell.backgroundView).image)
		{
			((UIImageView*)cell.backgroundView).image = image;
		}
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
		if (image!=((UIImageView*)cell.selectedBackgroundView).image)
		{
			((UIImageView*)cell.selectedBackgroundView).image = image;
		}
	}
	else if (cell.selectedBackgroundView!=nil && [cell.selectedBackgroundView isKindOfClass:[UIImageView class]] && ((UIImageView*)cell.selectedBackgroundView).image!=nil)
	{
		cell.selectedBackgroundView = nil;
	}
	
	id selBgColor = [self valueForKey:@"selectedBackgroundColor"];
	if (selBgColor!=nil)
	{
		cell.selectedBackgroundView = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];
		cell.selectedBackgroundView.backgroundColor = UIColorWebColorNamed(selBgColor);
	}
	else if (cell.selectedBackgroundView!=nil)
	{
		cell.selectedBackgroundView.backgroundColor = nil;
	}
}

-(void)configureLeftSide:(UITableViewCell*)cell
{
	id image = [self valueForKey:@"leftImage"];
	if (image!=nil)
	{
		NSURL *url = [TiUtils toURL:image proxy:(TiProxy*)table.proxy];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
		if (cell.imageView.image!=image)
		{
			cell.imageView.image = image;
		}
	}
	else if (cell.imageView!=nil && cell.imageView.image!=nil)
	{
		cell.imageView.image = nil;
	}
}

-(void)configureIndentionLevel:(UITableViewCell*)cell
{
	cell.indentationLevel = [TiUtils intValue:[self valueForKey:@"indentionLevel"] def:0];
}

-(void)configureChildren:(UITableViewCell*)cell
{
	// this method is called when the cell is initially created
	// to be initialized. on subsequent repaints of a re-used
	// table cell, the updateChildren below will be called instead
	if (self.children!=nil)
	{
		UIView *contentView = cell.contentView;
		CGRect rect = [contentView bounds];
		CGFloat rowHeight = [self rowHeight:rect];
		if (rect.size.height < rowHeight)
		{
			rect.size.height = rowHeight;
			contentView.bounds = rect;
		}
		for (TiViewProxy *proxy in self.children)
		{
			TiUIView *view = [proxy view];
			[view insertIntoView:contentView bounds:rect];
			view.parent = self;
		}
	}
}

-(void)updateChildren:(UITableViewCell*)cell
{
	// this method is called with a cached table cell and we need
	// to cause the existing cell to be updated with any values 
	// that are different from the previous cached use of the cell.  
	// we simply do this by sending property change events to the 
	// cached cell view and then switching it's active proxy.
	// this will cause any property changes to be reflected in the 
	// cached cell (and resulting underlying UI component changes)
	// and the proxy change ensures that the new row proxy gets the
	// events now
	if (self.children!=nil)
	{
		UIView *contentView = cell.contentView;
		NSArray *subviews = [contentView subviews];
		if (subviews == nil || [subviews count]==0)
		{
			// this can happen if we're giving a reused table cell
			// but he's removed the children from it... in this 
			// case we just re-add like it was brand new
			[self configureChildren:cell];
			return;
		}
		int x = 0;
		for (size_t c=0;c<[subviews count];c++)
		{
			// since the table will insert the accessory view and 
			// other stuff in our contentView we need to check and
			// and skip non TiUIViews
			UIView *aview = [subviews objectAtIndex:c];
			if ([aview isKindOfClass:[TiUIView class]])
			{
				TiUIView* view = (TiUIView*)aview;
				TiViewProxy *proxy = [self.children objectAtIndex:x++];
				for (NSString *key in [proxy allProperties])
				{
					id oldValue = [view.proxy valueForKey:key];
					id newValue = [proxy valueForKey:key];
					if ([oldValue isEqual:newValue]==NO)
					{
						// fire any property changes that are different from the old
						// proxy to our new proxy
						[view propertyChanged:key oldValue:oldValue newValue:newValue proxy:proxy];
					}
				}
				// re-assign the view to the new proxy so the right listeners get 
				// any child view events that are fired
				// we assign ourselves as the new parent so we can be in the 
				// event propagation chain to insert row level event properties
				[proxy exchangeView:view];
				view.parent = self;
			}
		} 
	}
}

-(void)initializeTableViewCell:(UITableViewCell*)cell
{
	[self configureTitle:cell];
	[self configureLeftSide:cell];
	[self configureRightSide:cell];
	[self configureBackground:cell];
	[self configureIndentionLevel:cell];
	[self configureChildren:cell];
}

-(void)renderTableViewCell:(UITableViewCell*)cell
{
	[self configureTitle:cell];
	[self configureLeftSide:cell];
	[self configureRightSide:cell];
	[self configureBackground:cell];
	[self configureIndentionLevel:cell];
	[self updateChildren:cell];
}

-(BOOL)isAttached
{
	return table!=nil;
}

-(void)triggerRowUpdate
{
	if ([self isAttached])
	{
		TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:self animation:nil section:section.section type:TiUITableViewActionUpdateRow] autorelease];
		[table dispatchAction:action];
	}
}

-(void)childAdded:(id)child
{
	[self triggerRowUpdate];
}

-(void)childRemoved:(id)child
{
	[self triggerRowUpdate];
}

-(void)fireEvent:(NSString *)type withObject:(id)obj withSource:(id)source
{
	// merge in any row level properties for the event
	if (source!=self)
	{
		NSMutableDictionary *dict = nil;
		if (obj == nil)
		{
			dict = [NSMutableDictionary dictionary];
		}
		else
		{
			dict = [NSMutableDictionary dictionaryWithDictionary:obj];
		}
		NSInteger index = [table indexForRow:self];
		[dict setObject:NUMINT(index) forKey:@"index"];
		[dict setObject:section forKey:@"section"];
		[dict setObject:self forKey:@"row"];
		[dict setObject:self forKey:@"rowData"];
		[dict setObject:NUMBOOL(NO) forKey:@"detail"];
		[dict setObject:NUMBOOL(NO) forKey:@"searchMode"];
		obj = dict;
	}
	[super fireEvent:type withObject:obj withSource:source];
}


#pragma mark Delegate 

-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy
{
	// these properties should trigger a re-paint for the row
	static NSSet * TableViewRowProperties = nil;
	if (TableViewRowProperties==nil)
	{
		TableViewRowProperties = [[NSSet alloc] initWithObjects:
					@"title", @"backgroundColor",@"backgroundImage",
					@"leftImage",@"hasDetail",@"hasCheck",@"hasChild",	
					@"indentionLevel",
					nil];
	}
	
	
	if ([TableViewRowProperties member:key]!=nil)
	{
		[self triggerRowUpdate];
	}
}

-(BOOL)isRepositionProperty:(NSString*)key
{
	return NO;
}


@end
