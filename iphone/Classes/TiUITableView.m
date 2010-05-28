/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import "TiUITableView.h"
#import "TiUtils.h"
#import "Webcolor.h"
#import "WebFont.h"
#import "ImageLoader.h"
#import "TiProxy.h"
#import "TiUIViewProxy.h"

#define DEFAULT_SECTION_HEADERFOOTER_HEIGHT 20.0

@implementation TiUITableViewCell

#pragma mark Touch event handling

// TODO: Replace callback cells with blocks by changing fireEvent: to take special-case
// code which will allow better interactions with UIControl elements (such as buttons)
// and table rows/cells.
-(id)initWithStyle:(UITableViewCellStyle)style_ reuseIdentifier:(NSString *)reuseIdentifier_ row:(TiUITableViewRowProxy *)row_
{
	if (self = [super initWithStyle:style_ reuseIdentifier:reuseIdentifier_]) {
		row = [row_ retain];
		[row setCallbackCell:self];
	}
	
	return self;
}

-(id)initWithFrame:(CGRect)frame_ reuseIdentifier:(NSString *)reuseIdentifier_ row:(TiUITableViewRowProxy *)row_
{
	if (self = [super initWithFrame:frame_ reuseIdentifier:reuseIdentifier_]) {
		row = [row_ retain];
		[row setCallbackCell:self];
	}
	
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(row);
	[super dealloc];
}

-(void)setHighlighted:(BOOL)yn
{
	[self setHighlighted:yn animated:NO];
}

-(void)setHighlighted:(BOOL)yn animated:(BOOL)animated
{
	[super setHighlighted:yn animated:animated];
	if (yn) 
	{
		if ([row _hasListeners:@"touchstart"])
		{
			[row fireEvent:@"touchstart" withObject:[row createEventObject:nil] propagate:YES];
		}
	}
	else
	{
		if ([row _hasListeners:@"touchend"]) {
			[row fireEvent:@"touchend" withObject:[row createEventObject:nil] propagate:YES];
		}
	}
}

-(void)handleEvent:(NSString*)type
{
	if ([type isEqual:@"touchstart"]) {
		[super setHighlighted:YES animated:NO];
	}
	else if ([type isEqual:@"touchend"]) {
		[super setHighlighted:NO animated:YES];
	}
}

@end

@implementation TiUITableView

#pragma mark Internal 

-(id)init
{
	if (self = [super init])
	{
		sections = [[NSMutableArray array] retain];
		filterCaseInsensitive = YES; // defaults to true on search
	}
	return self;
}


-(void)dealloc
{
	if (searchField!=nil)
	{
		[searchField setDelegate:nil];
		RELEASE_TO_NIL(searchField);
	}
	RELEASE_TO_NIL(tableController);
	RELEASE_TO_NIL(searchController);
	RELEASE_TO_NIL(sections);
	RELEASE_TO_NIL(tableview);
	RELEASE_TO_NIL(sectionIndex);
	RELEASE_TO_NIL(sectionIndexMap);
	RELEASE_TO_NIL(tableHeaderView);
	RELEASE_TO_NIL(searchScreenView);
	RELEASE_TO_NIL(searchTableView);
	RELEASE_TO_NIL(filterAttribute);
	RELEASE_TO_NIL(searchResultIndexes);
	RELEASE_TO_NIL(initialSelection);
	[super dealloc];
}

-(CGFloat)tableRowHeight:(CGFloat)height
{
	if (TiDimensionIsPixels(rowHeight))
	{
		if (rowHeight.value > height)
		{
			height = rowHeight.value;
		}
	}
	if (TiDimensionIsPixels(minRowHeight))
	{
		height = MAX(minRowHeight.value,height);
	}
	if (TiDimensionIsPixels(maxRowHeight))
	{
		height = MIN(maxRowHeight.value,height);
	}
	return height < 1 ? tableview.rowHeight : height;
}

-(UITableView*)tableView
{
	if (tableview==nil)
	{
		UITableViewStyle style = [TiUtils intValue:[self.proxy valueForKey:@"style"] def:UITableViewStylePlain];
		tableview = [[UITableView alloc] initWithFrame:CGRectMake(0, 0, [self bounds].size.width, [self bounds].size.height) style:style];
		tableview.delegate = self;
		tableview.dataSource = self;
		tableview.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
		tableview.backgroundColor = style == UITableViewStylePlain ? [UIColor whiteColor] : [UIColor groupTableViewBackgroundColor];
		tableview.opaque = YES;
		[self updateSearchView];
	}
	if ([tableview superview] != self)
	{
		[self addSubview:tableview];
	}
	
	return tableview;
}

-(NSInteger)indexForRow:(TiUITableViewRowProxy*)row
{
	int index = 0;
	for (TiUITableViewSectionProxy * thisSection in sections)
	{
		if (thisSection == row.section)
		{
			return index + row.row;
		}
		index+=[thisSection rowCount];
	}
	return index;
}

-(NSInteger)sectionIndexForIndex:(NSInteger)theindex
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

-(NSArray*)sections
{
	return sections;
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

-(void)reloadDataFromCount:(int)oldCount toCount:(int)newCount animation:(UITableViewRowAnimation)animation
{
	UITableView *table = [self tableView];

	if ((animation == UITableViewRowAnimationNone) && ![tableview isEditing])
	{
		[tableview reloadData];
		return;
	}

	int commonality = MIN(oldCount,newCount);
	oldCount -= commonality;
	newCount -= commonality;
	
	[tableview beginUpdates];
	if (commonality > 0)
	{
		[table reloadSections:[NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, commonality)]
				withRowAnimation:animation];
	}
	if (oldCount > 0)
	{
		[table deleteSections:[NSIndexSet indexSetWithIndexesInRange:NSMakeRange(commonality,oldCount)]
				withRowAnimation:animation];
	}
	if (newCount > 0)
	{
		[table insertSections:[NSIndexSet indexSetWithIndexesInRange:NSMakeRange(commonality,newCount)]
				withRowAnimation:animation];
	}
	[tableview endUpdates];
}

