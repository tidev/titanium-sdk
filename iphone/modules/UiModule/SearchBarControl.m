/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "SearchBarControl.h"

#import "Webcolor.h"


NSString * const createSearchBarString = @"function(args){var res=Ti.UI.createButton(args,null,'searchBar');return res;}";


@implementation SearchBarControl

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

	NSNumber * showCancelNumber = [inputState objectForKey:@"showCancel"];
	if ([showCancelNumber respondsToSelector:@selector(boolValue)]) {
		BOOL newShowCancel = [showCancelNumber boolValue];
		if (newShowCancel != showCancel) {
			showCancel = newShowCancel;
			[self setNeedsLayout:YES];
		}
	}
}

- (UIView *) view;
{
	if (![self needsLayout] && (searchView != nil)) {
		return searchView;
	}

	if (searchView == nil) {
		searchView = [[UISearchBar alloc] initWithFrame:[self frame]];
	}
	
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



@end
