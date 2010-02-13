/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableView.h"
#import "TiUtils.h"
#import "Webcolor.h"
#import "WebFont.h"
#import "ImageLoader.h"
#import "TiProxy.h"

@implementation TiUITableView

#pragma mark Internal 

-(void)dealloc
{
	RELEASE_TO_NIL(sections);
	RELEASE_TO_NIL(tableview);
	[super dealloc];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (tableview!=nil)
	{
		[TiUtils setView:tableview positionRect:bounds];
	}
}

-(UITableView*)tableView
{
	if (tableview==nil)
	{
		UITableViewStyle style = [TiUtils intValue:[self.proxy valueForKey:@"style"] def:UITableViewStylePlain];
		tableview = [[UITableView alloc] initWithFrame:[self frame] style:style];
		tableview.delegate = self;
		tableview.dataSource = self;
		tableview.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
		tableview.backgroundColor = style == UITableViewStylePlain ? [UIColor whiteColor] : [UIColor groupTableViewBackgroundColor];
		tableview.opaque = YES;
		[self addSubview:tableview];
	}
	return tableview;
}

-(TiUITableViewRowProxy*)rowForIndex:(NSInteger)index section:(NSInteger*)section
{
	int current = 0;
	int row = index;
	int sectionIndex = 0;
	
	for (TiUITableViewSectionProxy *sectionProxy in sections)
	{
		int rowCount = [sectionProxy rowCount];
		if (rowCount + current > index)
		{
			if (section!=nil)
			{
				*section = sectionIndex;
			}
			return [sectionProxy rowAtIndex:row];
		}
		row -= rowCount;
		current += rowCount;
		sectionIndex++;
	}

	return nil;
}

-(void)insertRow:(TiUITableViewRowProxy*)row before:(TiUITableViewRowProxy*)before animation:(NSDictionary*)animation
{
	row.table = self;
	row.section = before.section;
	row.row = before.row;
	before.row = row.row + 1;
	NSMutableArray *rows = [row.section rows];
	[rows insertObject:row atIndex:row.row];
	TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:row animation:animation section:row.section.section type:TiUITableViewActionInsertRowBefore] autorelease];
	[self dispatchAction:action];
}

-(void)insertRow:(TiUITableViewRowProxy*)row after:(TiUITableViewRowProxy*)after animation:(NSDictionary*)animation
{
	row.table = self;
	row.section = after.section;
	row.row = after.row + 1;
	NSMutableArray *rows = [row.section rows];
	if (row.row >= [rows count])
	{
		[rows addObject:row];
	}
	else
	{
		[rows insertObject:row atIndex:row.row];
	}
	TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:row animation:animation section:row.section.section type:TiUITableViewActionInsertRowAfter] autorelease];
	[self dispatchAction:action];
}

-(void)deleteRow:(TiUITableViewRowProxy*)row animation:(NSDictionary*)animation
{
	[[row retain] autorelease];
	NSMutableArray *rows = [row.section rows];
	[rows removeObject:row];
	int c=0;
	for (TiUITableViewRowProxy *child in rows)
	{
		child.row = c;
		c++;
	}
	TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:row animation:animation section:row.section.section type:TiUITableViewActionDeleteRow] autorelease];
	[self dispatchAction:action];
}

-(void)appendRow:(TiUITableViewRowProxy*)row animation:(NSDictionary*)animation
{
	row.table = self;
	TiUITableViewSectionProxy *section = [sections objectAtIndex:[sections count]-1];
	row.section = section;
	NSMutableArray *rows = [row.section rows];
	row.row = [rows count];
	[rows addObject:row];
	TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:row animation:animation section:row.section.section type:TiUITableViewActionInsertRowAfter] autorelease];
	[self dispatchAction:action];
}

