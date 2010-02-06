/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewBase.h"
#import "TiUITableViewCellProxy.h"
#import "TiUITableViewGroupSection.h"
#import "WebFont.h"
#import "Webcolor.h"
#import "TiUtils.h"
#import "TiUITableViewCell.h"
#import "TiUITableViewTitle.h"
#import "TiUIGroupedSectionProxy.h"
#import "TiUITableViewValueCell.h"

#import "TiViewProxy.h"

@implementation TiUITableViewBase

@synthesize editing, moving;

#pragma mark Internal

-(void)dealloc
{
	RELEASE_TO_NIL(tableview);
	RELEASE_TO_NIL(templateCell);
	RELEASE_TO_NIL(sectionArray);
	RELEASE_TO_NIL(borderColor);
	[super dealloc];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (!CGRectIsEmpty(bounds))
	{
		if (!CGRectEqualToRect(bounds,[TiUtils viewPositionRect:tableview]))
		{
			[TiUtils setView:tableview positionRect:bounds];
		}
		if (needsReload)
		{
			needsReload = NO;
			[tableview reloadData];
		}
	}
}

-(UITableViewStyle)tableStyle
{
	return UITableViewStylePlain;
}

-(UITableView*)tableview
{
	if (tableview==nil)
	{
		tableview = [[UITableView alloc] initWithFrame:CGRectZero style:[self tableStyle]];
		tableview.delegate = self;
		tableview.dataSource = self;
		tableview.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
		[self addSubview:tableview];
	}
	return tableview;
}

-(void)setBackgroundColor_:(id)color;
{
	[super setBackgroundColor_:color];
	UIColor * newBGColor;
	if (([self tableStyle] == UITableViewStyleGrouped) && IS_NULL_OR_NIL(color))
	{
		newBGColor = [UIColor groupTableViewBackgroundColor];
	}
	else
	{
		newBGColor = [UIColor clearColor];		
	}

	[[self tableview] setBackgroundColor:newBGColor];
}

-(void)initializerState
{
	// don't call super, we don't use its listeners, etc.
	[self tableview];
}

#pragma mark Utilities

- (NSIndexPath *) lastRowIndexPathForSection: (TiUITableViewGroupSection*) section
{
	int sectionIndex = 0;
	for (TiUITableViewGroupSection * thisSection in sectionArray)
	{
		if (thisSection == section)
		{
			return [NSIndexPath indexPathForRow:[section rowCount]-1 inSection:sectionIndex];
		}
		sectionIndex++;
	}
	return nil;
}

