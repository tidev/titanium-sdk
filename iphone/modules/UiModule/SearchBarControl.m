//
//  SearchBarControl.m
//  Titanium
//
//  Created by Blain Hamon on 11/3/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

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
