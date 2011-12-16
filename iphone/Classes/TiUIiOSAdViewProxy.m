/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiUIiOSAdViewProxy.h"
#import "TiUIiOSAdView.h"
#import "TiUtils.h"

#ifdef USE_TI_UIIOSADVIEW

#import <iAd/iAd.h>

@implementation TiUIiOSAdViewProxy

USE_VIEW_FOR_AUTO_HEIGHT
USE_VIEW_FOR_AUTO_WIDTH

-(void)cancelAction:(id)args
{
	[[self view] performSelectorOnMainThread:@selector(cancelAction:) withObject:args waitUntilDone:NO];
}


// Overrides the "size" function of view proxies; this view has restricted sizes dictated by constants
-(NSString*)size
{
    if (![self viewAttached]) {
        // Force the creation of the view and the ad before getting the size
        TiThreadPerformOnMainThread(^{
            [(TiUIiOSAdView*)[self view] adview];
        }, YES);
    }

    return [(TiUIiOSAdView*)[self view] adview].currentContentSizeIdentifier;
    
}

-(void)setSize:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSString);
    
    // Need to ensure the size is set on the UI thread
    [self makeViewPerformSelector:@selector(setAdSize:) withObject:arg createIfNeeded:YES waitUntilDone:NO];
}

@end

#endif