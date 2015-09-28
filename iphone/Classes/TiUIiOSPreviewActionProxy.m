/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if IS_XCODE_7
#ifdef USE_TI_UIIOSPREVIEWACTION
#import "TiUIiOSPreviewActionProxy.h"

@implementation TiUIiOSPreviewActionProxy
@synthesize actionIndex = _actionIndex;

-(instancetype)initWithArguments:(id)args
{
    if (self = [self init])
    {
        title = [[NSString alloc] initWithString:[[args valueForKey:@"title"] objectAtIndex:0]];
        style = [TiUtils intValue:[[args valueForKey:@"style"] objectAtIndex:0] def:0];
    }
    
    return self;
}
                  
-(void)dealloc
{
    RELEASE_TO_NIL(action);
    
    [super dealloc];
}

-(NSString*)apiName
{
    return @"Ti.UI.iOS.PreviewAction";
}

-(UIPreviewAction*)action
{
    UIPreviewAction *result = [UIPreviewAction actionWithTitle:title style:style handler:^void(UIPreviewAction *_action, UIViewController *_controller) {
        if([self _hasListeners:@"click"]) {
            [self fireEventWithAction:_action];
        }
    }];
    
    return result;
}

-(void)fireEventWithAction:(UIPreviewAction*)action
{
    NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                           NUMINT(_actionIndex), @"index",
                           title, @"title",
                           NUMINT(style), @"style",
                           nil];
    
    [self fireEvent:@"click" withObject:event];
}

@end
#endif
#endif