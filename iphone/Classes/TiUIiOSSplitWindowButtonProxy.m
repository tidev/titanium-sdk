/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * WARNING: This is generated code. Modify at your own risk and without support.
 */
#import "TiBase.h"
#import <objc/runtime.h>

#if defined(USE_TI_UIIPADSPLITWINDOW) || defined(USE_TI_UIIOSSPLITWINDOW)

#import "TiUIiOSSplitWindowButtonProxy.h"
#import "TiUIiOSSplitWindowProxy.h"

#import "TiUtils.h"

@implementation TiUIiPadSplitWindowButtonProxy

-(id)initWithButton:(UIBarButtonItem*)button_ splitViewProxy:(TiUIiOSSplitWindowProxy*)splitView andPageContext:(id<TiEvaluator>)pageContext_
{
    if (self = [super _initWithPageContext:pageContext_])
    {
        button = [button_ retain];
        [self setSplitViewProxy:splitView];
    }
    return self;
}

-(void)_destroy
{
    RELEASE_TO_NIL(button);
    [super _destroy];
}

-(NSString*)apiName
{
    return @"Ti.UI.iOS.SplitWindowButton";
}

-(void)setTitle:(id)title
{
    [button setTitle:title];
    [[[self splitViewProxy] leftViewController] setTitle:title];
}

- (UIBarButtonItem *) barButtonItem
{
    return button;
}

-(BOOL)supportsNavBarPositioning
{
    return YES;
}

-(BOOL)isUsingBarButtonItem
{
    return YES;
}

@end

#endif
