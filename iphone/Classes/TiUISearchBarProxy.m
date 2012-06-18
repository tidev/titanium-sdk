/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW
#ifndef USE_TI_UISEARCHBAR
#define USE_TI_UISEARCHBAR
#endif
#endif

#ifdef USE_TI_UISEARCHBAR

#import "TiUISearchBarProxy.h"
#import "TiUISearchBar.h"

@implementation TiUISearchBarProxy
@synthesize showsCancelButton;

#pragma mark Method forwarding

-(void)blur:(id)args
{
	[self makeViewPerformSelector:@selector(blur:) withObject:args createIfNeeded:YES waitUntilDone:NO];
}

-(void)focus:(id)args
{
	[self makeViewPerformSelector:@selector(focus:) withObject:args createIfNeeded:YES waitUntilDone:NO];
}

-(void)setShowCancel:(id)value withObject:(id)object
{
	BOOL boolValue = [TiUtils boolValue:value];
	BOOL animated = [TiUtils boolValue:@"animated" properties:object def:NO];
	//TODO: Value checking and exception generation, if necessary.

	[self replaceValue:value forKey:@"showCancel" notification:NO];
	showsCancelButton = boolValue;

	//ViewAttached gives a false negative when not attached to a window.
	TiThreadPerformOnMainThread(^{
		UISearchBar *search = [self searchBar];
		[search setShowsCancelButton:showsCancelButton animated:animated];
		[search sizeToFit];
	}, NO);
}


-(void)setDelegate:(id<UISearchBarDelegate>)delegate
{
    [self makeViewPerformSelector:@selector(setDelegate:) withObject:delegate createIfNeeded:(delegate!=nil) waitUntilDone:YES];
}

-(UISearchBar*)searchBar
{
	return [(TiUISearchBar*)[self view] searchBar];
}

-(NSMutableDictionary*)langConversionTable
{
    return [NSMutableDictionary dictionaryWithObjectsAndKeys:@"prompt",@"promptid",@"hintText",@"hinttextid",nil];
}

-(TiDimension)defaultAutoHeightBehavior:(id)unused
{
    return TiDimensionAutoSize;
}

USE_VIEW_FOR_CONTENT_HEIGHT
@end

#endif