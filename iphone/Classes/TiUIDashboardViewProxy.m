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
#import "LauncherItem.h"
#import "LauncherButton.h"
#import "LauncherView.h"

@implementation TiUIDashboardViewProxy

-(void)startEditing:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(startEditing) withObject:nil waitUntilDone:NO];
}

-(void)stopEditing:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(stopEditing) withObject:nil waitUntilDone:NO];
}

-(void)fireEvent:(NSString *)type withObject:(id)obj withSource:(id)source propagate:(BOOL)propagate
{
	if ([type isEqual:@"click"])
	{
		TiUIDashboardView *v = (TiUIDashboardView*)[self view];
		LauncherView *launcher = [v launcher];
		if (launcher.editing)
		{
			return;
		}
	}
	[super fireEvent:type withObject:obj withSource:source propagate:propagate];
}

@end

#endif