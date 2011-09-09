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

#pragma mark Method forwarding

-(void)blur:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(blur:) withObject:args waitUntilDone:NO];
}

-(void)focus:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(focus:) withObject:args waitUntilDone:NO];
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

@end

#endif