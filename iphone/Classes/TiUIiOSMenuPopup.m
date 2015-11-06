/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSMenuPopup.h"
#import "TiApp.h"

@interface TiUIiOSMenuPopup()
@property (nonatomic, readonly) TiUIiOSMenuPopupProxy *menuPopupProxy;
@end

@implementation TiUIiOSMenuPopup

-(BOOL)canBecomeFirstResponder
{
    return YES;
}

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender {
    NSString *sel = NSStringFromSelector(action);
    NSRange match = [sel rangeOfString:@"menuItem-"];
    if (match.location == 0) {
        return YES;
    }
    return NO;
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)sel {
    if ([super methodSignatureForSelector:sel]) {
        return [super methodSignatureForSelector:sel];
    }
    return [super methodSignatureForSelector:@selector(fireEventWithIndex:)];
}

- (void)forwardInvocation:(NSInvocation *)invocation {
    NSString *sel = NSStringFromSelector([invocation selector]);
    NSRange match = [sel rangeOfString:@"menuItem-"];
    if (match.location == 0) {
        id index = [sel substringFromIndex:9];
        [self fireEventWithIndex:[TiUtils intValue:index]];
    } else {
        [super forwardInvocation:invocation];
    }
}

-(TiUIiOSMenuPopupProxy*)menuPopupProxy
{
    return (TiUIiOSMenuPopupProxy*)self.proxy;
}

-(void)show:(id)args
{
    [self becomeFirstResponder];

    ENSURE_TYPE([[args objectAtIndex:0] valueForKey:@"view"], TiViewProxy);
    ENSURE_UI_THREAD_1_ARG(args);
    
    UIMenuController* controller = [UIMenuController sharedMenuController];
    
    TiViewProxy *sourceView = (TiViewProxy*)[[args objectAtIndex:0] valueForKey:@"view"];
    UIView *view = [sourceView view];
    BOOL animated = [TiUtils boolValue:[args valueForKey:@"animated"] def:YES];
    
    [[[[[TiApp app] controller] topPresentedController] view] addSubview:self];
    
    [controller setMenuItems:[self.menuPopupProxy menuItems]];
    [controller setTargetRect:view.bounds inView:view];
    [controller setMenuVisible:YES animated:animated];
}

-(void)hide:(id)args
{
    BOOL animated = [TiUtils boolValue:[args valueForKey:@"animated"] def:YES];
    
    [[UIMenuController sharedMenuController] setMenuVisible:NO animated:animated];
}

-(void)fireEventWithIndex:(int)index
{
    if ([self.menuPopupProxy _hasListeners:@"click"]) {
        
        [self.menuPopupProxy fireEvent:@"click" withObject:@{
            @"index" : NUMINT(index),
            @"title" : [[[self.menuPopupProxy menuItems] objectAtIndex:index] title]
        }];
    }
}

@end
