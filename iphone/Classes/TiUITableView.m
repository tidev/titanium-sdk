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
	RELEASE_TO_NIL(sectionIndex);
	RELEASE_TO_NIL(sectionIndexMap);
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

- (NSInteger) sectionIndexForIndex:(NSInteger)theindex
{
	int index = 0;
	int section = 0;
	
	for (TiUITableViewSectionProxy * thisSection in sections)
	{
		index+=[thisSection rowCount];
		if (theindex < index)
		{
			return section;
		}
		section++;
	}
	
	return 0;
}

-(TiUITableViewRowProxy*)rowForIndex:(NSInteger)index section:(NSInteger*)section
{
	int current = 0;
	int row = index;
	int sectionIdx = 0;
	
	for (TiUITableViewSectionProxy *sectionProxy in sections)
	{
		int rowCount = [sectionProxy rowCount];
		if (rowCount + current > index)
		{
			if (section!=nil)
			{
				*section = sectionIdx;
			}
			return [sectionProxy rowAtIndex:row];
		}
		row -= rowCount;
		current += rowCount;
		sectionIdx++;
	}

	return nil;
}

-(NSIndexPath *)indexPathFromInt:(NSInteger)index
{
	if(index < 0)
	{
		return nil;
	}
	int section = 0;
	int current = 0;
	int row = index;
	
	for (TiUITableViewSectionProxy * thisSection in sections)
	{
		int rowCount = [thisSection rowCount];
		if (rowCount + current > index)
		{
			return [NSIndexPath indexPathForRow:row inSection:section];
		}
		section++;
		row -= rowCount;
		current += rowCount;
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

-(TiUITableViewRowProxy*)rowForIndexPath:(NSIndexPath*)indexPath
{
	TiUITableViewSectionProxy *section = [sections objectAtIndex:[indexPath section]];
	return [section rowAtIndex:[indexPath row]];
}

-(void)changeEditing:(BOOL)yn
{
	editing = yn;
	[self.proxy replaceValue:NUMBOOL(yn) forKey:@"editing" notification:NO];
}

-(void)changeMoving:(BOOL)yn
{
	moving = yn;
	[self.proxy replaceValue:NUMBOOL(yn) forKey:@"moving" notification:NO];
}

-(NSInteger)indexForIndexPath:(NSIndexPath *)path
{
	int index = 0;
	int section = 0;
	
	for (TiUITableViewSectionProxy * thisSection in sections)
	{
		if (section == [path section])
		{
			return index + [path row];
		}
		section++;
		index+=[thisSection rowCount];
	}
	
	return 0;
}

- (void)triggerActionForIndexPath: (NSIndexPath *)indexPath fromPath:(NSIndexPath*)fromPath wasAccessory: (BOOL) accessoryTapped search: (BOOL) viaSearch name:(NSString*)name
{
	int sectionIdx = [indexPath section];
	TiUITableViewSectionProxy *section = [sections objectAtIndex:sectionIdx];
	
	int rowIndex = [indexPath row];
	int index = 0;
	int c = 0;
	TiUITableViewRowProxy *row = [section rowAtIndex:rowIndex];
	
	// unfortunately, we have to scan to determine our row index
	for (TiUITableViewSectionProxy *section in sections)
	{
		if (c == sectionIdx)
		{
			index += rowIndex;
			break;
		}
		index += [section rowCount];
		c++;
	}
	
	NSMutableDictionary * eventObject = [NSMutableDictionary dictionaryWithObjectsAndKeys:
										 section,@"section",
										 NUMINT(index),@"index",
										 row,@"row",
										 NUMBOOL(accessoryTapped),@"detail",
										 NUMBOOL(viaSearch),@"searchMode",
										 row,@"rowData",
										 nil];

	if (fromPath!=nil)
	{
		NSNumber *fromIndex = [NSNumber numberWithInt:[self indexForIndexPath:fromPath]];
		[eventObject setObject:fromIndex forKey:@"fromIndex"];
		[eventObject setObject:[NSNumber numberWithInt:[fromPath row]] forKey:@"fromRow"];
		[eventObject setObject:[NSNumber numberWithInt:[fromPath section]] forKey:@"fromSection"];
	}
	
	if ([self.proxy _hasListeners:name])
	{
		[self.proxy fireEvent:name withObject:eventObject];
	}
	if ([section _hasListeners:name])
	{
		[section fireEvent:name withObject:eventObject];
	}
	if ([row _hasListeners:name])
	{
		[row fireEvent:name withObject:eventObject];
	}	
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

-(void)setRowHeight_:(id)height
{
	TiDimension rowHeight = [TiUtils dimensionValue:height];
	if (TiDimensionIsPixels(rowHeight))
	{
		[tableview setRowHeight:rowHeight.value];
	}
}

-(void)setIndex_:(NSArray*)index_
{
	RELEASE_TO_NIL(sectionIndex);
	RELEASE_TO_NIL(sectionIndexMap);
	
	sectionIndex = [[NSMutableArray alloc] initWithCapacity:[index_ count]];
	sectionIndexMap = [[NSMutableDictionary alloc] init];
	
	for (NSDictionary *entry in index_)
	{
		ENSURE_DICT(entry);
		
		NSString *title = [entry objectForKey:@"title"];
		id theindex = [entry objectForKey:@"index"];
		[sectionIndex addObject:title];
		[sectionIndexMap setObject:[NSNumber numberWithInt:[TiUtils intValue:theindex]] forKey:title];
	}
}

-(void)setEditing_:(id)args withObject:(id)properties
{
	[self changeEditing:[TiUtils boolValue:args]];
	UITableView *table = [self tableView];
	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
	[table beginUpdates];
	[table setEditing:editing animated:animated];
	[table endUpdates];
}

-(void)setMoving_:(id)args withObject:(id)properties
{
	[self changeMoving:[TiUtils boolValue:args]];
	UITableView *table = [self tableView];
	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
	[table beginUpdates];
	[table setEditing:moving||editing animated:animated];
	[table endUpdates];
}

-(void)setData_:(id)args withObject:(id)properties
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
		UITableViewRowAnimation animation = [TiUITableViewAction animationStyleForProperties:properties];
		NSIndexSet *oldSectionSet = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0,[oldSections count])];
		NSIndexSet *newSectionSet = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0,[sections count])];
		[table beginUpdates];
		[table deleteSections:oldSectionSet withRowAnimation:UITableViewRowAnimationNone];
		[table insertSections:newSectionSet withRowAnimation:animation];
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
	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];
	
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

