/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUtils.h"
#import "TiUISearchBarProxy.h"
#import "TiUISearchBar.h"

@implementation TiUISearchBar

-(void)dealloc
{
	[searchView setDelegate:nil];
	RELEASE_TO_NIL(searchView);
	[super dealloc];
}

-(void)layoutSubviews
{
	[super layoutSubviews];
	if (searchView==nil)
	{
		searchView = [[UISearchBar alloc] init];
		[searchView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[TiUtils setView:searchView positionRect:[self bounds]];
		[(TiViewProxy *)[self proxy] firePropertyChanges];
		[searchView setDelegate:(TiUISearchBarProxy*)[self proxy]];
		[self addSubview:searchView];
	}
}

#pragma mark View controller stuff

-(void)blur:(id)args
{
	ENSURE_UI_THREAD(blur,nil);
	[searchView resignFirstResponder];
}

-(void)focus:(id)args
{
	ENSURE_UI_THREAD(focus,nil);
	[searchView becomeFirstResponder];
}


-(void)setValue_:(id)value
{
	[searchView setText:[TiUtils stringValue:value]];
}

-(void)setShowCancel_:(id)value
{
	[searchView setShowsCancelButton:[TiUtils boolValue:value]];
}

-(void)setBarColor_:(id)value
{
	UIColor * newBarColor = [[TiUtils colorValue:value] _color];
	BOOL newTransparency = NO;
	UIBarStyle newBarStyle = UIBarStyleBlack;
	if (newBarColor==nil)
	{
		newBarStyle=UIBarStyleDefault;
	}
	else if (newBarColor == [UIColor clearColor])
	{
		newTransparency = YES;
		newBarColor = nil;
	}
	[searchView setBarStyle:newBarStyle];
	[searchView setTintColor:newBarColor];
	[searchView setTranslucent:newTransparency];
}


@end
