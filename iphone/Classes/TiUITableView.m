/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableView.h"
#import "TiUtils.h"
#import "Webcolor.h"

@implementation TiUITableView

#pragma mark Internal

-(void)dealloc
{
	RELEASE_TO_NIL(searchField);
	RELEASE_TO_NIL(tableHeaderView);
	RELEASE_TO_NIL(searchTableView);
	RELEASE_TO_NIL(searchScreenView);
	RELEASE_TO_NIL(filterAttribute);
	RELEASE_TO_NIL(searchResultIndexes);
	RELEASE_TO_NIL(sectionIndex);
	RELEASE_TO_NIL(sectionIndexMap);
	[super dealloc];
}

-(void)updateSearchView
{
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
		searchResultIndexes = [[NSMutableArray alloc] initWithCapacity:[sectionArray count]];
		searchResultIndexEnumerator = nil;
	} 
	else 
	{
		searchResultIndexEnumerator = [searchResultIndexes objectEnumerator];
	}
	
	//TODO: If the search is adding letters to the previous search string, do it by elimination instead of adding.
	
	NSString * ourSearchAttribute = filterAttribute;
	if(ourSearchAttribute == nil)ourSearchAttribute = @"title";
	
	for (TiUITableViewGroupSection * thisSection in sectionArray) 
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
		for (CellDataWrapper * thisCell in thisSection) 
		{
			if([thisCell stringForKey:ourSearchAttribute containsString:searchString])
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
	//TODO: port search field to new view
	[[searchField view] resignFirstResponder];
	[self makeRootViewFirstResponder];
	[searchTableView removeFromSuperview];
	[searchScreenView setEnabled:NO];
	[searchScreenView setAlpha:0.0];
	[UIView commitAnimations];
}


- (IBAction) showSearchScreen: (id) sender
{
	[tableview scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]
					 atScrollPosition:UITableViewScrollPositionBottom animated:NO];
	
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
	[UIView commitAnimations];
}

#pragma mark UITableView methods

- (NSInteger)numberOfSectionsInTableView:(UITableView *)ourTableView
{
	if(ourTableView == searchTableView)
	{
		return 1;
	}
	return [super numberOfSectionsInTableView:ourTableView];
}

- (NSInteger)tableView:(UITableView *)ourTableView numberOfRowsInSection:(NSInteger)section
{
	if(ourTableView == searchTableView)
	{
		int rowCount = 0;
		for (NSIndexSet * thisSet in searchResultIndexes) 
		{
			rowCount += [thisSet count];
		}
		return rowCount;
	}
	
	return [super tableView:ourTableView numberOfRowsInSection:section];
}

- (UITableViewCell *)tableView:(UITableView *)ourTableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
	if(ourTableView == searchTableView)
	{
		UITableViewCell * result = [ourTableView dequeueReusableCellWithIdentifier:@"search"];
		if(result==nil)
		{
			result = [[[UITableViewCell alloc] initWithFrame:CGRectZero reuseIdentifier:@"search"] autorelease];
		}
		CellDataWrapper * rowWrapper = [self cellForIndexPath:[self indexPathFromSearchIndex:[indexPath row]]];
		[(id)result setText:[rowWrapper title]];
		return result;
	}
	
	return [super tableView:ourTableView cellForRowAtIndexPath:indexPath];
}

- (NSString *)tableView:(UITableView *)ourTableView titleForHeaderInSection:(NSInteger)section    
{
	if(ourTableView==searchTableView)
	{
		return nil;
	}
	return [super tableView:ourTableView titleForHeaderInSection:section];
}

- (NSString *)tableView:(UITableView *)ourTableView titleForFooterInSection:(NSInteger)section
{
	if(ourTableView==searchTableView)
	{
		return nil;
	}
	return [super tableView:ourTableView titleForFooterInSection:section];
}

- (CGFloat)tableView:(UITableView *)ourTableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{	
	if(ourTableView==searchTableView)
	{
		return [ourTableView rowHeight];
	}
	
	CellDataWrapper * ourTableCell = [self cellForIndexPath:indexPath];
	
	TiDimension result = [ourTableCell rowHeight];
	CHECK_ROW_HEIGHT(result,ourTableCell,ourTableView);
	
	result = [templateCell rowHeight];
	CHECK_ROW_HEIGHT(result,ourTableCell,ourTableView);
	
	return [super tableView:ourTableView heightForRowAtIndexPath:indexPath];
}

- (void)tableView:(UITableView *)ourTableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{	
	if(ourTableView == searchTableView)
	{
		[ourTableView deselectRowAtIndexPath:indexPath animated:YES];
		[self hideSearchScreen:nil];
		indexPath = [self indexPathFromSearchIndex:[indexPath row]];
	}
	
	int section = [indexPath section];
	int blessedRow = [indexPath row];
	TiUITableViewGroupSection * sectionWrapper = [self sectionForIndex:section];
	
	if ([sectionWrapper isOptionList] && ![[sectionWrapper rowForIndex:blessedRow] isButton])
	{
		for (int row=0;row<[sectionWrapper rowCount];row++) 
		{
			CellDataWrapper * rowWrapper = [sectionWrapper rowForIndex:row];
			UITableViewCellAccessoryType rowType = [rowWrapper accessoryType];
			BOOL isBlessed = (row == blessedRow);
			
			UITableViewCell * thisCell = [ourTableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:row inSection:section]];
			
			if (!isBlessed && (rowType == UITableViewCellAccessoryCheckmark)) 
			{
				[rowWrapper setAccessoryType:UITableViewCellAccessoryNone];
				if (thisCell != nil)
				{
					[thisCell setAccessoryType:UITableViewCellAccessoryNone];
					[(id)thisCell setTextColor:[UIColor blackColor]];
				}
			} 
			else if (isBlessed && (rowType == UITableViewCellAccessoryNone))
			{
				[rowWrapper setAccessoryType:UITableViewCellAccessoryCheckmark];
				if (thisCell != nil)
				{
					[thisCell setAccessoryType:UITableViewCellAccessoryCheckmark];
					[(id)thisCell setTextColor:UIColorCheckmarkColor()];
				}
			}
		}
	}
	[ourTableView deselectRowAtIndexPath:indexPath animated:YES];
	
	[self triggerActionForIndexPath:indexPath fromPath:nil wasAccessory:NO search:(ourTableView == searchTableView) name:@"click"];
}

#pragma mark Public APIs

- (void) setFilterAttribute_:(id)newFilterAttribute
{
	ENSURE_STRING_OR_NIL(newFilterAttribute);
	if (newFilterAttribute == filterAttribute) 
	{
		return;
	}
	RELEASE_TO_NIL(filterAttribute);
	filterAttribute = [newFilterAttribute copy];
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
	
	[self updateSearchView];
}

-(void)setIndex_:(NSArray*)index_
{
	RELEASE_TO_NIL(sectionIndex);
	RELEASE_TO_NIL(sectionIndex);
	
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

#pragma mark Collation

- (NSArray *)sectionIndexTitlesForTableView:(UITableView *)tableView
{
	if (sectionIndex!=nil && self.editing==NO)
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

@end
