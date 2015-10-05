/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW

#import "TiWindowProxy.h"
@interface TiUIiOSSplitWindowProxy : TiWindowProxy<UISplitViewControllerDelegate>
{
    TiViewProxy *masterProxy;
    TiViewProxy *detailProxy;
    
    UISplitViewController* splitViewController;
    UIViewController* popoverController;
}

@property(nonatomic, assign) UIViewController* leftViewController;
@property(nonatomic, assign) UIViewController* rightViewController;


-(UISplitViewController*)splitViewController;

@end
#endif
