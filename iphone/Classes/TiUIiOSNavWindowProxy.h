/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
#import "TiWindowProxy.h"

@interface TiUIiOSNavWindowProxy : TiWindowProxy<UINavigationControllerDelegate,TiOrientationController,TiTab> {
@private
    UINavigationController *navController;
    TiWindowProxy *rootWindow;
    TiWindowProxy *current;
    BOOL transitionIsAnimating;
}

//Private API
-(void)setFrame:(CGRect)bounds;
@end
#endif
