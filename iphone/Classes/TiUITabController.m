/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITabController.h"
#import "TiUtils.h"
#import "ImageLoader.h"
#import "Webcolor.h"

@implementation TiUITabController

-(void)dealloc
{
	RELEASE_TO_NIL(window);
	RELEASE_TO_NIL(tab);
	[super dealloc];
}

-(id)initWithProxy:(TiWindowProxy*)window_ tab:(TiUITabProxy*)tab_
{
	if (self = [super init])
	{
		window = [window_ retain];
		tab = [tab_ retain];
		[window _associateTab:self navBar:self.navigationController tab:tab];		
	}
	return self;
}
 
-(void)loadView
{
	// link our window to the tab
	[window _associateTab:self navBar:self.navigationController tab:tab];
	self.view = [window view];
}

-(void)viewDidUnload
{
	[window _associateTab:nil navBar:nil tab:nil];
}

-(TiWindowProxy*)window
{
	return window;
}

-(TiUITabProxy*)tab
{
	return tab;
}

@end
