/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "SearchBarControl.h"

#import "Webcolor.h"


NSString * const createSearchBarString = @"function(args){var res=Ti.UI.createButton(args,null,'searchBar');return res;}";

@interface NativeControlProxy(NeedsChanging)

- (void) reportEvent: (NSString *) eventType value: (NSString *) newValue index: (int) index init:(NSString *)customInit arguments:(NSString *)extraArgs;

@end




@implementation SearchBarControl
@synthesize delegate;
//@synthesize stringValue;

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	[super readState:inputState relativeToUrl:baseUrl];
	
	NSString * barColorString = [inputState objectForKey:@"barColor"];
	if ([barColorString isKindOfClass:[NSString class]]) {
		[barColor autorelease];
		barColor = [UIColorWebColorNamed(barColorString) retain];
		[self setNeedsLayout:YES];
	} else if ((barColorString != nil) && (barColor != nil)) {
		[barColor release];
		barColor = nil;
		[self setNeedsLayout:YES];
	}
	
	id newStringValue = [inputState objectForKey:@"value"];
	if (newStringValue != nil) {
		if([newStringValue respondsToSelector:@selector(stringValue)]){
			[self setStringValue:[newStringValue stringValue]];
		} else if ([newStringValue isKindOfClass:[NSString class]]){
			[self setStringValue:newStringValue];
		} else {
			[self setStringValue:nil];
		}
	}

	NSNumber * showCancelNumber = [inputState objectForKey:@"showCancel"];
	if ([showCancelNumber respondsToSelector:@selector(boolValue)]) {
		BOOL newShowCancel = [showCancelNumber boolValue];
		if (newShowCancel != showCancel) {
			showCancel = newShowCancel;
			[self setNeedsLayout:YES];
		}
	}
}

- (void) updateView:(BOOL)animated
{
	[self setNeedsLayout:YES];
}

- (UIView *) view;
{
	if (![self needsLayout] && (searchView != nil)) {
		return searchView;
	}

	CGRect ourFrame = [self frame];
	if (ourFrame.size.width < 100) {
		ourFrame.size.width = 100;
	}
	if ([self isInBar] || (ourFrame.size.height < 44)) {
		ourFrame.size.height = 44;
	}
	
	if (searchView == nil) {
		searchView = [[UISearchBar alloc] initWithFrame:ourFrame];
		[searchView setDelegate:self];
	} else {
		[searchView setFrame:ourFrame];
	}

	[searchView setText:[self stringValue]];
	
	[searchView setShowsCancelButton:showCancel];

	if (barColor == nil) {
		[searchView setTintColor:nil];
		[searchView setBarStyle:UIBarStyleDefault];
	} else if (barColor == [UIColor clearColor]){
		[searchView setTintColor:nil];
		[searchView setBarStyle:UIBarStyleBlackTranslucent];
	} else {
		[searchView setTintColor:barColor];
		[searchView setBarStyle:UIBarStyleBlackOpaque];
	}
	
	return searchView;
}

- (UIView *) barButtonView;
{
	UIView * result = [self view];
	[result setAutoresizingMask:UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth];
	return result;
}

- (BOOL) hasView;
{
	return searchView != nil;
}

- (BOOL)isFirstResponder;
{
	return [searchView isFirstResponder];
}

- (BOOL)becomeFirstResponder;
{
	return [searchView becomeFirstResponder];
}

- (BOOL)resignFirstResponder;
{
	return [searchView resignFirstResponder];
}


- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar;                     // called when text starts editing
{
	[self setStringValue:[searchBar text]];
	[self reportEvent:@"focus" value:[SBJSON stringify:[self stringValue]] index:-1 init:nil arguments:nil];

	if([delegate respondsToSelector:@selector(searchBarTextDidBeginEditing:)])[delegate searchBarTextDidBeginEditing:searchBar];
}

- (void)searchBarTextDidEndEditing:(UISearchBar *)searchBar;                       // called when text ends editing
{
	[self setStringValue:[searchBar text]];
	[self reportEvent:@"blur" value:[SBJSON stringify:[self stringValue]] index:-1 init:nil arguments:nil];

	if([delegate respondsToSelector:@selector(searchBarTextDidEndEditing:)])[delegate searchBarTextDidEndEditing:searchBar];
}

- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText;   // called when text changes (including clear)
{
	[self setStringValue:searchText];
	[self reportEvent:@"change" value:[SBJSON stringify:[self stringValue]] index:-1 init:nil arguments:nil];

	if([delegate respondsToSelector:@selector(searchBar:textDidChange:)])[delegate searchBar:searchBar textDidChange:searchText];
}

- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar;                     // called when keyboard search button pressed
{
	[self setStringValue:[searchBar text]];
	[self reportEvent:@"return" value:[SBJSON stringify:[self stringValue]] index:-1 init:nil arguments:nil];

	if([delegate respondsToSelector:@selector(searchBarSearchButtonClicked:)])[delegate searchBarSearchButtonClicked:searchBar];
}

- (void)searchBarBookmarkButtonClicked:(UISearchBar *)searchBar;                   // called when bookmark button pressed
{
	if([delegate respondsToSelector:@selector(searchBarBookmarkButtonClicked:)])[delegate searchBarBookmarkButtonClicked:searchBar];
	
}

- (void)searchBarCancelButtonClicked:(UISearchBar *) searchBar;                    // called when cancel button pressed
{
	[self setStringValue:[searchBar text]];
	[self reportEvent:@"cancel" value:[SBJSON stringify:[self stringValue]] index:-1 init:nil arguments:nil];

	if([delegate respondsToSelector:@selector(searchBarCancelButtonClicked:)])[delegate searchBarCancelButtonClicked:searchBar];	
}



@end
