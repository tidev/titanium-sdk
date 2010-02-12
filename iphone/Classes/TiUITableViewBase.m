/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewBase.h"
#import "TiUITableViewRowProxy.h"
#import "TiUITableViewGroupSection.h"
#import "WebFont.h"
#import "Webcolor.h"
#import "TiUtils.h"
#import "TiUITableViewCell.h"
#import "TiUITableViewTitle.h"
#import "TiUIGroupedSectionProxy.h"

#import "TiViewProxy.h"

@implementation TiUITableViewTransaction
@synthesize sectionIndex,rowIndex,value,animation;

- (void) dealloc
{
	RELEASE_TO_NIL(value);
	[super dealloc];
}

-(void)setAnimationToIndex:(int)index ofArguments:(NSArray *)args
{
	if ([args count]<index)
	{
		return;
	}
	NSDictionary * animationArgs = [args objectAtIndex:index];
	animation = [TiUtils intValue:@"animationStyle" properties:animationArgs];	
}

@end


@implementation TiUITableViewBase

@synthesize editing, moving;

#pragma mark Internal

-(void)dealloc
{
	RELEASE_TO_NIL(tableview);
	RELEASE_TO_NIL(sectionArray);
//	RELEASE_TO_NIL(transactionArray);
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
	}
}

-(UITableViewStyle)tableStyle
{
	[self throwException:TiExceptionInternalInconsistency subreason:@"tableStyle was not overridden" location:CODELOCATION];
	return -1;
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
			return [NSIndexPath indexPathForRow:[section countOfData]-1 inSection:sectionIndex];
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
		index+=[thisSection countOfData];
	}
	
	return 0;
}

- (NSInteger) sectionIndexForIndex:(NSInteger)theindex
{
	int index = 0;
	int section = 0;
	
	for (TiUITableViewGroupSection * thisSection in sectionArray)
	{
		index+=[thisSection countOfData];
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
		int rowCount = [thisSection countOfData];
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

- (TiUITableViewRowProxy *) cellForIndexPath: (NSIndexPath *) path
{
	TiUITableViewGroupSection * thisSectionWrapper = [self sectionForIndex:[path section]];
	TiUITableViewRowProxy * result = [thisSectionWrapper objectInDataAtIndex:[path row]];
	return result;	
}


#pragma mark UI events

- (void)triggerActionForIndexPath: (NSIndexPath *)indexPath fromPath:(NSIndexPath*)fromPath wasAccessory: (BOOL) accessoryTapped search: (BOOL) viaSearch name:(NSString*)name
{
	int sectionIndex = [indexPath section];
	TiUITableViewGroupSection * section = [self sectionForIndex:sectionIndex];
	TiProxy * target = (section.proxy!=nil) && [section.proxy _hasListeners:name] ? section.proxy : (TiProxy*)self.proxy;
	
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
		if (thisSectionIndex == sectionIndex)
		{
			thisDataCellDict = [[[thisSection objectInDataAtIndex:row] allProperties] copy];
			break;
		}
		index += [thisSection countOfData];
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
//	CHECK_ROW_HEIGHT(rowHeight,[self cellForIndexPath:indexPath],tableview);
	return [tableview rowHeight];
}

- (NSInteger)tableView:(UITableView *)tableView indentationLevelForRowAtIndexPath:(NSIndexPath *)indexPath
{
	TiUITableViewRowProxy *cell = [self cellForIndexPath:indexPath];
	id indent = [cell valueForKey:@"indentionLevel"];
	return indent == nil ? 0 : [TiUtils intValue:indent];
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
	TiUITableViewRowProxy *rowWrapper = [sectionWrapper objectInDataAtIndex:[indexPath row]];
	id value = [rowWrapper valueForKey:@"indentOnEdit"];
	if (value!=nil)
	{
		return [TiUtils boolValue:value];
	}
	return YES;
}

#pragma mark UITableView Datasource configuration

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
	TiUITableViewGroupSection *sectionWrapper = [self sectionForIndex:[indexPath section]];
	TiUITableViewRowProxy *rowProxy = [sectionWrapper objectInDataAtIndex:[indexPath row]];

	TiUITableViewCell *result = [rowProxy cellForTableView:tableView];
	
	return result;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
	return [sectionArray count];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
	return [[self sectionForIndex:section] countOfData];
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
	TiUITableViewRowProxy *rowWrapper = [sectionWrapper objectInDataAtIndex:[indexPath row]];
	id editable_ = [rowWrapper valueForKey:@"editable"];
	
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
	TiUITableViewRowProxy *rowWrapper = [sectionWrapper objectInDataAtIndex:[indexPath row]];
	id amoveable = [rowWrapper valueForKey:@"moveable"];
	return amoveable==nil ? moving : [TiUtils boolValue:amoveable];
}

- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)fromIndexPath toIndexPath:(NSIndexPath *)toIndexPath
{	
	int fromSectionIndex = [fromIndexPath section];
	int toSectionIndex = [toIndexPath section];

	TiUITableViewGroupSection *fromSection = [self sectionForIndex:fromSectionIndex];
	TiUITableViewGroupSection *toSection = [self sectionForIndex:toSectionIndex];

	TiUITableViewRowProxy *rowWrapper = [fromSection objectInDataAtIndex:[fromIndexPath row]];
	[fromSection removeObjectFromDataAtIndex:[fromIndexPath row]];
	[toSection insertObject:rowWrapper inDataAtIndex:[toIndexPath row]];
	
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
			[self setData_:[args objectAtIndex:0]];
//			int newCount=[sectionArray count];
//			NSIndexSet * newRange = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, newCount)];
//			UITableViewRowAnimation animation = [self animationFromArgument:args atIndex:1];
//			if(oldRange > 0)
//			{
//				[tableview deleteSections:oldRange withRowAnimation:animation];
//			}
//			if(newRange > 0)
//			{
//				[tableview insertSections:newRange withRowAnimation:animation];
//			}
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
			[tableview beginUpdates];
			if(oldRange > 0)
			{
				[tableview deleteSections:oldRange withRowAnimation:animation];
			}
			if(newRange > 0)
			{
				[tableview insertSections:newRange withRowAnimation:animation];
			}
			[tableview endUpdates];

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
}

@end