-(void)replaceData:(UITableViewRowAnimation)animation
{
//Technically, we should assert that sections is non-nil, but this code
//won't have any problems in the case that it is actually nil.	
	TiProxy * ourProxy = [self proxy];
	
	int oldCount = [sections count];

	for (TiUITableViewSectionProxy *section in sections)
	{
		if ([section parent] == ourProxy)
		{
			[section setTable:nil];
			[section setParent:nil];
		}
	}
	RELEASE_TO_NIL(sections);

	NSArray *newsections = [ourProxy valueForKey:@"data"];
	// get new data array from the proxy
	sections = [newsections mutableCopy];	//Mutablecopy is faster than adding one by one.

	int newCount = 0;	//Since we're iterating anyways, we might as well not get count.

	for (TiUITableViewSectionProxy *section in sections)
	{
		[section setTable:self];
		[section setParent:ourProxy];
		[section setSection:newCount ++];
		[section reorderRows];
		//TODO: Shouldn't this be done by Section itself? Doesn't it already?
		for (TiUITableViewRowProxy *row in section)
		{
			row.section = section;
			row.parent = section;
		}
	}

	[self reloadDataFromCount:oldCount toCount:newCount animation:animation];
}

-(void)updateRow:(TiUITableViewRowProxy*)row
{
	NSAssert(sections!=nil,@"sections was nil");
	row.table = self;
	NSMutableArray *rows = [row.section rows];
	[rows replaceObjectAtIndex:row.row withObject:row];
	[row.section reorderRows];
}

-(void)insertRow:(TiUITableViewRowProxy*)row before:(TiUITableViewRowProxy*)before 
{
	NSAssert(sections!=nil,@"sections was nil");
	row.table = self;
	row.section = before.section;
	NSMutableArray *rows = [row.section rows];
	[rows insertObject:row atIndex:row.row];
	[row.section reorderRows];
}

-(void)insertRow:(TiUITableViewRowProxy*)row after:(TiUITableViewRowProxy*)after 
{
	NSAssert(sections!=nil,@"sections was nil");
	row.table = self;
	row.section = after.section;
	NSMutableArray *rows = [row.section rows];
	if (after.row + 1 == [rows count])
	{
		[rows addObject:row];
	}
	else
	{
		[rows insertObject:row atIndex:after.row+1];
	}
	[row.section reorderRows];
}

-(void)deleteRow:(TiUITableViewRowProxy*)row
{
	NSAssert(sections!=nil,@"sections was nil");
	[[row retain] autorelease];
	NSMutableArray *rows = [row.section rows];
	[rows removeObject:row];
	[row.section reorderRows];
}

-(void)appendRow:(TiUITableViewRowProxy*)row 
{
	NSAssert(sections!=nil,@"sections was nil");
	row.table = self;
	TiUITableViewSectionProxy *section = [sections lastObject];
	row.section = section;
    [section add:row];
	[row.section reorderRows];
}

