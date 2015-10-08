/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if IS_XCODE_7
#ifdef USE_TI_UIIOSPREVIEWCONTEXT

#import "TiUIiOSPreviewActionGroupProxy.h"

@implementation TiUIiOSPreviewActionGroupProxy

-(void)_initWithProperties:(NSDictionary *)properties
{
    [self setTitle:[TiUtils stringValue:[properties valueForKey:@"title"]]];
    [self setStyle:[TiUtils intValue:[properties valueForKey:@"style"] def:UIPreviewActionStyleDefault]];
    [self setActions:[NSMutableArray array]];
    
    int index = 0;
    
    for (TiUIiOSPreviewActionProxy *action in [properties valueForKey:@"actions"]) {
        [action rememberSelf];
        [action setActionIndex:index];
        
        [[self actions] addObject:[action action]];

        index++;
    }
    
    actionGroup = [[UIPreviewActionGroup actionGroupWithTitle:[self title] style:[self style] actions:[self actions]] retain];
    
    [super _initWithProperties:properties];
}


-(void)dealloc
{
    for (TiUIiOSPreviewActionProxy *action in self.actions) {
        [action forgetSelf];
    }
    
    RELEASE_TO_NIL(actionGroup);
    
    [super dealloc];
}

-(NSString*)apiName
{
    return @"Ti.UI.iOS.PreviewActionGroup";
}

-(UIPreviewActionGroup*)group
{
    return actionGroup;
}

@end
#endif
#endif