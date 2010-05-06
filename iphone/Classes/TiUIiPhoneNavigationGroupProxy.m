/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONENAVIGATIONGROUP

#import "TiUIiPhoneNavigationGroupProxy.h"
#import "TiUtils.h"
#import "TiWindowProxy.h"
#import "TiUIiPhoneNavigationGroup.h"

@implementation TiUIiPhoneNavigationGroupProxy

-(id)init
{
	if (self = [super init])
	{
		//FIXME: review this with Blain as to why...
		layoutProperties.top = TiDimensionPixels(-1);
	}
	return self;
}

-(void)open:(NSArray*)args
{
	ENSURE_UI_THREAD(open,args);
	TiWindowProxy *window = [args objectAtIndex:0];
	ENSURE_TYPE(window,TiWindowProxy);
	NSDictionary *properties = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
	[[self view] performSelector:@selector(open:withObject:) withObject:window withObject:properties];
}

-(void)close:(NSArray*)args
{
	ENSURE_UI_THREAD(close,args);
	TiWindowProxy *window = [args objectAtIndex:0];
	ENSURE_TYPE(window,TiWindowProxy);
	NSDictionary *properties = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
	[[self view] performSelector:@selector(close:withObject:) withObject:window withObject:properties];
}


@end

#endif