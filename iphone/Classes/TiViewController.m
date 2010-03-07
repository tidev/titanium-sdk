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

- (void)viewWillAppear:(BOOL)animated;    // Called when the view is about to made visible. Default does nothing
{
	NSLog(@"%@, %@ -> %X",CODELOCATION,self,proxy);
}
- (void)viewDidAppear:(BOOL)animated;     // Called when the view has been fully transitioned onto the screen. Default does nothing
{
	NSLog(@"%@, %@ -> %X",CODELOCATION,self,proxy);
}
- (void)viewWillDisappear:(BOOL)animated; // Called when the view is dismissed, covered or otherwise hidden. Default does nothing
{
	NSLog(@"%@, %@ -> %X",CODELOCATION,self,proxy);
}
- (void)viewDidDisappear:(BOOL)animated;  // Called after the view was dismissed, covered or otherwise hidden. Default does nothing
{
	NSLog(@"%@, %@ -> %X",CODELOCATION,self,proxy);
}




@end
