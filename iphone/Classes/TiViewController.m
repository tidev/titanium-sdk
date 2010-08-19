/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewController.h"
#import "TiApp.h"



@implementation TiViewController

-(id)initWithViewProxy:(TiViewProxy<TiUIViewController>*)window_
{
	if (self = [super init])
	{
		proxy = [window_ retain];
	}
	return self;
}

-(void)dealloc
{
    RELEASE_TO_NIL(proxy);
    [super dealloc];
}

-(void)loadView
{
	self.view = [proxy view];
}

//-(UIView*)view
//{
//	return [proxy view];
//}
//
//- (void)viewDidUnload
//{
////TODO: The if is commented out for now since this check is not pushed yet and I want to keep it consistent with HEAD. Remove the comment when pushing.
//	if ([proxy shouldDetachViewOnUnload])
//	{
//		[proxy detachView];
//	}
//	[super viewDidUnload];
//}


-(id)proxy
{
	return proxy;
}

- (BOOL) shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation
{
	//Since the AppController will be the deciding factor, and it compensates for iPad, let it do the work.
	return [[[TiApp app] controller] shouldAutorotateToInterfaceOrientation:toInterfaceOrientation];
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	if ([proxy respondsToSelector:@selector(willAnimateRotationToInterfaceOrientation:duration:)])
	{
		[proxy willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
	}
	[super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}

- (void)viewWillAppear:(BOOL)animated;    // Called when the view is about to made visible. Default does nothing
{
	if ([proxy respondsToSelector:@selector(viewWillAppear:)])
	{
		[proxy viewWillAppear:animated];
	}
	VerboseLog(@"%@:%@%@",self,proxy,CODELOCATION);
}
- (void)viewDidAppear:(BOOL)animated;     // Called when the view has been fully transitioned onto the screen. Default does nothing
{
	if ([proxy respondsToSelector:@selector(viewDidAppear:)])
	{
		[proxy viewDidAppear:animated];
	}
	VerboseLog(@"%@:%@%@",self,proxy,CODELOCATION);
}
- (void)viewWillDisappear:(BOOL)animated; // Called when the view is dismissed, covered or otherwise hidden. Default does nothing
{
	if ([proxy respondsToSelector:@selector(viewWillDisappear:)])
	{
		[proxy viewWillDisappear:animated];
	}
	VerboseLog(@"%@:%@%@",self,proxy,CODELOCATION);
}
- (void)viewDidDisappear:(BOOL)animated;  // Called after the view was dismissed, covered or otherwise hidden. Default does nothing
{
	if ([proxy respondsToSelector:@selector(viewDidDisappear:)])
	{
		[proxy viewDidDisappear:animated];
	}
	VerboseLog(@"%@:%@%@",self,proxy,CODELOCATION);
}

-(UINavigationItem*)navigationItem
{
	if ([self navigationController] != nil) {
		return [super navigationItem];
	}
	return nil;
}

@end
