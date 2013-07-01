/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import "TiUITabController.h"
#import "TiUtils.h"
#import "ImageLoader.h"
#import "Webcolor.h"

@implementation TiUITabController
@synthesize tab;

-(void)dealloc
{
	[(TiWindowProxy *)[self proxy] _associateTab:nil navBar:nil tab:nil];
	[super dealloc];
}

-(TiWindowProxy *)window;
{
	return (TiWindowProxy *)[self proxy];
}

-(id)initWithProxy:(TiWindowProxy*)window_ tab:(TiUITabProxy*)tab_
{
	if (self = [self initWithViewProxy:window_])
	{
		tab = tab_;
		[window_ _associateTab:self navBar:self.navigationController tab:tab];
	}
	return self;
}
 
-(void)loadView
{
	// link our window to the tab
	[(TiWindowProxy *)[self proxy] _associateTab:self navBar:self.navigationController tab:tab];
	[super loadView];
}

-(void)viewDidUnload
{
	[super viewDidUnload];
}

@end

#endif