-(void)dispatchAction:(TiUITableViewAction*)action
{
	ENSURE_UI_THREAD(dispatchAction,action);
	
	UITableView *table = [self tableView];

	[table beginUpdates];
	
	switch (action.type)
	{
		case TiUITableViewActionUpdateRow:
		{
			NSIndexPath *path = [NSIndexPath indexPathForRow:action.row.row inSection:action.row.section.section];
			[tableview reloadRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:action.animation];
			break;
		}
		case TiUITableViewActionSectionReload:
		{
			NSIndexSet *path = [NSIndexSet indexSetWithIndex:action.section];
			[tableview reloadSections:path withRowAnimation:action.animation];
			break;
		}
		case TiUITableViewActionInsertRowBefore:
		case TiUITableViewActionInsertRowAfter:
		{
			NSIndexPath *path = [NSIndexPath indexPathForRow:action.row.row inSection:action.row.section.section];
			[tableview insertRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:action.animation];
			break;
		}
		case TiUITableViewActionDeleteRow:
		{
			NSIndexPath *path = [NSIndexPath indexPathForRow:action.row.row inSection:action.row.section.section];
			[tableview deleteRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:action.animation];
			break;
		}
	}
	
	[table endUpdates];
}

-(UIView*)titleViewForText:(NSString*)text footer:(BOOL)footer
{
	CGSize maxSize = CGSizeMake(320, 1000);
	UIFont *font = [[WebFont defaultBoldFont] font];
	CGSize size = [text sizeWithFont:font constrainedToSize:maxSize lineBreakMode:UILineBreakModeTailTruncation];
	
	UITableViewStyle style = [[self tableView] style];
	int x = (style==UITableViewStyleGrouped) ? 15 : 10;
	int y = 10;
	int y2 = (footer) ? 0 : 10;
	UIView *containerView = [[[UIView alloc] initWithFrame:CGRectMake(0, y, size.width, size.height+10)] autorelease];
    UILabel *headerLabel = [[[UILabel alloc] initWithFrame:CGRectMake(x, y2, size.width, size.height)] autorelease];

    headerLabel.text = text;
    headerLabel.textColor = [UIColor blackColor];
    headerLabel.shadowColor = [UIColor whiteColor];
    headerLabel.shadowOffset = CGSizeMake(0, 1);
	headerLabel.font = font;
    headerLabel.backgroundColor = [UIColor clearColor];
    [containerView addSubview:headerLabel];
	
	return containerView;
}

#pragma mark Public APIs

-(void)setBackgroundColor_:(id)arg
{
	TiColor *color = [TiUtils colorValue:arg];
	[[self tableView] setBackgroundColor:[color _color]];
}

-(void)setBackgroundImage_:(id)arg
{
	NSURL *url = [TiUtils toURL:arg proxy:(TiProxy*)self.proxy];
	UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url];
	[[self tableView] setBackgroundColor:[UIColor colorWithPatternImage:image]];
}

-(void)setSeparatorStyle_:(id)arg
{
	[[self tableView] setSeparatorStyle:[TiUtils intValue:arg]];
}

-(void)setSeparatorColor_:(id)arg
{
	TiColor *color = [TiUtils colorValue:arg];
	[[self tableView] setSeparatorColor:[color _color]];
}

-(void)setHeaderTitle_:(id)args
{
	[[self tableView] setTableHeaderView:[self titleViewForText:[TiUtils stringValue:args] footer:NO]];
}

-(void)setFooterTitle_:(id)args
{
	[[self tableView] setTableFooterView:[self titleViewForText:[TiUtils stringValue:args] footer:YES]];
}

-(void)setData_:(id)args
{
	ENSURE_ARRAY(args);
	
	NSArray *oldSections = nil;
	BOOL hasData = sections!=nil && [sections count] > 0;
	if (hasData)
	{
		oldSections = [sections retain];
	}
	RELEASE_TO_NIL(sections);
	
	// create new sections array
	sections = [[NSMutableArray arrayWithArray:args] retain];
	
	// wire up the relationships
	for (int c=0;c<[sections count];c++)
	{
		TiUITableViewSectionProxy *section = [sections objectAtIndex:c];
		section.section = c;
		section.table = self;
		for (int x=0;x<[section rowCount];x++)
		{
			TiUITableViewRowProxy *row = [section rowAtIndex:x];
			row.table = self;
			row.section = section;
			row.row = x;
		}
	}
	
	UITableView *table = [self tableView];
	if (hasData)
	{
		[table beginUpdates];
		[table reloadData];
		[table endUpdates];
		[oldSections release];
	}
}

