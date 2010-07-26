/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIDASHBOARDVIEW

#import "TiUIDashboardItem.h"
#import "TiUIDashboardItemProxy.h"
#import "TiUtils.h"
#import "TiViewProxy.h"
#import "TiUIView.h"
#import "LauncherItem.h"
#import "LauncherButton.h"

@implementation TiUIDashboardItem

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	TiViewProxy *p = (TiViewProxy*)self.proxy;
	[super frameSizeChanged:frame bounds:bounds];
	
	for (TiViewProxy *proxy in [p children])
	{
		[(TiUIView*)[proxy view] frameSizeChanged:self.frame bounds:self.bounds];
	}
}

@end

#endif