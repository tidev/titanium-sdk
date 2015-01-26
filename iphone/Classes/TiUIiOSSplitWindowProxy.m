/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW
#import "TiUIiOSSplitWindowProxy.h"
#import "TiUIiOSSplitWindow.h"

@implementation TiUIiOSSplitWindowProxy


-(void)_initWithProperties:(NSDictionary *)properties
{
    [self initializeProperty:@"showMasterInPortrait" defaultValue:NUMBOOL(NO)];
    [self initializeProperty:@"masterIsOverlayed" defaultValue:NUMBOOL(NO)];
    [super _initWithProperties:properties];
}


-(TiUIView*)newView
{
    CGRect frame = [self appFrame];
    TiUIiOSSplitWindow * win = [[TiUIiOSSplitWindow alloc] initWithFrame:frame];
    return win;
}

-(void)setShowMasterInPortrait:(id)value withObject:(id)animated
{
    [self replaceValue:value forKey:@"showMasterInPortrait" notification:NO];
    if ([self viewInitialized]) {
        TiThreadPerformOnMainThread(^{
            [(TiUIiOSSplitWindow *)[self view] setShowMasterInPortrait_:value withObject:animated];
        }, YES);
    }
}

-(void)setMasterIsOverlayed:(id)value withObject:(id)animated
{
    [self replaceValue:value forKey:@"masterIsOverlayed" notification:NO];
    if ([self viewInitialized]) {
        TiThreadPerformOnMainThread(^{
            [(TiUIiOSSplitWindow *)[self view] setMasterIsOverlayed_:value withObject:animated];
        }, YES);
    }
}

#pragma mark - TiViewProxy Overrides
-(void) windowWillOpen
{
    if ([self viewInitialized]) {
        TiThreadPerformOnMainThread(^{
            [(TiUIiOSSplitWindow*)self.view initWrappers];
        }, YES);
    }
    [super windowWillOpen];
}

-(void) windowWillClose
{
    if ([self viewInitialized]) {
        TiThreadPerformOnMainThread(^{
            [(TiUIiOSSplitWindow*)self.view cleanup];
        }, YES);
    }
    [super windowWillOpen];
}

#pragma mark - TiWindowProtocol handler

-(void)gainFocus
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView gainFocus];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView gainFocus];
    }
    [super gainFocus];
}

-(void)resignFocus
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView resignFocus];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView resignFocus];
    }
    [super resignFocus];
}

-(BOOL)_handleOpen:(id)args
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if (![masterView isKindOfClass:[TiViewProxy class]]) {
        DebugLog(@"masterView property must be set to an object of type TiViewProxy");
        return NO;
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if (![detailView isKindOfClass:[TiViewProxy class]]) {
        DebugLog(@"detailView property must be set to an object of type TiViewProxy");
        return NO;
    }
    
    return [super _handleOpen:args];
}

-(void)viewWillAppear:(BOOL)animated
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView viewWillAppear:animated];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView viewWillAppear:animated];
    }
    [super viewWillAppear:animated];
    
}
-(void)viewWillDisappear:(BOOL)animated
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView viewWillDisappear:animated];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView viewWillDisappear:animated];
    }
    [super viewWillDisappear:animated];
}
-(void)viewDidAppear:(BOOL)animated
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView viewDidAppear:animated];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView viewDidAppear:animated];
    }
    [super viewDidAppear:animated];
}
-(void)viewDidDisappear:(BOOL)animated
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView viewDidDisappear:animated];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView viewDidDisappear:animated];
    }
    [super viewDidDisappear:animated];
}
-(void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView didRotateFromInterfaceOrientation:fromInterfaceOrientation];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView didRotateFromInterfaceOrientation:fromInterfaceOrientation];
    }
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
}


@end
#endif