-(void)dispatchAction:(TiUITableViewAction*)action
{
	ENSURE_UI_THREAD(dispatchAction,action);
	
	UITableView *table = [self tableView];
	
	switch (action.type)
	{
		case TiUITableViewActionRowReload:
		{
			NSIndexPath *path = [NSIndexPath indexPathForRow:action.row.row inSection:action.row.section.section];
			[tableview reloadRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:action.animation];
			break;
		}
		case TiUITableViewActionUpdateRow:
		{
			[self updateRow:action.row];
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
		{
			int index = action.row.row;
			TiUITableViewRowProxy *oldrow = [[action.row.section rows] objectAtIndex:index];
			[self insertRow:action.row before:oldrow];
			NSIndexPath *path = [NSIndexPath indexPathForRow:action.row.row inSection:action.row.section.section];
			[tableview insertRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:action.animation];
			break;
		}
		case TiUITableViewActionInsertRowAfter:
		{
			int index = action.row.row-1;
			TiUITableViewRowProxy *oldrow = nil;
			if (index < [[action.row.section rows] count])
			{
				oldrow = [[action.row.section rows] objectAtIndex:index];
			}
			[self insertRow:action.row after:oldrow];
			NSIndexPath *path = [NSIndexPath indexPathForRow:action.row.row inSection:action.row.section.section];
			[tableview insertRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:action.animation];
			break;
		}
		case TiUITableViewActionDeleteRow:
		{
			[self deleteRow:action.row];
			NSIndexPath *path = [NSIndexPath indexPathForRow:action.row.row inSection:action.row.section.section];
			[tableview deleteRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:action.animation];
			break;
		}
		case TiUITableViewActionSetData:
		{
			[self replaceData:action.animation];
			break;
		}
		case TiUITableViewActionAppendRow:
		{
			[self appendRow:action.row];
			NSIndexPath *path = [NSIndexPath indexPathForRow:action.row.row inSection:action.row.section.section];
			[tableview insertRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:action.animation];
			break;
		}
        case TiUITableViewActionAppendRowWithSection:
        {
            [sections addObject:action.row.section];
            [self appendRow:action.row];
            [tableview insertSections:[NSIndexSet indexSetWithIndex:[sections count]-1] withRowAnimation:action.animation];
            break;
        }
	}
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
    headerLabel.numberOfLines = 0;
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

-(void)setBounds:(CGRect)bounds
{
    [super setBounds:bounds];
    
    // Since the header proxy is not properly attached to a view proxy in the titanium
    // system, we have to reposition it here.  Resetting the table header view
    // is because there's a charming bug in UITableView that doesn't respect redisplay
    // for headers/footers when the frame changes.
    UIView* headerView = [[self tableView] tableHeaderView];
    if ([headerView isKindOfClass:[TiUIView class]]) {
        [(TiUIViewProxy*)[(TiUIView*)headerView proxy] reposition];
        [[self tableView] setTableHeaderView:headerView];
    }
    
    // ... And we have to do the same thing for the footer.
    UIView* footerView = [[self tableView] tableFooterView];
    if ([footerView isKindOfClass:[TiUIView class]]) {
        [(TiUIViewProxy*)[(TiUIView*)footerView proxy] reposition];
        [[self tableView] setTableFooterView:footerView];
    }
}

- (void)triggerActionForIndexPath:(NSIndexPath *)indexPath fromPath:(NSIndexPath*)fromPath tableView:(UITableView*)ourTableView wasAccessory: (BOOL)accessoryTapped search:(BOOL)viaSearch name:(NSString*)name
{
	NSIndexPath* index = indexPath;
	if (viaSearch) {
		index = [self indexPathFromSearchIndex:[indexPath row]];
	}
	int sectionIdx = [index section];
	TiUITableViewSectionProxy *section = [sections objectAtIndex:sectionIdx];
	
	int rowIndex = [index row];
	int dataIndex = 0;
	int c = 0;
	TiUITableViewRowProxy *row = [section rowAtIndex:rowIndex];
	
	// unfortunately, we have to scan to determine our row index
	for (TiUITableViewSectionProxy *section in sections)
	{
		if (c == sectionIdx)
		{
			dataIndex += rowIndex;
			break;
		}
		dataIndex += [section rowCount];
		c++;
	}
	
	NSMutableDictionary * eventObject = [NSMutableDictionary dictionaryWithObjectsAndKeys:
										 section,@"section",
										 NUMINT(dataIndex),@"index",
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
	
	// fire it to our row since the row, section and table are
	// in a hierarchy and it will bubble up from there...

	UITableViewCell * thisCell = [ourTableView cellForRowAtIndexPath:indexPath];
	
	TiProxy * target = [row touchedViewProxyInCell:thisCell];

	if ([target _hasListeners:name])
	{
		[target fireEvent:name withObject:eventObject];
	}	
	
	if (viaSearch) {
		[self hideSearchScreen:nil];
	}
}

#pragma mark Searchbar-related accessors

- (UIButton *) searchScreenView
{
	if (searchScreenView == nil) 
	{
		searchScreenView = [[UIButton alloc] init];
		[searchScreenView addTarget:self action:@selector(hideSearchScreen:) forControlEvents:UIControlEventTouchUpInside];
		[searchScreenView setShowsTouchWhenHighlighted:NO];
		[searchScreenView setAdjustsImageWhenDisabled:NO];
		[searchScreenView setOpaque:NO];
		[searchScreenView setBackgroundColor:[UIColor blackColor]];
	}
	return searchScreenView;
}


- (UITableView *) searchTableView
{
	if(searchTableView == nil)
	{
		CGRect searchFrame = [TiUtils viewPositionRect:[self searchScreenView]];
		//Todo: make sure we account for the keyboard.
		searchTableView = [[UITableView alloc] initWithFrame:searchFrame style:UITableViewStylePlain];
		[searchTableView setDelegate:self];
		[searchTableView setDataSource:self];
	}
	return searchTableView;
}


#pragma mark Searchbar helper methods

- (NSIndexPath *) indexPathFromSearchIndex: (int) index
{
	int asectionIndex = 0;
	for (NSIndexSet * thisSet in searchResultIndexes) 
	{
		int thisSetCount = [thisSet count];
		if(index < thisSetCount)
		{
			int rowIndex = [thisSet firstIndex];
			while (index > 0) 
			{
				rowIndex = [thisSet indexGreaterThanIndex:rowIndex];
				index --;
			}
			return [NSIndexPath indexPathForRow:rowIndex inSection:asectionIndex];
		}
		asectionIndex++;
		index -= thisSetCount;
	}
	return nil;
}

- (void)updateSearchResultIndexesForString:(NSString *) searchString
{
	NSEnumerator * searchResultIndexEnumerator;
	if(searchResultIndexes == nil)
	{
		searchResultIndexes = [[NSMutableArray alloc] initWithCapacity:[sections count]];
		searchResultIndexEnumerator = nil;
	} 
	else 
	{
		searchResultIndexEnumerator = [searchResultIndexes objectEnumerator];
	}
	
	//TODO: If the search is adding letters to the previous search string, do it by elimination instead of adding.
	
	NSString * ourSearchAttribute = filterAttribute;
	if(ourSearchAttribute == nil)
	{
		ourSearchAttribute = @"title";
	}
	
	NSStringCompareOptions searchOpts = (filterCaseInsensitive ? NSCaseInsensitiveSearch : 0);
	
	for (TiUITableViewSectionProxy * thisSection in sections) 
	{
		NSMutableIndexSet * thisIndexSet = [searchResultIndexEnumerator nextObject];
		if (thisIndexSet == nil)
		{
			searchResultIndexEnumerator = nil; //Make sure we don't use the enumerator anymore. 
			thisIndexSet = [NSMutableIndexSet indexSet];
			[searchResultIndexes addObject:thisIndexSet];
		} 
		else 
		{
			[thisIndexSet removeAllIndexes];
		}
		int cellIndex = 0;
		for (TiUITableViewRowProxy *row in [thisSection rows]) 
		{
			id value = [row valueForKey:ourSearchAttribute];
			if (value!=nil && [[TiUtils stringValue:value] rangeOfString:searchString options:searchOpts].location!=NSNotFound)
			{
				[thisIndexSet addIndex:cellIndex];
			}
			cellIndex ++;
		}
	}
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (searchHidden)
	{
		if (searchField!=nil && searchHiddenSet)
		{
			[self performSelector:@selector(hideSearchScreen:) withObject:self];
		}
	}
	else 
	{
		if (tableview!=nil && searchField!=nil)
		{
			[tableview setContentOffset:CGPointMake(0,0)];
		}
	}
	int sectionCount = [sections count];
	[self reloadDataFromCount:sectionCount toCount:sectionCount animation:UITableViewRowAnimationNone];
}

#pragma mark Searchbar-related IBActions

- (IBAction) hideSearchScreen: (id) sender
{
	// check to make sure we're not in the middle of a layout, in which case we 
	// want to try later or we'll get weird drawing animation issues
	if (tableview.frame.size.width==0)
	{
		[self performSelector:@selector(hideSearchScreen:) withObject:sender afterDelay:0.1];
		return;
	}
	
	[[searchField view] resignFirstResponder];
	[self makeRootViewFirstResponder];
	[searchTableView removeFromSuperview];
	[tableview setScrollEnabled:YES];
	[self.proxy replaceValue:NUMBOOL(YES) forKey:@"searchHidden" notification:NO];
	[searchController setActive:NO animated:YES];
	
	[tableview reloadRowsAtIndexPaths:[tableview indexPathsForVisibleRows] withRowAnimation:UITableViewRowAnimationNone];

	if (sender==nil)
	{
		[UIView beginAnimations:@"searchy" context:nil];
	}
	if (searchHidden)
	{
		[tableview setContentOffset:CGPointMake(0,MAX(TI_NAVBAR_HEIGHT,searchField.view.frame.size.height)) animated:NO];
	}
	if (sender==nil)
	{
		[UIView commitAnimations];
	}
}

-(void)scrollToTop:(NSInteger)top animated:(BOOL)animated
{
	[tableview setContentOffset:CGPointMake(0,top) animated:animated];
}

- (IBAction) showSearchScreen: (id) sender
{
	if ([sections count]>0)
	{
		[tableview scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]
						 atScrollPosition:UITableViewScrollPositionBottom animated:NO];
	}
	[tableview setScrollEnabled:NO];
	
	CGRect screenRect = [TiUtils viewPositionRect:tableview];
	CGFloat searchHeight = [[tableview tableHeaderView] bounds].size.height;
	
	screenRect.origin.y += searchHeight;
	screenRect.size.height -= searchHeight;
	
	UIView * wrapperView = [tableview superview];
	if ([[self searchScreenView] superview] != wrapperView) 
	{
//		[searchScreenView setAlpha:0.0];
//		[wrapperView insertSubview:searchScreenView aboveSubview:tableview];
	}
//	[TiUtils setView:searchScreenView positionRect:screenRect];
	
	[UIView beginAnimations:@"searchy" context:nil];
//	[searchScreenView setEnabled:YES];
//	[searchScreenView setAlpha:0.85];
	[tableview setContentOffset:CGPointMake(0,0)];
	[UIView commitAnimations];
}

-(void)updateSearchView
{
	if (tableview == nil)
	{
		return;
	}
	
	if (searchField == nil)
	{
		[tableview setTableHeaderView:nil];
		RELEASE_TO_NIL(tableHeaderView);
		RELEASE_TO_NIL(searchTableView);
		RELEASE_TO_NIL(searchScreenView);
		RELEASE_TO_NIL(searchResultIndexes);
		return;
	}
	
	UIView * searchView = [searchField view];
	
	if (tableHeaderView == nil)
	{
		CGRect wrapperFrame = CGRectMake(0, 0, [tableview bounds].size.width, TI_NAVBAR_HEIGHT);
		tableHeaderView = [[UIView alloc] initWithFrame:wrapperFrame];
		[TiUtils setView:searchView positionRect:wrapperFrame];
		[tableHeaderView addSubview:searchView];
		[tableview setTableHeaderView:tableHeaderView];
		[searchView sizeToFit];
	}
}

#pragma mark Search Bar Delegate

- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar
{
	// called when text starts editing
	[self showSearchScreen:nil];
}

- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText
{
	// called when text changes (including clear)
	if([searchText length]==0)
	{
		// Redraw visible cells
		[tableview reloadRowsAtIndexPaths:[tableview indexPathsForVisibleRows] withRowAnimation:UITableViewRowAnimationNone];
		[searchTableView removeFromSuperview];
		return;
	}
	[self updateSearchResultIndexesForString:searchText];
	
	UIView * wrapperView = [searchScreenView superview];	
	if([searchTableView superview] != wrapperView)
	{
		if(searchTableView == nil)
		{
			[self searchTableView];
		} 
		else 
		{
			[searchTableView reloadSections:[NSIndexSet indexSetWithIndex:0]
						   withRowAnimation:UITableViewRowAnimationFade];
		}
//		[wrapperView insertSubview:searchTableView aboveSubview:searchScreenView];
	} 
	else 
	{
		[searchTableView reloadSections:[NSIndexSet indexSetWithIndex:0]
					   withRowAnimation:UITableViewRowAnimationFade];
	}
}

- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar                    
{
	// called when keyboard search button pressed
	[searchBar resignFirstResponder];
	[self makeRootViewFirstResponder];
}

- (void)searchBarCancelButtonClicked:(UISearchBar *) searchBar
{
	// called when cancel button pressed
	[searchBar setText:nil];
	[self hideSearchScreen:nil];
}

#pragma mark Section Header / Footer

-(TiUIView*)sectionView:(NSInteger)section forLocation:(NSString*)location section:(TiUITableViewSectionProxy**)sectionResult
{
	TiUITableViewSectionProxy *proxy = [sections objectAtIndex:section];
	if (sectionResult!=nil)
	{
		*sectionResult = proxy;
	}
	TiViewProxy* viewproxy = [proxy valueForKey:location];
	if (viewproxy!=nil && [viewproxy isKindOfClass:[TiViewProxy class]])
	{
		return [viewproxy view];
	}
	return nil;
}

#pragma mark Public APIs

-(void)scrollToIndex:(NSInteger)index position:(UITableViewScrollPosition)position animated:(BOOL)animated
{
	UITableView *table = [self tableView];
	NSIndexPath *path = [self indexPathFromInt:index];
	[table scrollToRowAtIndexPath:path atScrollPosition:position animated:animated];
}

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
    
    self.backgroundImage = arg;
}

-(void)setAllowsSelection_:(id)arg
{
	allowsSelectionSet = [TiUtils boolValue:arg];
	[[self tableView] setAllowsSelection:allowsSelectionSet];
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

-(void)setHeaderView_:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,TiViewProxy);
	if (args!=nil)
	{
		TiUIView *view = (TiUIView*) [args view];
		UITableView *table = [self tableView];
		[table setTableHeaderView:view];
	}
	else
	{
		[[self tableView] setTableHeaderView:nil];
	}
}

