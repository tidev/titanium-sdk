/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewController.h"
#import "TiApp.h"

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
//TODO: The if is commented out for now since this check is not pushed yet and I want to keep it consistent with HEAD. Remove the comment when pushing.
	if ([proxy shouldDetachViewOnUnload])
	{
		[proxy detachView];
	}
	[super viewDidUnload];
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	[super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
	//Since the AppController will be the deciding factor, and it compensates for iPad, let it do the work.
	return [[[TiApp app] controller] shouldAutorotateToInterfaceOrientation:interfaceOrientation];
}

- (void)viewWillAppear:(BOOL)animated;    // Called when the view is about to made visible. Default does nothing
{
	VerboseLog(@"%@:%@%@",self,proxy,CODELOCATION);
}
- (void)viewDidAppear:(BOOL)animated;     // Called when the view has been fully transitioned onto the screen. Default does nothing
{
	VerboseLog(@"%@:%@%@",self,proxy,CODELOCATION);
}
- (void)viewWillDisappear:(BOOL)animated; // Called when the view is dismissed, covered or otherwise hidden. Default does nothing
{
	VerboseLog(@"%@:%@%@",self,proxy,CODELOCATION);
}
- (void)viewDidDisappear:(BOOL)animated;  // Called after the view was dismissed, covered or otherwise hidden. Default does nothing
{
	VerboseLog(@"%@:%@%@",self,proxy,CODELOCATION);
}




@end