- (NSInteger) indexForIndexPath:(NSIndexPath *)path
{
	int index = 0;
	int section = 0;
	
	for (TiUITableViewGroupSection * thisSection in sectionArray)
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

- (NSInteger) sectionIndexForIndex:(NSInteger)theindex
{
	int index = 0;
	int section = 0;
	
	for (TiUITableViewGroupSection * thisSection in sectionArray)
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

- (TiUITableViewGroupSection *) sectionForIndex: (NSInteger) section
{
	NSInteger sectionCount = [sectionArray count];
	if ((section >= 0) && (section < sectionCount)) 
	{
		return [[[sectionArray objectAtIndex:section] retain] autorelease];
	}
	return nil;
}

- (NSIndexPath *) indexPathFromInt: (int) index
{
	if(index < 0)
	{
		return nil;
	}
	int section = 0;
	int current = 0;
	int row = index;
	
	for (TiUITableViewGroupSection * thisSection in sectionArray)
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

- (TiUITableViewCellProxy *) cellForIndexPath: (NSIndexPath *) path
{
	TiUITableViewGroupSection * thisSectionWrapper = [self sectionForIndex:[path section]];
	TiUITableViewCellProxy * result = [thisSectionWrapper rowForIndex:[path row]];
	return result;	
}


#pragma mark UI events

- (void)triggerActionForIndexPath: (NSIndexPath *)indexPath fromPath:(NSIndexPath*)fromPath wasAccessory: (BOOL) accessoryTapped search: (BOOL) viaSearch name:(NSString*)name
{
	int sectionIndex = [indexPath section];
	TiUITableViewGroupSection * section = [self sectionForIndex:sectionIndex];
	TiProxy * target = (section.delegate!=nil) && [section.delegate _hasListeners:name] ? section.delegate : (TiProxy*)self.proxy;
	
	// optimization, if we don't have a click listener, don't do anything
	if (![target _hasListeners:name])
	{
		return;
	}
	
	int thisSectionIndex = 0;
	int row = [indexPath row];
	int index = row;
	
	NSDictionary * thisDataCellDict = nil;
	
	for (TiUITableViewGroupSection * thisSection in sectionArray)
	{
		if (thisSectionIndex == thisSectionIndex)
		{
			thisDataCellDict = [[[thisSection rowForIndex:row] jsonValues] copy];
			break;
		}
		index += [thisSection rowCount];
		thisSectionIndex ++;
	}
	
	NSMutableDictionary * eventObject = [NSMutableDictionary dictionaryWithObjectsAndKeys:
										 [NSNumber numberWithInt:thisSectionIndex],@"section",
										 [NSNumber numberWithInt:index],@"index",
										 [NSNumber numberWithInt:row],@"row",
										 [NSNumber numberWithBool:accessoryTapped],@"detail",
										 [NSNumber numberWithBool:viaSearch],@"searchMode",
										 nil];
	
	if (fromPath!=nil)
	{
		NSNumber *fromIndex = [NSNumber numberWithInt:[self indexForIndexPath:fromPath]];
		[eventObject setObject:fromIndex forKey:@"fromIndex"];
		[eventObject setObject:[NSNumber numberWithInt:[fromPath row]] forKey:@"fromRow"];
		[eventObject setObject:[NSNumber numberWithInt:[fromPath section]] forKey:@"fromSection"];
	}
	
	UITableViewCell * triggeredCell = [tableview cellForRowAtIndexPath:indexPath];
	
	if ([triggeredCell isKindOfClass:[TiUITableViewCell class]])
	{
		NSString * newItemName = [(TiUITableViewCell *)triggeredCell clickedName];
		if (newItemName != nil) 
		{
			[eventObject setObject:newItemName forKey:@"layoutName"];
		}
	}
	
	if (thisDataCellDict != nil) 
	{
		[eventObject setObject:thisDataCellDict forKey:@"rowData"];
	}
	
	[target fireEvent:name withObject:eventObject];
	[thisDataCellDict release];
}

#pragma mark UITableView Delegate rendering

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
	CHECK_ROW_HEIGHT(rowHeight,[self cellForIndexPath:indexPath],tableview);
	return [tableview rowHeight];
}

- (NSInteger)tableView:(UITableView *)tableView indentationLevelForRowAtIndexPath:(NSIndexPath *)indexPath
{
	return 0;
	/*
	CellDataWrapper *cell = [self cellForIndexPath:indexPath];
	id indent = [cell stringForKey:@"indentionLevel"];
	return indent == nil ? 0 : [TiUtils intValue:indent];*/
}

#pragma mark UITableView Delegate accessory

- (void)tableView:(UITableView *)tableView accessoryButtonTappedForRowWithIndexPath:(NSIndexPath *)indexPath
{
	[self triggerActionForIndexPath:indexPath fromPath:nil wasAccessory:YES search:NO name:@"click"];
}

#pragma mark UITableView Delegate selections

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
	// To conform to the Human Interface Guidelines, selections should not be persistent --
	// deselect the row after it has been selected.
	[tableView deselectRowAtIndexPath:indexPath animated:YES];
	
	[self triggerActionForIndexPath:indexPath fromPath:nil wasAccessory:NO search:NO name:@"click"];
}

#pragma mark UITableView Delegate header and footer of sections


- (UIView *)tableView:(UITableView *)tableView viewForHeaderInSection:(NSInteger)section
{
	if([tableView style]==UITableViewStylePlain)
	{
		//TODO: support custom headers for plain table views
		return nil;
	}
	
	TiUITableViewGroupSection * thisSection = [self sectionForIndex:section];
	NSString * ourTitle = [thisSection header];
	UIColor * ourColor = [thisSection headerColor];
	
	if((ourTitle==nil) || (ourColor == nil))
	{
		return nil;
	}
	
	TiUITableViewTitle * result = [[TiUITableViewTitle alloc] initWithFrame:CGRectMake(0, 0, [tableView bounds].size.width, 20)];
	[result setText:ourTitle];
	[result setTextColor:ourColor];
	[result setFont:[thisSection headerFont]];
	[result setTextAlignment:UITextAlignmentLeft];
	
	return [result autorelease];
}

- (UIView *)tableView:(UITableView *)tableView viewForFooterInSection:(NSInteger)section
{
	if([tableView style]==UITableViewStylePlain)
	{
		//TODO: support custom headers for plain table views
		return nil;
	}
	
	TiUITableViewGroupSection * thisSection = [self sectionForIndex:section];
	NSString * ourTitle = [thisSection footer];
	UIColor * ourColor = [thisSection headerColor];
	
	if((ourTitle==nil) || (ourColor == nil))
	{
		return nil;
	}
	
	TiUITableViewTitle * result = [[TiUITableViewTitle alloc] initWithFrame:CGRectMake(0, 0, [tableView bounds].size.width, 20)];
	[result setText:ourTitle];
	[result setTextColor:ourColor];
	[result setFont:[thisSection footerFont]];
	[result setTextAlignment:UITextAlignmentCenter];
	
	return [result autorelease];
}

- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
	CGFloat result = [tableView sectionFooterHeight];
	if([tableView style]==UITableViewStylePlain)
	{
		return result;
	}
	
	NSString * ourTitle = [self tableView:tableView titleForHeaderInSection:section];
	if(ourTitle==nil)
	{
		return result;
	}
	return result + 26;
}

