/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIDASHBOARDVIEW

#import "TiUIDashboardViewProxy.h"
#import "TiUIDashboardView.h"
#import "TiUIDashboardItemProxy.h"
#import "TiUtils.h"
#import "LauncherItem.h"
#import "LauncherButton.h"
#import "LauncherView.h"

@implementation TiUIDashboardViewProxy

DEFINE_DEF_BOOL_PROP(editable,YES);

-(void)startEditing:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(startEditing) withObject:nil waitUntilDone:NO];
}

-(void)stopEditing:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(stopEditing) withObject:nil waitUntilDone:NO];
}

-(void)addItem:(id)item
{
  ENSURE_UI_THREAD_1_ARG(item);
  ENSURE_SINGLE_ARG(item, TiUIDashboardItemProxy);
  TiUIDashboardView *v = (TiUIDashboardView*)[self view];
  LauncherView *launcher = [v launcher];
  [launcher addItem:((TiUIDashboardItemProxy *)item).item animated:YES];
}

-(void)removeItem:(id)item
{
  ENSURE_UI_THREAD_1_ARG(item);
  ENSURE_SINGLE_ARG(item, TiUIDashboardItemProxy);
  TiUIDashboardView *v = (TiUIDashboardView*)[self view];
  LauncherView *launcher = [v launcher];
  [launcher removeItem:((TiUIDashboardItemProxy *)item).item animated:YES];
}

-(void)fireEvent:(NSString *)type withObject:(id)obj withSource:(id)source propagate:(BOOL)propagate
{
	if ([type isEqual:@"click"])
	{
		TiUIDashboardView *v = (TiUIDashboardView*)[self view];
		LauncherView *launcher = [v launcher];
		if (launcher.editing || ![TiUtils boolValue:[self valueForKey:@"editable"] def:YES])
		{
			return;
		}
	}
	[super fireEvent:type withObject:obj withSource:source propagate:propagate];
}

@end

#endif