// Individual rows can opt out of having the -editing property set for them. If not implemented, all rows are assumed to be editable.
- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath
{
	if (editing || moving)
	{
		TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];
		id editable_ = [row valueForKey:@"editable"];
		
		if (editable_!=nil && !moving)
		{
			return [TiUtils boolValue:editable_];
		}
		
		return editing || moving;
	}
	return NO;
}

- (BOOL)tableView:(UITableView *)tableView shouldIndentWhileEditingRowAtIndexPath:(NSIndexPath *)indexPath
{
	if (moving)
	{
		return NO;
	}
	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];
	id value = [row valueForKey:@"indentOnEdit"];
	if (value!=nil)
	{
		return [TiUtils boolValue:value];
	}
	return YES;
}

// After a row has the minus or plus button invoked (based on the UITableViewCellEditingStyle for the cell), the dataSource must commit the change
- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath
{
	if (editingStyle==UITableViewCellEditingStyleDelete)
	{
		TiUITableViewSectionProxy *section = [sections objectAtIndex:[indexPath section]];
		NSInteger index = [self indexForIndexPath:indexPath];
		UITableView *table = [self tableView];
		[[section rows] removeObjectAtIndex:[indexPath row]];
		[table beginUpdates];
		NSIndexPath *path = [self indexPathFromInt:index];
		[table deleteRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:UITableViewRowAnimationFade];
		[table endUpdates];
		[self triggerActionForIndexPath:indexPath fromPath:nil wasAccessory:NO search:NO name:@"delete"];
	}
}

// Allows the reorder accessory view to optionally be shown for a particular row. By default, the reorder control will be shown only if the datasource implements -tableView:moveRowAtIndexPath:toIndexPath:
- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
	if (moving)
	{
		TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];
		return [TiUtils boolValue:[row valueForKey:@"moveable"] def:YES];
	}
	return NO;
}

- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)sourceIndexPath toIndexPath:(NSIndexPath *)destinationIndexPath
{
	int fromSectionIndex = [sourceIndexPath section];
	int toSectionIndex = [destinationIndexPath section];
	
	TiUITableViewSectionProxy *fromSection = [sections objectAtIndex:fromSectionIndex];
	TiUITableViewSectionProxy *toSection = fromSectionIndex!=toSectionIndex ? [sections objectAtIndex:toSectionIndex] : fromSection;
	
	[[toSection rows] replaceObjectsInRange:NSMakeRange([sourceIndexPath row], 1) withObjectsFromArray:[toSection rows] range:NSMakeRange([destinationIndexPath row],1)];
	[[fromSection rows] removeObjectAtIndex:[sourceIndexPath row]];
	 
	[self triggerActionForIndexPath:destinationIndexPath fromPath:sourceIndexPath wasAccessory:NO search:NO name:@"move"];
}

#pragma mark Collation

- (NSArray *)sectionIndexTitlesForTableView:(UITableView *)tableView
{
	if (sectionIndex!=nil && editing==NO)
	{
		return sectionIndex;
	}
	return nil;
}

- (NSInteger)tableView:(UITableView *)tableView sectionForSectionIndexTitle:(NSString *)title atIndex:(NSInteger)index
{
	if (sectionIndexMap!=nil)
	{
		// get the section for the row index
		int index = [[sectionIndexMap objectForKey:title] intValue];
		return [self sectionIndexForIndex:index];
	}
	return 0;
}

//- (NSArray *)sectionIndexTitlesForTableView:(UITableView *)tableView
//{
//	// return list of section titles to display in section index view (e.g. "ABCD...Z#")
//}
//
//- (NSInteger)tableView:(UITableView *)tableView sectionForSectionIndexTitle:(NSString *)title atIndex:(NSInteger)index 
//{
//	// tell table which section corresponds to section title/index (e.g. "B",1))
//}


#pragma mark Delegate

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
	[tableView deselectRowAtIndexPath:indexPath animated:YES];
	[self triggerActionForIndexPath:indexPath fromPath:nil wasAccessory:NO search:NO name:@"click"];
}

-(void)tableView:(UITableView *)tableView willDisplayCell:(UITableViewCell *)cell forRowAtIndexPath:(NSIndexPath *)indexPath
{
	TiUITableViewSectionProxy *section = [sections objectAtIndex:[indexPath section]];
	TiUITableViewRowProxy *row = [section rowAtIndex:[indexPath row]];
	NSString *color = [row valueForKey:@"backgroundColor"];
	if (color!=nil)
	{
		cell.backgroundColor = UIColorWebColorNamed(color);
	}
}

// Allows customization of the editingStyle for a particular cell located at 'indexPath'. If not implemented, all editable cells will have UITableViewCellEditingStyleDelete set for them when the table has editing property set to YES.
- (UITableViewCellEditingStyle)tableView:(UITableView *)tableView editingStyleForRowAtIndexPath:(NSIndexPath *)indexPath
{
	if (moving)
	{
		return UITableViewCellEditingStyleNone;
	}
	if ([self tableView:tableView canEditRowAtIndexPath:indexPath])
	{
		return UITableViewCellEditingStyleDelete;
	}
	return UITableViewCellEditingStyleNone;
}

- (NSString *)tableView:(UITableView *)tableView titleForDeleteConfirmationButtonForRowAtIndexPath:(NSIndexPath *)indexPath
{
	//TODO
	return NSLocalizedString(@"Delete",@"Table View Delete Confirm");
}

- (void)tableView:(UITableView *)tableView accessoryButtonTappedForRowWithIndexPath:(NSIndexPath *)indexPath
{
	[self triggerActionForIndexPath:indexPath fromPath:nil wasAccessory:YES search:NO name:@"click"];
}

- (NSInteger)tableView:(UITableView *)tableView indentationLevelForRowAtIndexPath:(NSIndexPath *)indexPath
{
	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];
	id indent = [row valueForKey:@"indentionLevel"];
	return indent == nil ? 0 : [TiUtils intValue:indent];
}

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



@end
