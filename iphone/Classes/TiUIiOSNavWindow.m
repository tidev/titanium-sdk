/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
#import "TiUIiOSNavWindow.h"
#import "TiUIiOSNavWindowProxy.h"

@implementation TiUIiOSNavWindow

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    [(TiUIiOSNavWindowProxy*)[self proxy] setFrame:bounds];
    [super frameSizeChanged:frame bounds:bounds];
}

@end
#endif