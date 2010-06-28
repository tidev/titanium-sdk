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
@synthesize window,tab;

-(void)dealloc
{
	RELEASE_TO_NIL(window);
	RELEASE_TO_NIL(tab);
	[super dealloc];
}

-(TiWindowProxy *)proxy;
{
	return window;
}

-(id)initWithProxy:(TiWindowProxy*)window_ tab:(TiUITabProxy*)tab_
{
	if (self = [self init])
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

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	[super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}

@end

#endif