/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPADSPLITWINDOW) || defined(USE_TI_UIIOSSPLITWINDOW)
#import "TiUIiOSSplitWindow.h"
#import "TiUIiOSSplitWindowProxy.h"

@implementation TiUIiOSSplitWindow

- (instancetype)initWithProxy:(TiUIiOSSplitWindowProxy*)proxy
{
    self = [super init];
    if (self) {
        UISplitViewController* controller = [proxy splitViewController];
        [self setInnerView:[controller view]];
        [self setDefaultHeight:TiDimensionAutoFill];
        [self setDefaultWidth:TiDimensionAutoFill];
    }
    return self;
}

@end
#endif