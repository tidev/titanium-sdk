/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import "TiUITableViewRowProxy.h"
#import "TiUITableViewAction.h"
#import "TiUITableViewSectionProxy.h"
#import "TiUITableView.h"
#import "TiViewProxy.h"
#import "TiUtils.h"
#import "Webcolor.h"
#import "ImageLoader.h"

NSString * const defaultRowTableClass = @"_default_";

// used as a marker interface

@interface TiUITableViewRowContainer : UIView
{
	TiProxy * hitTarget;
}
@property(nonatomic,retain,readwrite) TiProxy * hitTarget;
-(void)clearHitTarget;

@end

TiProxy * DeepScanForProxyOfViewContainingPoint(UIView * targetView, CGPoint point)
{
	if (!CGRectContainsPoint([targetView bounds], point))
	{
		return nil;
	}
	for (UIView * subView in [targetView subviews])
	{
		TiProxy * subProxy = DeepScanForProxyOfViewContainingPoint(subView,[targetView convertPoint:point toView:subView]);
		if (subProxy != nil)
		{
			return subProxy;
		}
	}

	//By now, no subviews have claimed ownership.
	if ([targetView respondsToSelector:@selector(proxy)])
	{
		return [(TiUIView *)targetView proxy];
	}
	return nil;
}

@implementation TiUITableViewRowContainer
@synthesize hitTarget;

-(void)clearHitTarget
{
	[hitTarget autorelease];
	hitTarget = nil;
}

-(TiProxy *)hitTarget
{
	TiProxy * result = hitTarget;
	[self clearHitTarget];
	return result;
}

- (UIView *)hitTest:(CGPoint) point withEvent:(UIEvent *)event 
{
    UIView * result = [super hitTest:point withEvent:event];

	if (result==nil)
	{
		[self setHitTarget:DeepScanForProxyOfViewContainingPoint(self,point)];
		return nil;
	}

	if ([result respondsToSelector:@selector(proxy)])
	{
		[self setHitTarget:[(TiUIView *)result proxy]];
	}
	else
	{
		[self clearHitTarget];
	}

	return result;
}

- (void) dealloc
{
	[self clearHitTarget];
	[super dealloc];
}


@end


@implementation TiUITableViewRowProxy

@synthesize tableClass, table, section, row, callbackCell;

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
			value = defaultRowTableClass;
		}
		tableClass = [value retain];
	}
	return tableClass;
}

-(void)setHeight:(id)value
{
	height = [TiUtils dimensionValue:value];
	[self replaceValue:value forKey:@"height" notification:YES];
}

-(void)setLayout:(id)value
{
	layoutProperties.layout = TiLayoutRuleFromObject(value);
	[self replaceValue:value forKey:@"layout" notification:YES];
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
		result = [self autoHeightForWidth:bounds.size.width];
	}
	return result == 0 ? [table tableRowHeight:0] : result;
}

-(void)updateRow:(NSDictionary *)data withObject:(NSDictionary *)properties
{
	modifyingRow = YES;
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
	modifyingRow = NO;
}

