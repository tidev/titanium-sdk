/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "SearchBarControl.h"


@implementation SearchBarControl

- (void) setPropertyDict: (NSDictionary *) newDict;
{
	
}

- (void) refreshPositionWithWebView: (UIWebView *) webView animated:(BOOL)animated;
{
	
}

- (BOOL)isFirstResponder;
{
	
}


- (UIBarButtonItem *) nativeBarButton;
{
	if ((nativeBarButton == nil) || needsRefreshing) {
		[self updateNativeBarButton];
	}
	return nativeBarButton;
}

- (UIView *) nativeBarView;
{
	if ((nativeView == nil) || needsRefreshing){
		placedInBar = YES;
		[self updateNativeView:NO];
	}
	return wrapperView;
}

- (UIView *) nativeView;
{
	if ((nativeView == nil) || needsRefreshing){
		placedInBar = NO;
		[self updateNativeView:NO];
	}
	return wrapperView;
}

- (BOOL) hasNativeView;
{
	return (searchView != nil);
}

- (BOOL) hasNativeBarButton;
{
	return (nativeBarButton != nil);
}


@end
