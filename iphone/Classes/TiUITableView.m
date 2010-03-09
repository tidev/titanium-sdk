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

#define DEFAULT_SECTION_HEADERFOOTER_HEIGHT 20.0

@implementation TiUITableView

#pragma mark Internal 

-(id)init
{
	if (self = [super init])
	{
		sections = [[NSMutableArray array] retain];
	}
	return self;
}


-(void)dealloc
{
	RELEASE_TO_NIL(sections);
	RELEASE_TO_NIL(tableview);
	RELEASE_TO_NIL(sectionIndex);
	RELEASE_TO_NIL(sectionIndexMap);
	RELEASE_TO_NIL(tableHeaderView);
	RELEASE_TO_NIL(searchScreenView);
	RELEASE_TO_NIL(searchTableView);
	RELEASE_TO_NIL(filterAttribute);
	RELEASE_TO_NIL(searchResultIndexes);
	[super dealloc];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
//	if (tableview!=nil && CGRectIsEmpty(bounds)==NO)
//	{
//		[TiUtils setView:tableview positionRect:bounds];
//	}
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
		tableview = [[UITableView alloc] initWithFrame:[self bounds] style:style];
		tableview.delegate = self;
		tableview.dataSource = self;
		tableview.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
		tableview.backgroundColor = style == UITableViewStylePlain ? [UIColor whiteColor] : [UIColor groupTableViewBackgroundColor];
		tableview.opaque = YES;
		[self addSubview:tableview];
		[self updateSearchView];
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

-(void)replaceData:(UITableViewRowAnimation)animation
{
	NSAssert(sections!=nil,@"sections was nil");
	
	UITableView *table = [self tableView];
	
	if ([sections count] > 0)
	{
		NSIndexSet *oldSectionSet = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0,[sections count])];
		[table deleteSections:oldSectionSet withRowAnimation:UITableViewRowAnimationNone];
	}
	
	RELEASE_TO_NIL(sections);
	sections = [[NSMutableArray alloc] init];
	
	// get new data array from the proxy
	NSArray *newsections = [self.proxy valueForKey:@"data"];
	
	// if nil, means we're removing
	if (newsections!=nil)
	{
		// wire up the relationships
		for (int c=0;c<[newsections count];c++)
		{
			TiUITableViewSectionProxy *section = [newsections objectAtIndex:c];
			section.section = c;
			section.table = self;
			for (int x=0;x<[section rowCount];x++)
			{
				TiUITableViewRowProxy *row = [section rowAtIndex:x];
				row.table = self;
				row.section = section;
				row.row = x;
				row.parent = section;
			}
			section.parent = self.proxy;
			[sections addObject:section];
		}
		
		NSIndexSet *newSectionSet = [NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0,[sections count])];
		[table insertSections:newSectionSet withRowAnimation:animation];
	}
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
	TiUITableViewSectionProxy *section = [sections objectAtIndex:[sections count]-1];
	row.section = section;
	NSMutableArray *rows = [row.section rows];
	NSAssert(rows!=nil,@"rows was nil");
	[rows addObject:row];
	[row.section reorderRows];
}

-(void)dispatchAction:(TiUITableViewAction*)action
{
	ENSURE_UI_THREAD(dispatchAction,action);
	
	UITableView *table = [self tableView];

	[table beginUpdates];
	
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
	
	// fire it to our row since the row, section and table are
	// in a hierarchy and it will bubble up from there...
	
	if ([row _hasListeners:name])
	{
		[row fireEvent:name withObject:eventObject];
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
			if (value!=nil && [[TiUtils stringValue:value] rangeOfString:searchString].location!=NSNotFound)
			{
				[thisIndexSet addIndex:cellIndex];
			}
			cellIndex ++;
		}
	}
}

#pragma mark Searchbar-related IBActions