-(void)configureTitle:(UITableViewCell*)cell
{
	UILabel * textLabel = [cell textLabel];

	NSString *title = [self valueForKey:@"title"];
	if (title!=nil)
	{
		[textLabel setText:title]; //UILabel already checks to see if it hasn't changed.
		
		UIColor * textColor = [[TiUtils colorValue:[self valueForKey:@"color"]] _color];
		[textLabel setTextColor:(textColor==nil)?[UIColor blackColor]:textColor];
		
		UIColor * selectedTextColor = [[TiUtils colorValue:[self valueForKey:@"selectedColor"]] _color];
		[textLabel setHighlightedTextColor:(selectedTextColor==nil)?[UIColor whiteColor]:selectedTextColor];	
	}
	else
	{
		[textLabel setText:nil];
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

-(void)configureSelectionStyle:(UITableViewCell*)cell
{
	id value = [self valueForKey:@"selectionStyle"];
	if (value!=nil)
	{
		cell.selectionStyle = [TiUtils intValue:value];
	}
	else
	{
		cell.selectionStyle = UITableViewCellSelectionStyleBlue;
	}
}

-(UIView *)parentViewForChild:(TiViewProxy *)child
{
	return rowContainerView;
}

-(BOOL)viewAttached
{
	return rowContainerView != nil;
}

-(BOOL)canHaveControllerParent
{
	return NO;
}

-(void)redelegateViews:(TiViewProxy *)proxy toView:(UIView *)touchDelegate;
{
	[[proxy view] setTouchDelegate:touchDelegate];
	for (TiViewProxy * childProxy in [proxy children])
	{
		[self redelegateViews:childProxy toView:touchDelegate];
	}
}

-(void)configureChildren:(UITableViewCell*)cell
{
	// this method is called when the cell is initially created
	// to be initialized. on subsequent repaints of a re-used
	// table cell, the updateChildren below will be called instead
	[self lockChildrenForReading];
	if (self.children!=nil)
	{
//		CGRect cellFrame = [cell frame];
//		CGFloat rowHeight = [self rowHeight:cellFrame];
//		cellFrame.size.height = rowHeight;
//		[cell setFrame:cellFrame];
	
		UIView *contentView = cell.contentView;
		CGRect rect = [contentView frame];
		CGFloat rowHeight = [self rowHeight:rect];
		if (rect.size.height < rowHeight)
		{
			rect.size.height = rowHeight;
			contentView.frame = rect;
		}
		rect.origin = CGPointZero;
		[rowContainerView release];
		rowContainerView = [[TiUITableViewRowContainer alloc] initWithFrame:rect];
		[rowContainerView setBackgroundColor:[UIColor clearColor]];
		[rowContainerView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		
		for (TiViewProxy *proxy in self.children)
		{
			TiUIView *uiview = [proxy view];
			uiview.parent = self;
			[self redelegateViews:proxy toView:contentView];
			[rowContainerView addSubview:uiview];
		}
		[self layoutChildren];
		[contentView addSubview:rowContainerView];
	}
	[self unlockChildren];
}

-(void)reproxyChildren:(TiViewProxy*)proxy 
				  view:(TiUIView*)uiview 
				parent:(TiViewProxy*)newParent
		 touchDelegate:(id)touchDelegate
{
	TiViewProxy * oldProxy = [uiview proxy];

	[uiview transferProxy:proxy];
	
	// because proxies can have children, we need to recursively do this
	[proxy lockChildrenForReading];
	NSArray *children_ = proxy.children;
	if (children_!=nil && [children_ count]>0)
	{
		[oldProxy lockChildrenForReading];
		NSArray * oldProxyChildren = [oldProxy children];

		if ([oldProxyChildren count] != [children_ count])
		{
			NSLog(@"[WARN] looks like we have a different table cell layout than expected.  Make sure you set the 'className' property of the table row when you have different cell layouts");
			NSLog(@"[WARN] if you don't fix this, your tableview will suffer performance issues and also will not render properly");
			[oldProxy unlockChildren];
			[proxy unlockChildren];
			return;
		}
		int c = 0;
		NSEnumerator * oldChildrenEnumator = [oldProxyChildren objectEnumerator];
		for (TiViewProxy* child in children_)
		{
			TiViewProxy * oldChild = [oldChildrenEnumator nextObject];
			if (![oldChild viewAttached])
			{
				NSLog(@"[WARN] Orphaned child found during proxy transfer!");
			}
			//Todo: We should probably be doing this only if the view is attached,
			//And something else entirely if the view wasn't attached.
			[self reproxyChildren:child 
							 view:[oldChild view]
						   parent:proxy touchDelegate:nil];

		}
		[oldProxy unlockChildren];
	}
	[proxy unlockChildren];
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
	[self lockChildrenForReading];
		BOOL emptyChildren = [[self children] count] == 0;
	[self unlockChildren];
	
	if (emptyChildren)
	{
		return;
	}
	
	UIView *contentView = cell.contentView;
	NSArray *subviews = [contentView subviews];
	if (contentView==nil || [subviews count]==0)
	{
		// this can happen if we're giving a reused table cell
		// but he's removed the children from it... in this 
		// case we just re-add like it was brand new
		[self configureChildren:cell];
		return;
	}
	BOOL found = NO;
	for (UIView *aview in subviews)
	{
		// since the table will insert the accessory view and 
		// other stuff in our contentView we need to check and
		// and skip non TiUIViews
		if ([aview isKindOfClass:[TiUITableViewRowContainer class]])
		{
			NSArray *subviews = [aview subviews];
			// this can happen because the cell dropped our views
			if ([subviews count]==0)
			{
				[aview removeFromSuperview];
				[self configureChildren:cell];
				return;
			}
			[rowContainerView release];
			rowContainerView = [aview retain];
			[self lockChildrenForReading];
				for (size_t x=0;x<[subviews count];x++)
				{
					TiViewProxy *proxy = [self.children objectAtIndex:x];
					TiUIView *uiview = [subviews objectAtIndex:x];
					[self reproxyChildren:proxy view:uiview parent:self touchDelegate:contentView];
				}
				[self layoutChildren];
			[self unlockChildren];
			found = YES;
			// once we find the container we can break
			break;
		}
	} 
	if (found==NO)
	{
		// this probably happens if a developer specified the same
		// row but the layout is different and they're trying to reuse
		// it -- in this case, we're just going to reconfig
		
		// at least warn the user
		NSLog(@"[WARN] looks like we have a different table cell layout than expected.  Make sure you set the 'className' property of the table row when you have different cell layouts");
		NSLog(@"[WARN] if you don't fix this, your tableview will suffer performance issues");
		
		// change the classname so at least we don't too much of a performance
		// hit on subsequent repaints
		RELEASE_TO_NIL(tableClass);
		tableClass = [[NSString stringWithFormat:@"%d",[self hash]] retain];
		
		// now force a repaint by reconfiguring this cell
		for (UIView *v in subviews)
		{
			[v removeFromSuperview];
		}
		
		[self configureChildren:cell];
		return;
	}
}

-(void)initializeTableViewCell:(UITableViewCell*)cell
{
	modifyingRow = YES;
	[self configureTitle:cell];
	[self configureLeftSide:cell];
	[self configureRightSide:cell];
	[self configureBackground:cell];
	[self configureIndentionLevel:cell];
	[self configureSelectionStyle:cell];
	[self configureChildren:cell];
	modifyingRow = NO;

	NSString * cellReuseIdent = [cell reuseIdentifier];
	NSLog(@"[WARN] Table row %X classNames: '%@' vs '%@'",cell,cellReuseIdent,[self tableClass]);

}

-(void)renderTableViewCell:(UITableViewCell*)cell
{
	modifyingRow = YES;
	[self configureTitle:cell];
	[self configureLeftSide:cell];
	[self configureRightSide:cell];
	[self configureBackground:cell];
	[self configureIndentionLevel:cell];
	[self configureSelectionStyle:cell];

	NSString * cellReuseIdent = [cell reuseIdentifier];

	if([cellReuseIdent isEqual:defaultRowTableClass])
	{
		//We can make no assumptions when a class is not specified.
		for (UIView * oldView in [[cell contentView] subviews])
		{
			if ([oldView isKindOfClass:[TiUITableViewRowContainer class]])
			{
				[oldView removeFromSuperview];
			}
		}
		[self configureChildren:cell];
	}
	else
	{
//		if (![cellReuseIdent isEqualToString:[self tableClass]])
		{
			NSLog(@"[WARN] Table row %X classNames: '%@' vs '%@'",cell,cellReuseIdent,[self tableClass]);
		}
	
		[self updateChildren:cell];
	}
	modifyingRow = NO;
}

-(BOOL)isAttached
{
	return (table!=nil) && ([self parent]!=nil);
}

-(void)triggerRowUpdate
{
	if ([self isAttached] && !modifyingRow)
	{
		TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:self animation:nil section:section.section type:TiUITableViewActionRowReload] autorelease];
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

-(void)childWillResize:(TiViewProxy *)child
{
	[self triggerRowUpdate];
}

-(TiProxy *)touchedViewProxyInCell:(UITableViewCell *)targetCell
{
	for (TiUITableViewRowContainer * thisContainer in [[targetCell contentView] subviews])
	{
		if ([thisContainer isKindOfClass:[TiUITableViewRowContainer class]])
		{
			TiProxy * result = [thisContainer hitTarget];
			if (result != nil)
			{
				return result;
			}
		}
	}
	return self;
}

-(id)createEventObject:(id)initialObject
{
	NSMutableDictionary *dict = nil;
	if (initialObject == nil)
	{
		dict = [NSMutableDictionary dictionary];
	}
	else
	{
		dict = [NSMutableDictionary dictionaryWithDictionary:initialObject];
	}
	NSInteger index = [table indexForRow:self];
	[dict setObject:NUMINT(index) forKey:@"index"];
	[dict setObject:section forKey:@"section"];
	[dict setObject:self forKey:@"row"];
	[dict setObject:self forKey:@"rowData"];
	[dict setObject:NUMBOOL(NO) forKey:@"detail"];
	[dict setObject:NUMBOOL(NO) forKey:@"searchMode"];
	
	return dict;
}

-(void)fireEvent:(NSString *)type withObject:(id)obj withSource:(id)source propagate:(BOOL)propagate
{
	// merge in any row level properties for the event
	if (source!=self)
	{
		obj = [self createEventObject:obj];
	}
	[callbackCell handleEvent:type];
	[super fireEvent:type withObject:obj withSource:source propagate:propagate];
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
					@"indentionLevel",@"selectionStyle",@"color",@"selectedColor",
					@"height",@"width",
					nil];
	}
	
	if ([TableViewRowProperties member:key]!=nil)
	{
		[self triggerRowUpdate];
	}
}


@end

#endif