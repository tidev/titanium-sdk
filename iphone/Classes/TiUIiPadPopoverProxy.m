/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPADPOPOVER

#import "TiUIiPadPopoverProxy.h"
#import "TiUIiPadPopover.h"
#import "TiUtils.h"

@implementation TiUIiPadPopoverProxy

-(void)show:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(show:) withObject:args waitUntilDone:NO];
}

-(void)hide:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(hide:) withObject:args waitUntilDone:NO];
}

-(void)setWidth:(id)width 
{
	[[self view] performSelectorOnMainThread:@selector(setWidth_:) withObject:width waitUntilDone:NO];
}

-(void)setHeight:(id)height
{
	[[self view] performSelectorOnMainThread:@selector(setHeight_:) withObject:height waitUntilDone:NO];
}

@end


#endif