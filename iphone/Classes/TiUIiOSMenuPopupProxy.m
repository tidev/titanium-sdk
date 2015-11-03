/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSMENUPOPUP
#import "TiUIiOSMenuPopupProxy.h"
#import "TiUtils.h"
#import "TiApp.h"

@implementation TiUIiOSMenuPopupProxy

-(void)_initWithProperties:(NSDictionary *)properties
{
    ENSURE_TYPE([properties objectForKey:@"items"], NSArray);
    
    [self setMenuItems:[NSMutableArray array]];
    
    for(NSString *item in [properties objectForKey:@"items"]) {
        [[self menuItems] addObject:[[UIMenuItem alloc] initWithTitle:[TiUtils stringValue:item] action:@selector(handleMenuItemClick:)]];
    }
    
    [super _initWithProperties:properties];
}

-(void)show:(id)args
{
    ENSURE_TYPE([[args objectAtIndex:0] valueForKey:@"view"], TiViewProxy);
    
    TiViewProxy *sourceView = (TiViewProxy*)[[args objectAtIndex:0] valueForKey:@"view"];
    UIView *view = [sourceView view];
    BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
    
    [[[[TiApp app] controller] view] becomeFirstResponder];
    
    [[UIMenuController sharedMenuController] setMenuItems:[self menuItems]];
    [[UIMenuController sharedMenuController] setTargetRect:[view bounds] inView:view];
    [[UIMenuController sharedMenuController] setMenuVisible:YES animated:animated];
}

-(void)hide:(id)args
{
    BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];

    [[UIMenuController sharedMenuController] setMenuVisible:NO animated:animated];
}

-(void)handleMenuItemClick:(id)sender
{
    NSLog(@"Clicked");

    if ([self _hasListeners:@"click"]) {
        [self fireEvent:@"click" withObject:nil];
    }
}

@end
#endif