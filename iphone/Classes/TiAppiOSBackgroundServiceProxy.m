/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSBackgroundServiceProxy.h"
#import "TiUtils.h"
#import "TiApp.h"

#ifdef USE_TI_APPIOS

@implementation TiAppiOSBackgroundServiceProxy

#pragma mark internal

-(void)dealloc
{
	RELEASE_TO_NIL(bridge);
	[super dealloc];
}

-(void)beginBackground
{
	bridge = [[KrollBridge alloc] initWithHost:[self _host]];
	NSURL *url = [TiUtils toURL:[self valueForKey:@"url"] proxy:self];
	
	NSDictionary *values = [NSDictionary dictionaryWithObjectsAndKeys:self,@"currentService",nil];
	NSDictionary *preload = [NSDictionary dictionaryWithObjectsAndKeys:values,@"App",nil];
	[bridge boot:nil url:url preload:preload];
}

-(void)endBackground
{
	if (bridge!=nil)
	{
		[self fireEvent:@"stop"];
		[bridge performSelector:@selector(shutdown:) withObject:nil afterDelay:1];
		RELEASE_TO_NIL(bridge);
	}
}

#pragma mark public apis

-(void)stop:(id)args
{
	[self endBackground];
	[[TiApp app] stopBackgroundService:self];
}

-(void)unregister:(id)args
{
	[self endBackground];
	[[TiApp app] unregisterBackgroundService:self];
}

@end

#endif
