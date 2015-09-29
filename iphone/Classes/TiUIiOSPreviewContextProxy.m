/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSPREVIEWCONTEXT
#import "TiUIiOSPreviewContextProxy.h"

@implementation TiUIiOSPreviewContextProxy

-(void)_initWithProperties:(NSDictionary *)properties
{
    [self setWindow:[properties valueForKey:@"window"]];
    [self setContentHeight:[TiUtils intValue:@"contentHeight" def:0]];
    [self setActions:[NSMutableArray arrayWithArray:[properties valueForKey:@"actions"]]];
    
    [[self window] rememberSelf];
    
    [super _initWithProperties:properties];
}

-(void)connectToDelegate
{
    UIViewController *controller = [[[TiApp app] controller] topPresentedController];
    TiPreviewingDelegate* delegate = [[TiPreviewingDelegate alloc] initWithPreviewContext:self];
        
    [controller registerForPreviewingWithDelegate:delegate sourceView:[_sourceView view]];
}

@end
#endif