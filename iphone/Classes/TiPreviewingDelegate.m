/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if IS_XCODE_7
#ifdef USE_TI_UIIOSPREVIEWCONTEXT

#import "TiPreviewingDelegate.h"
#import "TiUIListViewProxy.h"
#import "TiUIListView.h"
#import "TiUITableViewProxy.h"
#import "TiUITableView.h"
#import "TiUIScrollView.h"

@implementation TiPreviewingDelegate

-(instancetype)initWithPreviewContext:(TiUIiOSPreviewContextProxy*)previewContext
{
    if (self = [self init]) {
        [self setPreviewContext:previewContext];
    }
    
    return self;
}

-(void)dealloc
{
    [[[self previewContext] preview] forgetSelf];
    [[[self previewContext] sourceView] forgetSelf];
    
    RELEASE_TO_NIL(_previewContext);
    RELEASE_TO_NIL(_listViewEvent);
    
    [super dealloc];
}

-(void)previewingContext:(id<UIViewControllerPreviewing>)previewingContext commitViewController:(UIViewController *)viewControllerToCommit
{
    NSMutableDictionary * propertiesDict = [[NSMutableDictionary alloc] initWithDictionary:[self listViewEvent]];
    [propertiesDict setObject:_previewContext.preview forKey:@"preview"];
    
    NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
    
    [[self previewContext] fireEvent:@"pop" withObject:propertiesDict];
}

- (UIViewController*)previewingContext:(id<UIViewControllerPreviewing>)previewingContext viewControllerForLocation:(CGPoint)location
{
    if ([[self previewContext] preview] == nil) {
        return nil;
    }
    
    UITableView *tableView = [self ensureTableView];
    
    if (tableView != nil) {
        
        // If the tap was not on a cell, don't continue
        if ([tableView cellForRowAtIndexPath:[tableView indexPathForRowAtPoint:location]] == nil) {
            return nil;
        }
        
        [self setListViewEvent:[self receiveListViewEventFromIndexPath:[tableView indexPathForRowAtPoint:location]]];
        [[self previewContext] fireEvent:@"peek" withObject:[self listViewEvent]];
    } else {
        [[self previewContext] fireEvent:@"peek" withObject:@{@"preview": [[self previewContext] preview]}];
    }
    
    TiViewController *controller = [[TiViewController alloc] initWithViewProxy:[[self previewContext] preview]];
    [[[[self previewContext] preview] view] setFrame:[[controller view] bounds]];
    [[controller view] addSubview:[[[self previewContext] preview] view]];
    
    NSMutableArray *result = [NSMutableArray array];
    NSUInteger actionIndex = 0;

    if ([[self previewContext] contentHeight] > 0) {
        controller.preferredContentSize = CGSizeMake(0.0, [[self previewContext] contentHeight]);
    }
    
    for (id item in [[self previewContext] actions]) {
        if ([item isKindOfClass:[TiUIiOSPreviewActionProxy class]] == YES) {
            [item setActionIndex:actionIndex];
            
            if ([self listViewEvent] != nil) {
                [item setListViewEvent:[self listViewEvent]];
            }
            
            [result addObject:[item action]];

            actionIndex++;
        } else if ([item isKindOfClass:[TiUIiOSPreviewActionGroupProxy class]] == YES) {
            [result addObject:[item actionGroup]];
        }
    }
    
    [controller setPreviewActions:result];
    [[[self previewContext] preview] windowWillOpen];
    [previewingContext setSourceRect:[self createSourceRectWithLocation:location]];
    
    return controller;
}

-(CGRect)createSourceRectWithLocation:(CGPoint)location
{
    UITableView *tableView = [self ensureTableView];
    
    if (tableView) {
        NSIndexPath *indexPath = [tableView indexPathForRowAtPoint:location];
        return [[tableView cellForRowAtIndexPath:indexPath] frame];
    }

    return CGRectZero; // The Frame is detected automatically on normal views
}

-(UITableView*)ensureTableView
{
#ifdef USE_TI_UILISTVIEW
    if ([[[self previewContext] sourceView] isKindOfClass:[TiUIListViewProxy class]] == YES) {
        TiUIListViewProxy* listProxy = (TiUIListViewProxy*)[[self previewContext] sourceView];
        TiUIListView *view = (TiUIListView*)[listProxy view];
        
        return [view tableView];
    }
#endif
#ifdef USE_TI_UITABLEVIEW
    if ([[[self previewContext] sourceView] isKindOfClass:[TiUITableView class]] == YES) {
        TiUITableViewProxy* listProxy = (TiUITableViewProxy*)[[self previewContext] sourceView];
        TiUITableView *view = (TiUITableView*)[listProxy view];
        
        return [view tableView];
    }
#endif
    
    return nil;
}

-(NSDictionary*)receiveListViewEventFromIndexPath:(NSIndexPath*)indexPath
{
#ifdef USE_TI_UILISTVIEW
    if ([[[self previewContext] sourceView] isKindOfClass:[TiUIListViewProxy class]] == YES) {
        TiUIListViewProxy* listProxy = (TiUIListViewProxy*)[[self previewContext] sourceView];
        
        TiUIListSectionProxy *theSection = [listProxy sectionForIndex:indexPath.section];
        NSDictionary *theItem = [theSection itemAtIndex:indexPath.row];
        
        NSMutableDictionary *eventObject = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
                                            NUMINTEGER(indexPath.section), @"sectionIndex",
                                            NUMINTEGER(indexPath.row), @"itemIndex",
                                            [[self previewContext] preview], @"preview",
                                            nil];
        
        id propertiesValue = [theItem objectForKey:@"properties"];
        NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
        id itemId = [properties objectForKey:@"itemId"];
        if (itemId != nil) {
            [eventObject setObject:itemId forKey:@"itemId"];
        }
        
        return eventObject;
    }
#endif
    return nil;
}

@end
#endif
#endif
