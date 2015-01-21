/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIREFRESHCONTROL

#if defined (USE_TI_UIATTRIBUTEDSTRING) || defined (USE_TI_UIIOSATTRIBUTEDSTRING)
#import "TiUIAttributedStringProxy.h"
#endif
#import "TiUIRefreshControlProxy.h"
#import "TiUtils.h"

@implementation TiUIRefreshControlProxy

-(NSString*)apiName
{
    return @"Ti.UI.RefreshControl";
}

-(void) dealloc
{
    RELEASE_TO_NIL(_refreshControl);
    RELEASE_TO_NIL(_attributedString);
    RELEASE_TO_NIL(refreshTintColor);
    [super dealloc];
}

#pragma mark - Internal Use
-(UIRefreshControl*)control
{
    //Must be called on main thread
    if (_refreshControl == nil) {
        _refreshControl = [[UIRefreshControl alloc] init];
        [_refreshControl addTarget:self action:@selector(refreshStart) forControlEvents:UIControlEventValueChanged];
        [self refreshControl];
    }
    
    return _refreshControl;
}

-(void)refreshControl
{
    if (_refreshControl != nil) {
        [_refreshControl setAttributedTitle:_attributedString];
        [_refreshControl setTintColor:refreshTintColor];
    }
}

-(void)refreshStart
{
    if ([self _hasListeners:@"refreshstart"]) {
        [self fireEvent:@"refreshstart" withObject:nil propagate:NO reportSuccess:NO errorCode:0 message:nil];
    }
}


#pragma mark - Public API

-(void)setTitle:(id)args
{

#if defined (USE_TI_UIATTRIBUTEDSTRING) || defined (USE_TI_UIIOSATTRIBUTEDSTRING)
	ENSURE_SINGLE_ARG_OR_NIL(args, TiUIAttributedStringProxy);
	[self replaceValue:args forKey:@"title" notification:NO];
	RELEASE_TO_NIL(_attributedString);
	if (args != nil) {
		_attributedString = [[args attributedString] copy];
	}
	TiThreadPerformOnMainThread(^{
		[self refreshControl];
	}, NO);
#endif
}

-(void)setTintColor:(id)args
{
    ENSURE_SINGLE_ARG_OR_NIL(args, NSObject);
    [self replaceValue:args forKey:@"tintColor" notification:NO];
    RELEASE_TO_NIL(refreshTintColor);
    refreshTintColor = [[[TiUtils colorValue:args] color] retain];
    //Changing tintColor works on iOS6 but not on iOS7. iOS Bug?
    TiThreadPerformOnMainThread(^{
        [self refreshControl];
    }, NO);
}

-(void)beginRefreshing:(id)unused
{
    TiThreadPerformOnMainThread(^{
        [_refreshControl beginRefreshing];
    }, NO);
}

-(void)endRefreshing:(id)unused
{
    TiThreadPerformOnMainThread(^{
        [_refreshControl endRefreshing];
    }, NO);
}



@end
#endif