-(void)setFooterView_:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,TiViewProxy);
	if (args!=nil)
	{
		UIView *view = [args view];
		[[self tableView] setTableFooterView:view];
	}
	else
	{
		[[self tableView] setTableFooterView:nil];
	}
}

-(void)setSearch_:(id)search
{
	ENSURE_TYPE_OR_NIL(search,TiUISearchBarProxy);
	if (searchField!=nil)
	{
		[searchField setDelegate:nil];
	}
	RELEASE_TO_NIL(searchField);
	RELEASE_TO_NIL(tableController);
	RELEASE_TO_NIL(searchController);
	
	if (search!=nil)
	{
		//TODO: now that we're using the search controller, we can move away from
		//doing our own custom search screen since the controller gives this to us
		//for free
		searchField = [search retain];
		[searchField setDelegate:self];
		tableController = [[UITableViewController alloc] init];
		tableController.tableView = [self tableView];
		searchController = [[UISearchDisplayController alloc] initWithSearchBar:[search searchBar] contentsController:tableController];
		searchController.searchResultsDataSource = self;
		searchController.searchResultsDelegate = self;
		searchController.delegate = self;
		
		if (searchHiddenSet==NO)
		{
			return;
		}
		
		if (searchHidden)
		{
			[self hideSearchScreen:nil];
			return;
		}
		searchHidden = NO;
		[self.proxy replaceValue:NUMBOOL(NO) forKey:@"searchHidden" notification:NO];
	}
	else 
	{
		searchHidden = YES;
		[self.proxy replaceValue:NUMBOOL(NO) forKey:@"searchHidden" notification:NO];
	}
}