- (IBAction) hideSearchScreen: (id) sender
{
	[UIView beginAnimations:@"searchy" context:nil];
	[[searchField view] resignFirstResponder];
	[self makeRootViewFirstResponder];
	[searchTableView removeFromSuperview];
	[searchScreenView setEnabled:NO];
	[searchScreenView setAlpha:0.0];

	[tableview setScrollEnabled:YES];
	if (autohideSearch || searchHidden)
	{
		searchHidden = YES;
		[self.proxy replaceValue:NUMBOOL(YES) forKey:@"searchHidden" notification:NO];
		[tableview setContentOffset:CGPointMake(0,searchField.view.frame.size.height)];
	}
	[UIView commitAnimations];
}


- (IBAction) showSearchScreen: (id) sender
{
	[tableview scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]
					 atScrollPosition:UITableViewScrollPositionBottom animated:NO];
	[tableview setScrollEnabled:NO];
	
	CGRect screenRect = [TiUtils viewPositionRect:tableview];
	CGFloat searchHeight = [[tableview tableHeaderView] bounds].size.height;
	
	screenRect.origin.y += searchHeight;
	screenRect.size.height -= searchHeight;
	
	UIView * wrapperView = [tableview superview];
	if ([[self searchScreenView] superview] != wrapperView) 
	{
		[searchScreenView setAlpha:0.0];
		[wrapperView insertSubview:searchScreenView aboveSubview:tableview];
	}
	[TiUtils setView:searchScreenView positionRect:screenRect];
	
	[UIView beginAnimations:@"searchy" context:nil];
	[searchScreenView setEnabled:YES];
	[searchScreenView setAlpha:0.85];
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
	}
	
	if ([tableview tableHeaderView] != tableHeaderView)
	{
		[tableview setTableHeaderView:tableHeaderView];
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
		[wrapperView insertSubview:searchTableView aboveSubview:searchScreenView];
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
	RELEASE_TO_NIL(searchField);
	
	if (search!=nil)
	{
		searchField = [search retain];
		searchField.delegate = self;
	}

	[self.proxy replaceValue:NUMBOOL(NO) forKey:@"searchHidden" notification:NO];
}

-(void)setAutoHideSearch_:(id)autohide
{
	autohideSearch = [TiUtils boolValue:autohide];
}

-(void)setSearchHidden_:(id)hide
{
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
}

-(void)setEditable_:(id)args
{
	editable = [TiUtils boolValue:args];
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

- (NSInteger)tableView:(UITableView *)table numberOfRowsInSection:(NSInteger)section
{
	if(table == searchTableView)
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

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
	if(tableView == searchTableView)
	{
		UITableViewCell * result = [tableView dequeueReusableCellWithIdentifier:@"__search__"];
		if(result==nil)
		{
			result = [[[UITableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"__search__"] autorelease];
		}
		TiUITableViewRowProxy *row = [self rowForIndexPath:[self indexPathFromSearchIndex:[indexPath row]]];
		NSString *searchFilterField = filterAttribute;
		if (searchFilterField==nil)
		{
			searchFilterField = @"title";
		}
		NSString* value = [TiUtils stringValue:[row valueForKey:searchFilterField]];
		[(id)result setText:value];
		return result;
	}
	
	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];
	
	// the classname for all rows that have the same substainal layout will be the same
	// we reuse them for speed
	UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:row.tableClass];
	if (cell == nil)
	{
		cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:row.tableClass] autorelease];
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

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
	if(tableView == searchTableView)
	{
		return 1;
	}
	return sections!=nil ? [sections count] : 0;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
	if(tableView==searchTableView)
	{
		return nil;
	}	
	TiUITableViewSectionProxy *sectionProxy = [sections objectAtIndex:section];
	return [sectionProxy headerTitle];
}

- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section
{
	if(tableView==searchTableView)
	{
		return nil;
	}	
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
	return editable;
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
		NSIndexPath *path = [self indexPathFromInt:index];
		
		// note, trigger action before the update since on the last delete it will be gone..
		[self triggerActionForIndexPath:indexPath fromPath:nil wasAccessory:NO search:NO name:@"delete"];
		
		[[section rows] removeObjectAtIndex:[indexPath row]];
		[table beginUpdates];
		[table deleteRowsAtIndexPaths:[NSArray arrayWithObject:path] withRowAnimation:UITableViewRowAnimationFade];
		[table endUpdates];
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

#pragma mark Delegate

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
	[tableView deselectRowAtIndexPath:indexPath animated:YES];
	if(tableView == searchTableView)
	{
		[self hideSearchScreen:nil];
		indexPath = [self indexPathFromSearchIndex:[indexPath row]];
	}
	[self triggerActionForIndexPath:indexPath fromPath:nil wasAccessory:NO search:NO name:@"click"];
}

-(void)tableView:(UITableView *)tableView willDisplayCell:(UITableViewCell *)cell forRowAtIndexPath:(NSIndexPath *)indexPath
{
	if(tableView == searchTableView)
	{
		return;
	}
	
	TiUITableViewSectionProxy *section = [sections objectAtIndex:[indexPath section]];
	TiUITableViewRowProxy *row = [section rowAtIndex:[indexPath row]];
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

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
	if(tableView == searchTableView)
	{
		return tableView.rowHeight;
	}
	
	TiUITableViewRowProxy *row = [self rowForIndexPath:indexPath];
	CGFloat height = [row rowHeight:tableView.bounds];
	height = [self tableRowHeight:height];
	return height < 1 ? tableView.rowHeight : height;
}

- (UIView *)tableView:(UITableView *)tableView viewForHeaderInSection:(NSInteger)section
{
	return [self sectionView:section forLocation:@"headerView" section:nil];
}

- (UIView *)tableView:(UITableView *)tableView viewForFooterInSection:(NSInteger)section
{
	return [self sectionView:section forLocation:@"footerView" section:nil];
}

- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
	TiUITableViewSectionProxy *sectionProxy = nil;
	TiUIView *view = [self sectionView:section forLocation:@"headerView" section:&sectionProxy];
	CGFloat size = 0;
	BOOL hasTitle = NO;
	if (view!=nil)
	{
		LayoutConstraint *viewLayout = [view layoutProperties];
		switch (viewLayout->height.type)
		{
			case TiDimensionTypePixels:
				size += viewLayout->height.value;
				break;
			case TiDimensionTypeAuto:
				size += [view autoHeightForWidth:[tableView bounds].size.width];
				break;
			default:
				size+=DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
				break;
		}
	}
	else if ([sectionProxy headerTitle]!=nil)
	{
		hasTitle = YES;
		size+=[tableView sectionHeaderHeight];
	}
	if ([tableView tableHeaderView]!=nil && searchField == nil)
	{
		size+=[tableView tableHeaderView].frame.size.height;
	}
	if (hasTitle && size < DEFAULT_SECTION_HEADERFOOTER_HEIGHT)
	{
		size += DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
	}
	return size;
}

- (CGFloat)tableView:(UITableView *)tableView heightForFooterInSection:(NSInteger)section
{
	TiUITableViewSectionProxy *sectionProxy = nil;
	TiUIView *view = [self sectionView:section forLocation:@"footerView" section:&sectionProxy];
	CGFloat size = 0;
	BOOL hasTitle = NO;
	if (view!=nil)
	{
		LayoutConstraint *viewLayout = [view layoutProperties];
		switch (viewLayout->height.type)
		{
			case TiDimensionTypePixels:
				size += viewLayout->height.value;
				break;
			case TiDimensionTypeAuto:
				size += [view autoHeightForWidth:[tableView bounds].size.width];
				break;
			default:
				size+=DEFAULT_SECTION_HEADERFOOTER_HEIGHT;
				break;
		}
	}
	else if ([sectionProxy footerTitle]!=nil)
	{
		hasTitle = YES;
		size+=[tableView sectionFooterHeight];
	}
	if ([tableView tableFooterView]!=nil)
	{
		size+=[tableView tableFooterView].frame.size.height;
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

@end
