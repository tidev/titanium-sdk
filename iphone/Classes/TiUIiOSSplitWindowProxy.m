/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW
#import "TiUIiOSSplitWindowProxy.h"
#import "TiUIiOSSplitWindow.h"

@implementation TiUIiOSSplitWindowProxy


-(void)_initWithProperties:(NSDictionary *)properties
{
    [self initializeProperty:@"showMasterInPortrait" defaultValue:NUMBOOL(NO)];
    [self initializeProperty:@"masterIsOverlayed" defaultValue:NUMBOOL(NO)];
    [super _initWithProperties:properties];
}


-(TiUIView*)newView
{
    CGRect frame = [self appFrame];
    TiUIiOSSplitWindow * win = [[TiUIiOSSplitWindow alloc] initWithFrame:frame];
    return win;
}

-(void)setShowMasterInPortrait:(id)value withObject:(id)animated
{
    [self replaceValue:value forKey:@"showMasterInPortrait" notification:NO];
    if ([self viewInitialized]) {
        TiThreadPerformOnMainThread(^{
            [(TiUIiOSSplitWindow *)[self view] setShowMasterInPortrait_:value withObject:animated];
        }, YES);
    }
}

-(void)setMasterIsOverlayed:(id)value withObject:(id)animated
{
    [self replaceValue:value forKey:@"masterIsOverlayed" notification:NO];
    if ([self viewInitialized]) {
        TiThreadPerformOnMainThread(^{
            [(TiUIiOSSplitWindow *)[self view] setMasterIsOverlayed_:value withObject:animated];
        }, YES);
    }
}

@end
#endif