/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIDASHBOARDVIEW

#import "TiUIDashboardViewProxy.h"
#import "TiUIDashboardItemProxy.h"
#import "TiUIDashboardView.h"
#import "TiUtils.h"
#import "LauncherItem.h"
#import "LauncherButton.h"
#import "LauncherView.h"

NSArray* dashboardKeySequence;

@implementation TiUIDashboardViewProxy

-(NSArray *)keySequence
{
	if (dashboardKeySequence == nil)
	{
		dashboardKeySequence = [[NSArray arrayWithObjects:@"rowCount",@"columnCount",nil] retain];
	}
	return dashboardKeySequence;
}

-(id)init
{
    if (self = [super init]) {
        [self setValue:[NSNumber numberWithBool:YES] forUndefinedKey:@"editable"];
    }
    return self;
}

-(void)startEditing:(id)args
{
    [self makeViewPerformSelector:@selector(startEditing) withObject:nil createIfNeeded:YES waitUntilDone:NO];
}

-(void)stopEditing:(id)args
{
    [self makeViewPerformSelector:@selector(stopEditing) withObject:nil createIfNeeded:YES waitUntilDone:NO];    
}

//TODO: Remove when deprication is done.
-(void)fireEvent:(NSString*)type withObject:(id)obj withSource:(id)source propagate:(BOOL)propagate reportSuccess:(BOOL)report errorCode:(int)code message:(NSString*)message;
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

-(void)fireEvent:(NSString*)type withObject:(id)obj propagate:(BOOL)propagate reportSuccess:(BOOL)report errorCode:(int)code message:(NSString*)message;
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
	[super fireEvent:type withObject:obj propagate:propagate reportSuccess:report errorCode:code message:message];
}

-(void)setData:(id)data
{
    for (TiViewProxy* proxy in data) {
        ENSURE_TYPE(proxy, TiUIDashboardItemProxy)
        [self rememberProxy:proxy];
    }
    
    [self setValue:data forUndefinedKey:@"data"];
    [self makeViewPerformSelector:@selector(setViewData:) withObject:data createIfNeeded:YES waitUntilDone:YES];
}

@end

#endif