-(void)configurationSet
{
	[super configurationSet];
	
	if ([self.proxy valueForUndefinedKey:@"searchHidden"]==nil && 
		[self.proxy valueForUndefinedKey:@"search"]==nil)
	{
		searchHidden = YES;
		[self.proxy replaceValue:NUMBOOL(YES) forKey:@"searchHidden" notification:NO];
	}
}

-(void)setSearchHidden_:(id)hide
{
	searchHiddenSet = YES;
	
	if ([TiUtils boolValue:hide])
	{
		searchHidden=YES;
		if (searchField)
		{
			[self hideSearchScreen:nil];
		}
	}
	else 
	{
		searchHidden=NO;
		if (searchField)
		{
			[self showSearchScreen:nil];
		}
	}
}

- (void)setFilterAttribute_:(id)newFilterAttribute
{
	ENSURE_STRING_OR_NIL(newFilterAttribute);
	if (newFilterAttribute == filterAttribute) 
	{
		return;
	}
	RELEASE_TO_NIL(filterAttribute);
	filterAttribute = [newFilterAttribute copy];
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
    
    [[self tableView] reloadData]; // HACK - Should just reload section indexes when reloadSelectionIndexTitles functions properly.
    //[[self tableView] reloadSectionIndexTitles];  THIS DOESN'T WORK.
}

-(void)setFilterCaseInsensitive_:(id)caseBool
{
	filterCaseInsensitive = [TiUtils boolValue:caseBool];
}

-(void)setEditable_:(id)args
{
	editable = [TiUtils boolValue:args];
}

-(void)setMoveable_:(id)args
{
	moveable = [TiUtils boolValue:args];
}

