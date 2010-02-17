/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiMapViewProxy.h"
#import "TiMapView.h"

@implementation TiMapViewProxy

-(void)zoom:(id)args
{
	if ([self viewAttached])
	{
		[[self view] performSelectorOnMainThread:@selector(zoom:) withObject:args waitUntilDone:NO];
	}
}

-(void)selectAnnotation:(id)args
{
	if ([self viewAttached])
	{
		[[self view] performSelectorOnMainThread:@selector(selectAnnotation:) withObject:args waitUntilDone:NO];
	}
}

@end