- (CGFloat)tableView:(UITableView *)tableView heightForFooterInSection:(NSInteger)section
{
	CGFloat result = [tableView sectionFooterHeight];
	if([tableView style]==UITableViewStylePlain)
	{
		return result;
	}
	
	NSString * ourTitle = [self tableView:tableView titleForFooterInSection:section];
	if(ourTitle==nil)
	{
		return result;
	}
	return result + 26;
}

#pragma mark UITableView Delegate editing

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

- (BOOL)tableView:(UITableView *)tableView shouldIndentWhileEditingRowAtIndexPath:(NSIndexPath *)indexPath
{
	if (moving)
	{
		return NO;
	}
	TiUITableViewGroupSection *sectionWrapper = [self sectionForIndex:[indexPath section]];
	TiUITableViewCellProxy *rowWrapper = [sectionWrapper rowForIndex:[indexPath row]];
	id value = [rowWrapper stringForKey:@"indentOnEdit"];
	if (value!=nil)
	{
		return [TiUtils boolValue:value];
	}
	return YES;
}

#pragma mark UITableView Datasource configuration

-(TiUITableViewCell*)cellForIndexPath:(NSIndexPath *)path section:(TiUITableViewGroupSection*)sectionWrapper cell:(TiUITableViewCellProxy*)rowWrapper
{
	TiUITableViewCell *result = (TiUITableViewCell *)[tableview dequeueReusableCellWithIdentifier:@"complex"];
	if (result == nil) 
	{
		result = [[[TiUITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"complex"] autorelease];
	}		
	return result;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
	TiUITableViewGroupSection *sectionWrapper = [self sectionForIndex:[indexPath section]];
	TiUITableViewCellProxy *rowWrapper = [sectionWrapper rowForIndex:[indexPath row]];
	TiUITableViewCell *result = [self cellForIndexPath:indexPath section:sectionWrapper cell:rowWrapper];
	[result setDataWrapper:rowWrapper];	
	
	NSString * selectionStyleString = [rowWrapper stringForKey:@"selectionStyle"];
	if([selectionStyleString isEqualToString:@"none"])
	{
		[result setSelectionStyle:UITableViewCellSelectionStyleNone];
	} 
	else if ([selectionStyleString isEqualToString:@"gray"])
	{
		[result setSelectionStyle:UITableViewCellSelectionStyleGray];
	} 
	else 
	{
		[result setSelectionStyle:UITableViewCellSelectionStyleBlue];
	}
	
	
	UIColor * backgroundColor = [rowWrapper colorForKey:@"backgroundColor"];
	UIColor * selectedBgColor = [rowWrapper colorForKey:@"selectedBackgroundColor"];
	
	UIImage * bgImage = [rowWrapper stretchableImageForKey:@"backgroundImage"];
	UIImage	* selectedBgImage = [rowWrapper stretchableImageForKey:@"selectedBackgroundImage"];
	
	
	if (([tableView style] == UITableViewStyleGrouped) && (bgImage == nil))
	{
		if (backgroundColor != nil)
		{
			[result setBackgroundColor:backgroundColor];
		}
		else 
		{
			[result setBackgroundColor:[UIColor whiteColor]];
		}
	} 
	else 
	{
		UIImageView * bgView = (UIImageView *)[result backgroundView];
		if (![bgView isKindOfClass:[UIImageView class]])
		{
			bgView = [[[UIImageView alloc] initWithFrame:[result bounds]] autorelease];
			[bgView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
			[result setBackgroundView:bgView];
		}
		[bgView setImage:bgImage];
		[bgView setBackgroundColor:(backgroundColor==nil)?[UIColor clearColor]:backgroundColor];
	}
	
	if ((selectedBgColor == nil) && (selectedBgImage == nil))
	{
		[result setSelectedBackgroundView:nil];
	} 
	else 
	{
		UIImageView * selectedBgView = (UIImageView *)[result selectedBackgroundView];
		if (![selectedBgView isKindOfClass:[UIImageView class]])
		{
			selectedBgView = [[[UIImageView alloc] initWithFrame:[result bounds]] autorelease];
			[selectedBgView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
			[result setSelectedBackgroundView:selectedBgView];
		}
		
		[selectedBgView setImage:selectedBgImage];
		[selectedBgView setBackgroundColor:(selectedBgColor==nil)?[UIColor clearColor]:selectedBgColor];
	}
	
	return result;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
	return [sectionArray count];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
	return [[self sectionForIndex:section] rowCount];
}

- (NSArray *)sectionIndexTitlesForTableView:(UITableView *)tableView
{
	return nil;
}

- (NSInteger)tableView:(UITableView *)tableView sectionForSectionIndexTitle:(NSString *)title atIndex:(NSInteger)index
{
	return 0;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
	return [[[[self sectionForIndex:section] header] copy] autorelease];
}

- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section
{
	return [[[[self sectionForIndex:section] footer] copy] autorelease];
}
 
#pragma mark UITableView Datasource insert and deleting

- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath
{
	if (editingStyle==UITableViewCellEditingStyleDelete)
	{
		NSInteger index = [self indexForIndexPath:indexPath];
		[self dispatchAction:[NSArray arrayWithObject:[NSNumber numberWithInt:index]] withType:TiUITableViewDispatchDeleteRow];
		[self triggerActionForIndexPath:indexPath fromPath:nil wasAccessory:NO search:NO name:@"delete"];
	}
}

- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath
{
	TiUITableViewGroupSection *sectionWrapper = [self sectionForIndex:[indexPath section]];
	TiUITableViewCellProxy *rowWrapper = [sectionWrapper rowForIndex:[indexPath row]];
	id editable_ = [rowWrapper stringForKey:@"editable"];
	
	if (editable_!=nil && !moving)
	{
		return [TiUtils boolValue:editable_];
	}
	
	return editable || editing || moving;
}

#pragma mark UITableView Datasource reodering

- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
	TiUITableViewGroupSection *sectionWrapper = [self sectionForIndex:[indexPath section]];
	TiUITableViewCellProxy *rowWrapper = [sectionWrapper rowForIndex:[indexPath row]];
	id amoveable = [rowWrapper stringForKey:@"moveable"];
	return amoveable==nil ? moving : [TiUtils boolValue:amoveable];
}

- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)fromIndexPath toIndexPath:(NSIndexPath *)toIndexPath
{	
	int fromSectionIndex = [fromIndexPath section];
	int toSectionIndex = [toIndexPath section];

	TiUITableViewGroupSection *fromSection = [self sectionForIndex:fromSectionIndex];
	TiUITableViewGroupSection *toSection = [self sectionForIndex:toSectionIndex];

	TiUITableViewCellProxy *rowWrapper = [fromSection rowForIndex:[fromIndexPath row]];
	[fromSection removeObjectFromDataAtIndex:[fromIndexPath row]];
	[toSection insertRow:rowWrapper atIndex:[toIndexPath row]];
	
	[self triggerActionForIndexPath:toIndexPath fromPath:fromIndexPath wasAccessory:NO search:NO name:@"move"];
}

#pragma mark Public APIs

-(void)setRowHeight_:(id)height
{
	rowHeight = [TiUtils dimensionValue:height];
	if (TiDimensionIsPixels(rowHeight))
	{
		[tableview setRowHeight:rowHeight.value];
	}
}

-(void)setMinRowHeight_:(id)height
{
	minRowHeight = [TiUtils dimensionValue:height];
}

-(void)setMaxRowHeight_:(id)height
{
	maxRowHeight = [TiUtils dimensionValue:height];
}

-(void)setBorderColor_:(id)color
{
	RELEASE_TO_NIL(borderColor);
	
	if (color!=nil)
	{
		borderColor = [[[TiUtils colorValue:color] _color] retain];
	}
	
	if (tableview!=nil)
	{
		if (borderColor == [UIColor clearColor])
		{
			[tableview setSeparatorStyle:UITableViewCellSeparatorStyleNone];
		}
		else 
		{
			[tableview setSeparatorStyle:UITableViewCellSeparatorStyleSingleLine];
			if(borderColor != nil)
			{
				[tableview setSeparatorColor:borderColor];
			}
		}
	}
}

-(void)setTemplate_:(id)cell
{
	ENSURE_DICT(cell);
	RELEASE_TO_NIL(templateCell);
	templateCell = [[TiUITableViewCellProxy cellDataWithProperties:cell proxy:[self proxy] font:[WebFont tableRowFont] template:nil] retain];
	if (TiDimensionIsUndefined(rowHeight))
	{
		id value = [templateCell stringForKey:@"rowHeight"];
		if (value!=nil)
		{
			[self setRowHeight_:value];
		}
	}
}

-(void)setData_:(id)dataArray
{
	[self replaceData:dataArray reload:YES];
}

-(void)setSections_:(id)sections
{
	RELEASE_TO_NIL(sectionArray);
	
	sectionArray = [[NSMutableArray alloc] initWithCapacity:[sections count]];
	
	for (TiUIGroupedSectionProxy *sectionProxy in sections)
	{
		TiUITableViewGroupSection *section = [sectionProxy section];
		[sectionArray addObject:section];
	}
}

-(void)setEditable_:(id)editable_
{
	editable = [TiUtils boolValue:editable_];
}

-(void)setEditing_:(id)editing_
{
	if ([editing_ isKindOfClass:[NSArray class]])
	{
		[self dispatchAction:editing_ withType:TiUITableViewDispatchSetEditing];
		// since we temporarily stored as an array, set the value back to a bool
		[self.proxy replaceValue:[editing_ objectAtIndex:0] forKey:@"editing" notification:NO];
	}
	else
	{
		[self dispatchAction:[NSArray arrayWithObject:editing_] withType:TiUITableViewDispatchSetEditing];
	}
}

-(void)setMoving_:(id)moving_
{
	if ([moving_ isKindOfClass:[NSArray class]])
	{
		[self dispatchAction:moving_ withType:TiUITableViewDispatchSetMoving];
		// since we temporarily stored as an array, set the value back to a bool
		[self.proxy replaceValue:[moving_ objectAtIndex:0] forKey:@"moving" notification:NO];
	}
	else
	{
		[self dispatchAction:[NSArray arrayWithObject:moving_] withType:TiUITableViewDispatchSetMoving];
	}
}

#pragma mark Processing

-(UITableViewRowAnimation)animationFromArgument:(id)args atIndex:(NSInteger)index
{
	if (index < [args count])
	{
		NSDictionary *arg = [args objectAtIndex:index];
		if ([arg isKindOfClass:[NSDictionary class]])
		{
			BOOL found = NO;
			UITableViewRowAnimation animationStyle = [TiUtils intValue:@"animationStyle" properties:arg def:UITableViewRowAnimationNone exists:&found];
			if (found)
			{
				return animationStyle;
			}
			BOOL animate = [TiUtils boolValue:@"animated" properties:arg def:NO];
			return animate ? UITableViewRowAnimationFade : UITableViewRowAnimationNone;
		}
	}
	return UITableViewRowAnimationNone;
}

-(void)replaceData:(id)dataArray reload:(BOOL)reload
{
	ENSURE_ARRAY(dataArray);
	RELEASE_TO_NIL(sectionArray);
	
	sectionArray = [[NSMutableArray alloc] init];
	
	TiUITableViewGroupSection * thisSectionWrapper = nil;
	
	for (id thisEntry in dataArray)
	{
		ENSURE_DICT(thisEntry);
		TiUITableViewCellProxy * thisRow = [TiUITableViewCellProxy cellDataWithProperties:thisEntry proxy:[self proxy] font:[WebFont tableRowFont] template:templateCell];
		
		NSString * headerString = [TiUtils stringValue:@"header" properties:thisEntry];
		NSString * footerString = [TiUtils stringValue:@"footer" properties:thisEntry];
		
		if ([thisSectionWrapper accceptsHeader:headerString footer:footerString])
		{
			[thisSectionWrapper addRow:thisRow];
		} 
		else 
		{
			thisSectionWrapper = [[TiUITableViewGroupSection alloc] initWithHeader:headerString footer:footerString withProperties:thisEntry];
			[thisSectionWrapper addRow:thisRow];
			[sectionArray addObject:thisSectionWrapper];
			[thisSectionWrapper release];
		}
	}	
	
	if (reload)
	{
		if (CGRectIsEmpty(tableview.bounds))
		{
			needsReload = YES;
		}
		else 
		{
			[tableview reloadData];
		}	
	}
}

-(void)changeEditing:(BOOL)yn
{
	editing = yn;
	[self.proxy replaceValue:[NSNumber numberWithBool:yn] forKey:@"editing" notification:NO];
}

-(void)changeMoving:(BOOL)yn
{
	moving = yn;
	[self.proxy replaceValue:[NSNumber numberWithBool:yn] forKey:@"moving" notification:NO];
}

-(void)dispatchAction:(NSArray*)args withType:(TiUITableViewDispatchType)type
{
	// this method is on the UI thread so we're safe
	[tableview beginUpdates];
	switch(type)
	{
		case TiUITableViewDispatchInsertRowAfter:
		{
			int row = [[args objectAtIndex:0] intValue];
			NSIndexPath *path = [self indexPathFromInt:row];
			TiUITableViewGroupSection *section = [sectionArray objectAtIndex:[path section]];
			[section insertRowAfter:[NSArray arrayWithObject:[NSNumber numberWithInt:[path row]]]];
			NSIndexPath *newpath = [NSIndexPath indexPathForRow:[path row]+1 inSection:[path section]];
			[tableview insertRowsAtIndexPaths:[NSArray arrayWithObject:newpath] withRowAnimation:[self animationFromArgument:args atIndex:2]];
			break;
		}
		case TiUITableViewDispatchInsertRowBefore:
		{
			int row = [[args objectAtIndex:0] intValue];
			NSIndexPath *path = [self indexPathFromInt:row];
			TiUITableViewGroupSection *section = [sectionArray objectAtIndex:[path section]];
			[section insertRowBefore:[NSArray arrayWithObject:[NSNumber numberWithInt:[path row]]]];
			[tableview insertRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:[self animationFromArgument:args atIndex:2]];
			break;
		}
		case TiUITableViewDispatchDeleteRow:
		{
			int row = [[args objectAtIndex:0] intValue];
			NSIndexPath *path = [self indexPathFromInt:row];
			TiUITableViewGroupSection *section = [sectionArray objectAtIndex:[path section]];
			[section deleteRow:[NSArray arrayWithObject:[NSNumber numberWithInt:[path row]]]];
			[tableview deleteRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:[self animationFromArgument:args atIndex:1]];
			break;
		}
		case TiUITableViewDispatchUpdateRow:
		{
			int row = [[args objectAtIndex:0] intValue];
			NSIndexPath *path = [self indexPathFromInt:row];
			TiUITableViewGroupSection *section = [sectionArray objectAtIndex:[path section]];
			[section updateRow:[NSArray arrayWithObject:[NSNumber numberWithInt:[path row]]]];
			[tableview reloadRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:[self animationFromArgument:args atIndex:2]];
			break;
		}
		case TiUITableViewDispatchAppendRow:
		{
			TiUITableViewGroupSection *section = [sectionArray lastObject];
			[section appendRow:args];
			NSIndexPath *newpath = [self lastRowIndexPathForSection:section];
			[tableview insertRowsAtIndexPaths:[NSArray arrayWithObject:newpath] withRowAnimation:[self animationFromArgument:args atIndex:1]];
			break;
		}
		case TiUITableViewDispatchScrollToIndex:
		{
			int row = [[args objectAtIndex:0] intValue];
			NSIndexPath *path = [self indexPathFromInt:row];
			NSDictionary *options = [args count] > 1 ? [args objectAtIndex:1] : nil;
			BOOL animated = [TiUtils boolValue:@"animated" properties:options def:NO];
			UITableViewScrollPosition scrollPosition = [TiUtils intValue:@"position" properties:options def:UITableViewScrollPositionNone];
			[tableview scrollToRowAtIndexPath:path atScrollPosition:scrollPosition animated:animated];
			break;
		}
		case TiUITableViewDispatchSetDataWithAnimation:
		{
			int oldCount=[sectionArray count];
			NSIndexSet * oldRange = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, oldCount)];
			[self replaceData:[args objectAtIndex:0] reload:YES];
			int newCount=[sectionArray count];
			NSIndexSet * newRange = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, newCount)];
			UITableViewRowAnimation animation = [self animationFromArgument:args atIndex:1];
			if(oldRange > 0)
			{
				[tableview deleteSections:oldRange withRowAnimation:animation];
			}
			if(newRange > 0)
			{
				[tableview insertSections:newRange withRowAnimation:animation];
			}
			break;
		}
		case TiUITableViewDispatchAddSection:
		{
			TiUIGroupedSectionProxy *sectionProxy = [args objectAtIndex:0];
			TiUITableViewGroupSection *section = [sectionProxy section];
			[sectionArray addObject:section];
			NSIndexSet *newpath = [NSIndexSet indexSetWithIndex:[sectionArray count]-1];
			[tableview insertSections:newpath withRowAnimation:[self animationFromArgument:args atIndex:1]];
			break;
		}
		case TiUITableViewDispatchInsertSectionBefore:
		{
			int index = [TiUtils intValue:[args objectAtIndex:0]];
			TiUIGroupedSectionProxy *sectionProxy = [args objectAtIndex:1];
			TiUITableViewGroupSection *section = [sectionProxy section];
			[sectionArray insertObject:section atIndex:index];
			NSIndexSet *newpath = [NSIndexSet indexSetWithIndex:index];
			[tableview insertSections:newpath withRowAnimation:[self animationFromArgument:args atIndex:2]];
			break;
		}
		case TiUITableViewDispatchInsertSectionAfter:
		{
			int index = [TiUtils intValue:[args objectAtIndex:0]] + 1;
			TiUIGroupedSectionProxy *sectionProxy = [args objectAtIndex:1];
			TiUITableViewGroupSection *section = [sectionProxy section];
			[sectionArray insertObject:section atIndex:index];
			NSIndexSet *newpath = [NSIndexSet indexSetWithIndex:index];
			[tableview insertSections:newpath withRowAnimation:[self animationFromArgument:args atIndex:2]];
			break;
		}
		case TiUITableViewDispatchDeleteSection:
		{
			int index = [TiUtils intValue:[args objectAtIndex:0]];
			[sectionArray removeObjectAtIndex:index];
			NSIndexSet *newpath = [NSIndexSet indexSetWithIndex:index];
			[tableview deleteSections:newpath withRowAnimation:[self animationFromArgument:args atIndex:1]];
			break;
		}
		case TiUITableViewDispatchUpdateSection:
		{
			int index = [TiUtils intValue:[args objectAtIndex:0]];
			TiUIGroupedSectionProxy *sectionProxy = [args objectAtIndex:1];
			TiUITableViewGroupSection *section = [sectionProxy section];
			[sectionArray replaceObjectAtIndex:index withObject:section];
			NSIndexSet *newpath = [NSIndexSet indexSetWithIndex:index];
			[tableview reloadSections:newpath withRowAnimation:[self animationFromArgument:args atIndex:2]];
			break;
		}
		case TiUITableViewDispatchSetSectionWithAnimation:
		{
			int oldCount=[sectionArray count];
			NSIndexSet * oldRange = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, oldCount)];
			NSData *array = [args objectAtIndex:0];
			[self setSections_:array];
			int newCount=[sectionArray count];
			NSIndexSet * newRange = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, newCount)];
			UITableViewRowAnimation animation = [self animationFromArgument:args atIndex:1];
			if(oldRange > 0)
			{
				[tableview deleteSections:oldRange withRowAnimation:animation];
			}
			if(newRange > 0)
			{
				[tableview insertSections:newRange withRowAnimation:animation];
			}
			break;
		}
		case TiUITableViewDispatchSetEditing:
		{
			BOOL edit = [TiUtils boolValue:[args objectAtIndex:0]];
			NSDictionary *options = [args count] > 1 ? [args objectAtIndex:1] : nil;
			BOOL animated = [TiUtils boolValue:@"animated" properties:options def:YES];
			[self changeEditing:edit];
			[tableview setEditing:edit||moving animated:animated];
			break;
		}			
		case TiUITableViewDispatchSetMoving:
		{
			BOOL move = [TiUtils boolValue:[args objectAtIndex:0]];
			NSDictionary *options = [args count] > 1 ? [args objectAtIndex:1] : nil;
			BOOL animated = [TiUtils boolValue:@"animated" properties:options def:YES];
			[self changeMoving:move];
			[tableview setEditing:move||editing animated:animated];
			break;
		}
	}
	[tableview endUpdates];
}

@end
