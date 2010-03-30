/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewController.h"


@implementation TiViewController


-(id)initWithViewProxy:(TiViewProxy*)proxy_
{
	if (self = [super init])
	{
		proxy = proxy_;
	}
	return self;
}

-(TiViewProxy*)proxy
{
	return proxy;
}

-(UIView*)view
{
	return [proxy view];
}

- (void)viewDidUnload
{
	[proxy detachView];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
	if ([TiUtils isIPad])
	{
		// must return YES on ipad for all orientations
		return YES;
	}
	return [super shouldAutorotateToInterfaceOrientation:interfaceOrientation];
}

@end