#pragma mark Datasource 

- (NSInteger)tableView:(UITableView *)table numberOfRowsInSection:(NSInteger)section
{
	if (sections!=nil)
	{
		TiUITableViewSectionProxy *sectionProxy = [sections objectAtIndex:section];
		return sectionProxy.rowCount;
	}
	return 0;
}

// Row display. Implementers should *always* try to reuse cells by setting each cell's reuseIdentifier and querying for available reusable cells with dequeueReusableCellWithIdentifier:
// Cell gets various attributes set automatically based on table (separators) and data source (accessory views, editing controls)

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
	TiUITableViewSectionProxy *section = [sections objectAtIndex:[indexPath section]];
	TiUITableViewRowProxy *row = [section rowAtIndex:[indexPath row]];
	
	UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:row.className];
	if (cell == nil)
	{
		cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:row.className] autorelease];
		[row initializeTableViewCell:cell];
	}
	else
	{
		[row renderTableViewCell:cell];
	}
	
	return cell;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
	return sections!=nil ? [sections count] : 0;
}


- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
	TiUITableViewSectionProxy *sectionProxy = [sections objectAtIndex:section];
	return [sectionProxy headerTitle];
}

- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section
{
	TiUITableViewSectionProxy *sectionProxy = [sections objectAtIndex:section];
	return [sectionProxy footerTitle];
}

//
//// Editing
//
//// Individual rows can opt out of having the -editing property set for them. If not implemented, all rows are assumed to be editable.
//- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath;
//
//// Moving/reordering
//
//// Allows the reorder accessory view to optionally be shown for a particular row. By default, the reorder control will be shown only if the datasource implements -tableView:moveRowAtIndexPath:toIndexPath:
//- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath;
//
//// Index
//
//- (NSArray *)sectionIndexTitlesForTableView:(UITableView *)tableView;                                                    // return list of section titles to display in section index view (e.g. "ABCD...Z#")
//- (NSInteger)tableView:(UITableView *)tableView sectionForSectionIndexTitle:(NSString *)title atIndex:(NSInteger)index 
//{
//	// tell table which section corresponds to section title/index (e.g. "B",1))
//}
//
//// Data manipulation - insert and delete support
//
//// After a row has the minus or plus button invoked (based on the UITableViewCellEditingStyle for the cell), the dataSource must commit the change
//- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath
//{
//}
//
//// Data manipulation - reorder / moving support
//
//- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)sourceIndexPath toIndexPath:(NSIndexPath *)destinationIndexPath
//{
//}


#pragma mark Delegate

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
	[tableView deselectRowAtIndexPath:indexPath animated:YES];
	
	int sectionIndex = [indexPath section];
	int rowIndex = [indexPath row];
	int index = 0;
	int c = 0;
	TiUITableViewSectionProxy *section = [sections objectAtIndex:sectionIndex];
	TiUITableViewRowProxy *row = [section rowAtIndex:rowIndex];
	
	// unfortunately, we have to scan to determine our row index
	for (TiUITableViewSectionProxy *section in sections)
	{
		if (c == sectionIndex)
		{
			index += rowIndex;
			break;
		}
		index += [section rowCount];
		c++;
	}
	
	
	BOOL accessoryTapped = NO; //TODO
	BOOL viaSearch = NO; //TODO
	
	NSMutableDictionary * eventObject = [NSMutableDictionary dictionaryWithObjectsAndKeys:
										 section,@"section",
										 NUMINT(index),@"index",
										 row,@"row",
										 NUMBOOL(accessoryTapped),@"detail",
										 NUMBOOL(viaSearch),@"searchMode",
										 row,@"rowData",
										 nil];
	
	if ([self.proxy _hasListeners:@"click"])
	{
		[self.proxy fireEvent:@"click" withObject:eventObject];
	}
	if ([section _hasListeners:@"click"])
	{
		[section fireEvent:@"click" withObject:eventObject];
	}
	if ([row _hasListeners:@"click"])
	{
		[row fireEvent:@"click" withObject:eventObject];
	}
}


