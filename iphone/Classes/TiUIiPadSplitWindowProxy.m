/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_UIIPADSPLITWINDOW
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
#import "TiUIiPadSplitWindowProxy.h"
#import "TiUIiPadSplitWindow.h"
#import "TiUtils.h"
#import "TiApp.h"

@implementation TiUIiPadSplitWindowProxy

-(TiUIView*)newView
{
	return [[TiUIiPadSplitWindow alloc] init];
}

-(UIViewController *)controller
{
	if ([controller isKindOfClass:[UISplitViewController class]])
	{
		return controller;
	}
	TiUIiPadSplitWindow *view = (TiUIiPadSplitWindow*)[self view];
	[view setProxy:self];
	UIViewController *c = [view controller];
	self.controller = c;
	return c;
}

-(void)windowDidOpen 
{
	[super windowDidOpen];

	TiSplitViewController* splitController = (TiSplitViewController*)[self controller];
	
	[splitController resizeView];
	[splitController repositionSubviews];	
}

-(void)windowDidClose
{
	//TODO: reattach the root controller?
	[super windowDidClose];
}

-(void)setToolbar:(id)items withObject:(id)properties
{
	ENSURE_UI_THREAD_WITH_OBJ(setToolbar,items,properties);
	[(TiUIiPadSplitWindow*)[self view] setToolbar:items withObject:properties];
}

@end

#endif

#endif