-(void)setEditing_:(id)args withObject:(id)properties
{
	[self changeEditing:[TiUtils boolValue:args]];
	UITableView *table = [self tableView];
	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
	[table beginUpdates];
	[table setEditing:moving||editing animated:animated];
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

#pragma mark Datasource 


#define RETURN_IF_SEARCH_TABLE_VIEW(result)	\
if(ourTableView != tableview)	\
{	\
	return result;	\
}

- (NSInteger)tableView:(UITableView *)table numberOfRowsInSection:(NSInteger)section
{
	if(table != tableview)
	{
		int rowCount = 0;
		for (NSIndexSet * thisSet in searchResultIndexes) 
		{
			rowCount += [thisSet count];
		}
		return rowCount;
	}
	
	if (sections!=nil)
	{
		TiUITableViewSectionProxy *sectionProxy = [sections objectAtIndex:section];
		return sectionProxy.rowCount;
	}
	return 0;
}

// Row display. Implementers should *always* try to reuse cells by setting each cell's reuseIdentifier and querying for available reusable cells with dequeueReusableCellWithIdentifier:
// Cell gets various attributes set automatically based on table (separators) and data source (accessory views, editing controls)

- (UITableViewCell *)tableView:(UITableView *)ourTableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
	NSIndexPath* index = indexPath;
	if (ourTableView != tableview) {
		index = [self indexPathFromSearchIndex:[indexPath row]];
	}
	
	TiUITableViewRowProxy *row = [self rowForIndexPath:index];
	
	// the classname for all rows that have the same substainal layout will be the same
	// we reuse them for speed
	UITableViewCell *cell = [ourTableView dequeueReusableCellWithIdentifier:row.tableClass];
	if (cell == nil)
	{
		cell = [[[TiUITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:row.tableClass row:row] autorelease];
		[row initializeTableViewCell:cell];
	}
	else
	{
		// in the case of a reuse, we need to tell the row proxy to update the data
		// in the re-used cell with this proxy's contents
		[row renderTableViewCell:cell];
	}
	
	return cell;
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)ourTableView
{
	RETURN_IF_SEARCH_TABLE_VIEW(1);
	return sections!=nil ? [sections count] : 0;
}

- (NSString *)tableView:(UITableView *)ourTableView titleForHeaderInSection:(NSInteger)section
{
	RETURN_IF_SEARCH_TABLE_VIEW(nil);
	TiUITableViewSectionProxy *sectionProxy = [sections objectAtIndex:section];
	return [sectionProxy headerTitle];
}

- (NSString *)tableView:(UITableView *)ourTableView titleForFooterInSection:(NSInteger)section
{
	RETURN_IF_SEARCH_TABLE_VIEW(nil);
	TiUITableViewSectionProxy *sectionProxy = [sections objectAtIndex:section];
	return [sectionProxy footerTitle];
}

// After a row has the minus or plus button invoked (based on the UITableViewCellEditingStyle for the cell), the dataSource must commit the change
- (void)tableView:(UITableView *)ourTableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath
{
	RETURN_IF_SEARCH_TABLE_VIEW();
	if (editingStyle==UITableViewCellEditingStyleDelete)
	{
		TiUITableViewSectionProxy *section = [sections objectAtIndex:[indexPath section]];
		NSInteger index = [self indexForIndexPath:indexPath];
		UITableView *table = [self tableView];
		NSIndexPath *path = [self indexPathFromInt:index];
		
		// note, trigger action before the update since on the last delete it will be gone..
		[self triggerActionForIndexPath:indexPath fromPath:nil tableView:ourTableView wasAccessory:NO search:NO name:@"delete"];
		
		[[section rows] removeObjectAtIndex:[indexPath row]];
        
        // If the section is empty, we want to remove it as well.
        BOOL emptySection = ([[section rows] count] == 0);
        if (emptySection) {
            [sections removeObjectAtIndex:[indexPath section]];
        }

		[table beginUpdates];
        [table deleteRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:UITableViewRowAnimationFade];
        if (emptySection) {
            [table deleteSections:[NSIndexSet indexSetWithIndex:[indexPath section]] withRowAnimation:UITableViewRowAnimationFade];
        }
		[table endUpdates];
	}
}

// Individual rows can opt out of having the -editing property set for them. If not implemented, all rows are assumed to be editable.
- (BOOL)tableView:(UITableView *)ourTableView canEditRowAtIndexPath:(NSIndexPath *)indexPath
{
	RETURN_IF_SEARCH_TABLE_VIEW(NO);
	
	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];

	//If editable, then this is always true.
	if ([TiUtils boolValue:[row valueForKey:@"editable"] def:editable])
	{
		return YES;
	}

	//Elsewhise, when not editing nor moving, return NO, so that swipes don't trigger.

	if (!editing && !moving)
	{
		return NO;
	}

	//Otherwise, when editing or moving, make sure that both can be done.
	
	return [TiUtils boolValue:[row valueForKey:@"moveable"] def:moving || moveable] || [TiUtils boolValue:[row valueForKey:@"editable"] def:editing];
	
	//Why are we checking editable twice? Well, once it's with the default of editable. The second time with the default of editing.
	//Effectively, editable is being tri-state.
}

- (BOOL)tableView:(UITableView *)ourTableView shouldIndentWhileEditingRowAtIndexPath:(NSIndexPath *)indexPath
{
	RETURN_IF_SEARCH_TABLE_VIEW(NO);
	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];

	return [TiUtils boolValue:[row valueForKey:@"indentOnEdit"] def:editing];
}

// Allows the reorder accessory view to optionally be shown for a particular row. By default, the reorder control will be shown only if the datasource implements -tableView:moveRowAtIndexPath:toIndexPath:
- (BOOL)tableView:(UITableView *)ourTableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
	RETURN_IF_SEARCH_TABLE_VIEW(NO);

	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];
	return [TiUtils boolValue:[row valueForKey:@"moveable"] def:moving || moveable];
}

// Allows customization of the editingStyle for a particular cell located at 'indexPath'. If not implemented, all editable cells will have UITableViewCellEditingStyleDelete set for them when the table has editing property set to YES.
- (UITableViewCellEditingStyle)tableView:(UITableView *)ourTableView editingStyleForRowAtIndexPath:(NSIndexPath *)indexPath
{
	RETURN_IF_SEARCH_TABLE_VIEW(UITableViewCellEditingStyleNone);
	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];

	//Yes, this looks similar to canEdit, but here we need to make the distinction between moving and editing.
	
	//Actually, it's easier than that. editable or editing causes this to default true. Otherwise, it's the editable flag.
	if ([TiUtils boolValue:[row valueForKey:@"editable"] def:editable || editing])
	{
		return UITableViewCellEditingStyleDelete;
	}
	return UITableViewCellEditingStyleNone;
}


- (void)tableView:(UITableView *)ourTableView moveRowAtIndexPath:(NSIndexPath *)sourceIndexPath toIndexPath:(NSIndexPath *)destinationIndexPath
{
	RETURN_IF_SEARCH_TABLE_VIEW();
	int fromSectionIndex = [sourceIndexPath section];
	int toSectionIndex = [destinationIndexPath section];
	
	TiUITableViewSectionProxy *fromSection = [sections objectAtIndex:fromSectionIndex];
	TiUITableViewSectionProxy *toSection = fromSectionIndex!=toSectionIndex ? [sections objectAtIndex:toSectionIndex] : fromSection;
	
	TiUITableViewRowProxy *fromRow = [fromSection rowAtIndex:[sourceIndexPath row]];
	TiUITableViewRowProxy *toRow = [toSection rowAtIndex:[destinationIndexPath row]];
	
	// hold during the move in case the array is the last guy holding the retain count
	[fromRow retain];
	[toRow retain];
	
	[[fromSection rows] removeObjectAtIndex:[sourceIndexPath row]];
	[[toSection rows] insertObject:fromRow atIndex:[destinationIndexPath row]];
	
	// rewire our properties
	fromRow.section = toSection;
	toRow.section = fromSection;
	
	fromRow.row = [destinationIndexPath row];
	toRow.row = [sourceIndexPath row];
	
	// now we can release from our retain above
	[fromRow autorelease];
	[toRow autorelease];
	
	[self triggerActionForIndexPath:destinationIndexPath fromPath:sourceIndexPath tableView:ourTableView wasAccessory:NO search:NO name:@"move"];
}

