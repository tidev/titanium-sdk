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
#import "TiUIiOSProxy.h"

#ifdef USE_TI_UIIOSADVIEW

#import <iAd/iAd.h>

@implementation TiUIiOSAdViewProxy

USE_VIEW_FOR_AUTO_HEIGHT
USE_VIEW_FOR_AUTO_WIDTH

-(void)cancelAction:(id)args
{
	[self makeViewPerformSelector:@selector(cancelAction:) withObject:args createIfNeeded:YES waitUntilDone:NO];
}


-(NSString*)adSize
{
    __block NSString* adSize;
    
    TiThreadPerformOnMainThread(^{
        adSize = [[(TiUIiOSAdView*)[self view] adview] currentContentSizeIdentifier];
    }, YES);
    
    return adSize;
}

-(void)setAdSize:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSString);
    
    // Sanity check values
    if (![arg isEqualToString:[TiUIiOSProxy AD_SIZE_PORTRAIT]] || [arg isEqualToString:[TiUIiOSProxy AD_SIZE_LANDSCAPE]]) {
        [self throwException:@"TiInvalidArg" 
                   subreason:@"Invalid value for Titanium.UI.iOS.AdView.adSize"
                    location:CODELOCATION];
    }
    
    // Need to ensure the size is set on the UI thread
    [self makeViewPerformSelector:@selector(setAdSize:) withObject:arg createIfNeeded:YES waitUntilDone:NO];
}

@end

#endif