/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import "TiUISearchBarProxy.h"
#import "TiUtils.h"

@implementation TiUISearchBarProxy
@synthesize delegate;

#pragma mark Init and dealloc

//IMPORTANT: DELEGATES ARE NOT RETAINED, AND SHOULD NOT BE RELEASED.

#pragma mark Method forwarding

-(void)blur:(id)args
{
	[(id)[self modelDelegate] blur:nil];
}

-(void)focus:(id)args
{
	[(id)[self modelDelegate] focus:nil];
}




#pragma mark UISearchBarDelegate methods

- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar                     // called when text starts editing
{
	NSString * text = [searchBar text];
	[self replaceValue:text forKey:@"value" notification:NO];

	//No need to setValue, because it's already been set.
	if ([self _hasListeners:@"focus"])
	{
		[self fireEvent:@"focus" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}
	
	if([delegate respondsToSelector:@selector(searchBarTextDidBeginEditing:)])
	{
		[delegate searchBarTextDidBeginEditing:searchBar];
	}
}


- (void)searchBarTextDidEndEditing:(UISearchBar *)searchBar                       // called when text ends editing
{
	NSString * text = [searchBar text];
	[self replaceValue:text forKey:@"value" notification:NO];

	//No need to setValue, because it's already been set.
	if ([self _hasListeners:@"blur"])
	{
		[self fireEvent:@"blur" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}
	
	if([delegate respondsToSelector:@selector(searchBarTextDidEndEditing:)])
	{
		[delegate searchBarTextDidEndEditing:searchBar];
	}
}


- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText   // called when text changes (including clear)
{
	NSString * text = [searchBar text];
	[self replaceValue:text forKey:@"value" notification:NO];

	//No need to setValue, because it's already been set.
	if ([self _hasListeners:@"change"])
	{
		[self fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}
	
	if([delegate respondsToSelector:@selector(searchBar:textDidChange:)])
	{
		[delegate searchBar:searchBar textDidChange:searchText];
	}
}


- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar                     // called when keyboard search button pressed
{
	NSString * text = [searchBar text];
	[self replaceValue:text forKey:@"value" notification:NO];

	//No need to setValue, because it's already been set.
	if ([self _hasListeners:@"return"])
	{
		[self fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}

	if([delegate respondsToSelector:@selector(searchBarSearchButtonClicked:)])
	{
		[delegate searchBarSearchButtonClicked:searchBar];
	}	
}


- (void)searchBarBookmarkButtonClicked:(UISearchBar *)searchBar                   // called when bookmark button pressed
{	//TODO: update to the new event model

	if([delegate respondsToSelector:@selector(searchBarBookmarkButtonClicked:)])
	{
		[delegate searchBarBookmarkButtonClicked:searchBar];
	}

}


- (void)searchBarCancelButtonClicked:(UISearchBar *) searchBar                    // called when cancel button pressed
{
	NSString * text = [searchBar text];
	[self replaceValue:text forKey:@"value" notification:NO];

	//No need to setValue, because it's already been set.
	if ([self _hasListeners:@"cancel"])
	{
		[self fireEvent:@"cancel" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}

	if([delegate respondsToSelector:@selector(searchBarCancelButtonClicked:)])
	{
		[delegate searchBarCancelButtonClicked:searchBar];	
	}
}


@end