#pragma mark Collation

- (NSArray *)sectionIndexTitlesForTableView:(UITableView *)ourTableView
{
	RETURN_IF_SEARCH_TABLE_VIEW(nil);
	if (sectionIndex!=nil && editing==NO)
	{
		return sectionIndex;
	}
	return nil;
}

- (NSInteger)tableView:(UITableView *)ourTableView sectionForSectionIndexTitle:(NSString *)title atIndex:(NSInteger)index
{
	if (sectionIndexMap!=nil)
	{
		// get the section for the row index
		int index = [[sectionIndexMap objectForKey:title] intValue];
		return [self sectionIndexForIndex:index];
	}
	return 0;
}

-(void)selectRow:(id)args
{
	NSInteger index = [TiUtils intValue:[args objectAtIndex:0]];
	NSIndexPath *path = [self indexPathFromInt:index];
	if (initiallyDisplayed==NO)
	{
		RELEASE_TO_NIL(initialSelection);
		initialSelection = [path retain];
		return;
	}
	NSDictionary *dict = [args count] > 1 ? [args objectAtIndex:1] : nil;
	BOOL animated = [TiUtils boolValue:@"animated" properties:dict def:YES];
	int scrollPosition = [TiUtils intValue:@"position" properties:dict def:UITableViewScrollPositionMiddle];
	[[self tableView] selectRowAtIndexPath:path animated:animated scrollPosition:scrollPosition];
}

-(void)deselectRow:(id)args
{
	NSInteger index = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *dict = [args count] > 1 ? [args objectAtIndex:1] : nil;
	BOOL animated = [TiUtils boolValue:@"animated" properties:dict def:YES];
	NSIndexPath *path = [self indexPathFromInt:index];
	[[self tableView] deselectRowAtIndexPath:path animated:animated];
}

#pragma mark Delegate

- (void)tableView:(UITableView *)ourTableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
	BOOL search = NO;
	if (allowsSelectionSet==NO || [ourTableView allowsSelection]==NO)
	{
		[ourTableView deselectRowAtIndexPath:indexPath animated:YES];
	}
	if(ourTableView != tableview)
	{
		search = YES;
	}
	[self triggerActionForIndexPath:indexPath fromPath:nil tableView:ourTableView wasAccessory:NO search:search name:@"click"];
}


-(void)tableView:(UITableView *)ourTableView willDisplayCell:(UITableViewCell *)cell forRowAtIndexPath:(NSIndexPath *)indexPath
{
	NSIndexPath* index = indexPath;
	if (ourTableView != tableview) {
		index = [self indexPathFromSearchIndex:[indexPath row]];
	}
	
	TiUITableViewRowProxy *row = [self rowForIndexPath:index];
	
	NSString *color = [row valueForKey:@"backgroundColor"];
	if (color==nil)
	{
		color = [self.proxy valueForKey:@"rowBackgroundColor"];
		if (color==nil)
		{
			color = [self.proxy valueForKey:@"backgroundColor"];
		}
	}
	if (color!=nil)
	{
		cell.backgroundColor = UIColorWebColorNamed(color);
	}
	
	if (tableview == ourTableView) {
		TiUITableViewSectionProxy *section = [sections objectAtIndex:[indexPath section]];
		if (initiallyDisplayed==NO && [indexPath section]==[sections count]-1 && [indexPath row]==[section rowCount]-1)
		{
			// we need to track when we've initially rendered the last row
			initiallyDisplayed = YES;
			
			// trigger the initial selection
			if (initialSelection!=nil)
			{
				// we seem to have to do this after this has fully completed so we 
				// just spin off and do this just a few ms later
				NSInteger index = [self indexForIndexPath:initialSelection];
				NSDictionary *dict = [NSDictionary dictionaryWithObject:NUMBOOL(NO) forKey:@"animated"];
				NSArray *args = [NSArray arrayWithObjects:NUMINT(index),dict,nil];
				[self performSelector:@selector(selectRow:) withObject:args afterDelay:0.09];
				RELEASE_TO_NIL(initialSelection);
			}
		}
	}
}

- (NSString *)tableView:(UITableView *)ourTableView titleForDeleteConfirmationButtonForRowAtIndexPath:(NSIndexPath *)indexPath
{
	RETURN_IF_SEARCH_TABLE_VIEW(nil);
	TiUITableViewRowProxy * ourRow = [self rowForIndexPath:indexPath];
	NSString * result = [TiUtils stringValue:[ourRow valueForKey:@"deleteButtonTitle"]];
	if (result == nil)
	{
		result = [[self proxy] valueForKey:@"deleteButtonTitle"];
	}

	if (result == nil)
	{
		result = NSLocalizedString(@"Delete",@"Table View Delete Confirm");
	}
	return result;
}

- (void)tableView:(UITableView *)ourTableView accessoryButtonTappedForRowWithIndexPath:(NSIndexPath *)indexPath
{
	[self triggerActionForIndexPath:indexPath fromPath:nil tableView:ourTableView wasAccessory:YES search:NO name:@"click"];
}

- (NSInteger)tableView:(UITableView *)ourTableView indentationLevelForRowAtIndexPath:(NSIndexPath *)indexPath
{
	RETURN_IF_SEARCH_TABLE_VIEW(0);

	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];
	id indent = [row valueForKey:@"indentionLevel"];
	return indent == nil ? 0 : [TiUtils intValue:indent];
}

- (CGFloat)tableView:(UITableView *)ourTableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
	NSIndexPath* index = indexPath;
	if (ourTableView != tableview) {
		index = [self indexPathFromSearchIndex:[indexPath row]];
	}
	
	TiUITableViewRowProxy *row = [self rowForIndexPath:index];
	CGFloat height = [row rowHeight:tableview.bounds];
	height = [self tableRowHeight:height];
	return height < 1 ? tableview.rowHeight : height;
}

