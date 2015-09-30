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
    [self setPreview:[properties valueForKey:@"preview"]];
    [self setContentHeight:[TiUtils intValue:@"contentHeight" def:0]];
    [self setActions:[NSMutableArray arrayWithArray:[properties valueForKey:@"actions"]]];
    [self setPopCallback:[properties objectForKey:@"pop"]];
        
    [super _initWithProperties:properties];
}

-(void)dealloc
{
    RELEASE_TO_NIL(_preview);
    RELEASE_TO_NIL(_actions);
    RELEASE_TO_NIL(_popCallback);
    
    [super dealloc];
}

-(void)connectToDelegate
{
    UIViewController *controller = [[[TiApp app] controller] topPresentedController];
    [controller registerForPreviewingWithDelegate:[[TiPreviewingDelegate alloc] initWithPreviewContext:self]
                                       sourceView:[_sourceView view]];
}

@end
#endif