// Display customization
//
//- (void)tableView:(UITableView *)tableView willDisplayCell:(UITableViewCell *)cell forRowAtIndexPath:(NSIndexPath *)indexPath;
//
// Variable height support
//
//- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath;
//- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section;
//- (CGFloat)tableView:(UITableView *)tableView heightForFooterInSection:(NSInteger)section;
//
// Section header & footer information. Views are preferred over title should you decide to provide both
//
//- (UIView *)tableView:(UITableView *)tableView viewForHeaderInSection:(NSInteger)section;   // custom view for header. will be adjusted to default or specified header height
//- (UIView *)tableView:(UITableView *)tableView viewForFooterInSection:(NSInteger)section;   // custom view for footer. will be adjusted to default or specified footer height
//
// Accessories (disclosures). 
//
//- (UITableViewCellAccessoryType)tableView:(UITableView *)tableView accessoryTypeForRowWithIndexPath:(NSIndexPath *)indexPath __OSX_AVAILABLE_BUT_DEPRECATED(__MAC_NA,__MAC_NA,__IPHONE_2_0,__IPHONE_3_0);
//- (void)tableView:(UITableView *)tableView accessoryButtonTappedForRowWithIndexPath:(NSIndexPath *)indexPath;
//
// Selection
//
// Called before the user changes the selection. Return a new indexPath, or nil, to change the proposed selection.
//- (NSIndexPath *)tableView:(UITableView *)tableView willSelectRowAtIndexPath:(NSIndexPath *)indexPath;
//- (NSIndexPath *)tableView:(UITableView *)tableView willDeselectRowAtIndexPath:(NSIndexPath *)indexPath __OSX_AVAILABLE_STARTING(__MAC_NA,__IPHONE_3_0);
// Called after the user changes the selection.

//- (void)tableView:(UITableView *)tableView didDeselectRowAtIndexPath:(NSIndexPath *)indexPath __OSX_AVAILABLE_STARTING(__MAC_NA,__IPHONE_3_0);
//
// Editing
//
// Allows customization of the editingStyle for a particular cell located at 'indexPath'. If not implemented, all editable cells will have UITableViewCellEditingStyleDelete set for them when the table has editing property set to YES.
//- (UITableViewCellEditingStyle)tableView:(UITableView *)tableView editingStyleForRowAtIndexPath:(NSIndexPath *)indexPath
//{
//	return 
//}
//
//- (NSString *)tableView:(UITableView *)tableView titleForDeleteConfirmationButtonForRowAtIndexPath:(NSIndexPath *)indexPath
//{
//	return NSLocalizedString(@"Delete",@"Delete Confirm");
//}
//
// Controls whether the background is indented while editing.  If not implemented, the default is YES.  This is unrelated to the indentation level below.  This method only applies to grouped style table views.
//- (BOOL)tableView:(UITableView *)tableView shouldIndentWhileEditingRowAtIndexPath:(NSIndexPath *)indexPath
//{
//	return YES;
//}
//
// The willBegin/didEnd methods are called whenever the 'editing' property is automatically changed by the table (allowing insert/delete/move). This is done by a swipe activating a single row
//- (void)tableView:(UITableView*)tableView willBeginEditingRowAtIndexPath:(NSIndexPath *)indexPath
//{
//}
//
//- (void)tableView:(UITableView*)tableView didEndEditingRowAtIndexPath:(NSIndexPath *)indexPath
//{
//}
//
// Moving/reordering
//
// Allows customization of the target row for a particular row as it is being moved/reordered
//- (NSIndexPath *)tableView:(UITableView *)tableView targetIndexPathForMoveFromRowAtIndexPath:(NSIndexPath *)sourceIndexPath toProposedIndexPath:(NSIndexPath *)proposedDestinationIndexPath
//{
//	return proposedDestinationIndexPath;
//}
//
// Indentation
//
//- (NSInteger)tableView:(UITableView *)tableView indentationLevelForRowAtIndexPath:(NSIndexPath *)indexPath
//{
//	// return 'depth' of row for hierarchies
//	return 0;
//}

@end