- (UIView *)tableView:(UITableView *)ourTableView viewForHeaderInSection:(NSInteger)section
{
	RETURN_IF_SEARCH_TABLE_VIEW(nil);
	return [self sectionView:section forLocation:@"headerView" section:nil];
}

- (UIView *)tableView:(UITableView *)ourTableView viewForFooterInSection:(NSInteger)section
{
	RETURN_IF_SEARCH_TABLE_VIEW(nil);
	return [self sectionView:section forLocation:@"footerView" section:nil];
}

- (CGFloat)tableView:(UITableView *)ourTableView heightForHeaderInSection:(NSInteger)section
{
	RETURN_IF_SEARCH_TABLE_VIEW(ourTableView.sectionHeaderHeight);
	TiUITableViewSectionProxy *sectionProxy = nil;
	TiUIView *view = [self sectionView:section forLocation:@"headerView" section:&sectionProxy];
	TiViewProxy *viewProxy = (TiViewProxy *)[view proxy];
	CGFloat size = 0;
	BOOL hasTitle = NO;
	if (viewProxy!=nil)
	{
		LayoutConstraint *viewLayout = [viewProxy layoutProperties];
		switch (viewLayout->height.type)
		{
			case TiDimensionTypePixels:
				size += viewLayout->height.value;
				break;
			case TiDimensionTypeAuto:
				size += [viewProxy autoHeightForWidth:[tableview bounds].size.width];
				break;
			default:
				size+=DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
				break;
		}
	}
	else if ([sectionProxy headerTitle]!=nil)
	{
		hasTitle = YES;
		size+=[tableview sectionHeaderHeight];
	}
	if ([tableview tableHeaderView]!=nil && searchField == nil)
	{
		size+=[tableview tableHeaderView].frame.size.height;
	}
	if (hasTitle && size < DEFAULT_SECTION_HEADERFOOTER_HEIGHT)
	{
		size += DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
	}
	return size;
}

- (CGFloat)tableView:(UITableView *)ourTableView heightForFooterInSection:(NSInteger)section
{
	RETURN_IF_SEARCH_TABLE_VIEW(ourTableView.sectionFooterHeight);
	TiUITableViewSectionProxy *sectionProxy = nil;
	TiUIView *view = [self sectionView:section forLocation:@"footerView" section:&sectionProxy];
	TiViewProxy *viewProxy = (TiViewProxy *)[view proxy];
	CGFloat size = 0;
	BOOL hasTitle = NO;
	if (viewProxy!=nil)
	{
		LayoutConstraint *viewLayout = [viewProxy layoutProperties];
		switch (viewLayout->height.type)
		{
			case TiDimensionTypePixels:
				size += viewLayout->height.value;
				break;
			case TiDimensionTypeAuto:
				size += [viewProxy autoHeightForWidth:[tableview bounds].size.width];
				break;
			default:
				size+=DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
				break;
		}
	}
	else if ([sectionProxy footerTitle]!=nil)
	{
		hasTitle = YES;
		size+=[tableview sectionFooterHeight];
	}
	if ([tableview tableFooterView]!=nil)
	{
		size+=[tableview tableFooterView].frame.size.height;
	}
	if (hasTitle && size < DEFAULT_SECTION_HEADERFOOTER_HEIGHT)
	{
		size += DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
	}
	return size;
}

-(void)keyboardDidShowAtHeight:(CGFloat)keyboardTop forView:(TiUIView *)firstResponderView
{
	int lastSectionIndex = [sections count]-1;
	ENSURE_CONSISTENCY(lastSectionIndex>=0);

	lastFocusedView = firstResponderView;
	CGRect responderRect = [self convertRect:[firstResponderView bounds] fromView:firstResponderView];
	CGPoint offsetPoint = [tableview contentOffset];
	responderRect.origin.x += offsetPoint.x;
	responderRect.origin.y += offsetPoint.y;

	CGRect minimumContentRect = [tableview rectForSection:lastSectionIndex];
	ModifyScrollViewForKeyboardHeightAndContentHeightWithResponderRect(tableview,keyboardTop,minimumContentRect.size.height + minimumContentRect.origin.y,responderRect);
}

-(void)keyboardDidHideForView:(TiUIView *)hidingView
{
	if(hidingView != lastFocusedView)
	{
		return;
	}

	RestoreScrollViewFromKeyboard(tableview);
}

#pragma Scroll View Delegate

- (BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView 
{
	// suspend image loader while we're scrolling to improve performance
	[[ImageLoader sharedLoader] suspend];
	return YES;
}

- (void)scrollViewDidScrollToTop:(UIScrollView *)scrollView 
{
	// resume image loader when we're done scrolling
	[[ImageLoader sharedLoader] resume];
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView 
{
	// suspend image loader while we're scrolling to improve performance
	[[ImageLoader sharedLoader] suspend];
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate 
{
	if (decelerate==NO)
	{
		// resume image loader when we're done scrolling
		[[ImageLoader sharedLoader] resume];
	}
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView 
{
	// resume image loader when we're done scrolling
	[[ImageLoader sharedLoader] resume];
}

#pragma mark Search Display Controller Delegates

- (void) searchDisplayController:(UISearchDisplayController *)controller willShowSearchResultsTableView:(UITableView *)tableView
{
    // Carry over (relevant) display properties from our table to the search table, for consistency.  Note that
    // we MAY NOT be able to get the correct row height min/max.
    [tableView setBackgroundColor:[[self tableView] backgroundColor]];
    [tableView setSeparatorStyle:[[self tableView] separatorStyle]];
    [tableView setSeparatorColor:[[self tableView] separatorColor]];
}

- (void) searchDisplayControllerDidEndSearch:(UISearchDisplayController *)controller
{
	[self hideSearchScreen:nil];
}

@end

#endif