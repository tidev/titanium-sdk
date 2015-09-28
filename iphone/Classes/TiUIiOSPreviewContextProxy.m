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
    [self setActions:[NSMutableArray array]];
    [self setWidth:[TiUtils intValue:@"width"]];
    [self setHeight:[TiUtils intValue:@"height"]];
    
    [self setActions:[properties valueForKey:@"actions"]];
    [[self window] rememberSelf];
    
    [super _initWithProperties:properties];
}

-(void)connectToDelegate
{
    UIViewController *controller = [[TiApp app] controller];
    TiPreviewingDelegate* delegate = [[TiPreviewingDelegate alloc] initWithPreviewContext:self];
    
    [controller registerForPreviewingWithDelegate:delegate sourceView:[controller view]];
}

@end
#endif