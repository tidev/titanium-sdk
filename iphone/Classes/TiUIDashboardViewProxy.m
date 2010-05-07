/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIDASHBOARDVIEW

#import "TiUIDashboardViewProxy.h"
#import "TiUIDashboardView.h"
#import "TiUtils.h"

@implementation TiUIDashboardViewProxy

-(void)startEditing:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(startEditing) withObject:nil waitUntilDone:NO];
}

-(void)stopEditing:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(stopEditing) withObject:nil waitUntilDone:NO];
}

@end

#endif