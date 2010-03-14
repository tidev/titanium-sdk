/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIImageViewProxy.h"
#import "TiUIImageView.h"

@implementation TiUIImageViewProxy

#pragma mark Internal


-(void)_configure
{
	[self replaceValue:[NSNumber numberWithBool:NO] forKey:@"animating" notification:NO];
}

-(void)start:(id)args
{
	ENSURE_UI_THREAD(start,args);
	TiUIImageView *iv= (TiUIImageView*)[self view];
	[iv start:args];
}

-(void)stop:(id)args
{
	ENSURE_UI_THREAD(stop,args);
	TiUIImageView *iv= (TiUIImageView*)[self view];
	[iv stop:args];
}

-(void)viewWillDetach
{
	[self stop:nil];
	[super viewWillDetach];
}

-(void)windowWillClose
{
	[self stop:nil];
	[super windowWillClose];
}

-(void)_destroy
{
	[self stop:nil];
	[super _destroy];
}



@end
