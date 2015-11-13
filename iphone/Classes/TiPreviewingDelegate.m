//
//  TiPreviewingDelegate.m
//  Titanium
//
//  Created by Hans Knöchel on 25/09/15.
//
//

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
        
        _previewContext = previewContext;
        
        _preview = [_previewContext preview];
        _sourceView = [_previewContext sourceView];
        _actions = [_previewContext actions];
        _contentHeight = [_previewContext contentHeight];
    }
    
    return self;
}

-(void)dealloc
{
    [_preview forgetSelf];
    [_sourceView forgetSelf];
    
    [super dealloc];
}

-(void)previewingContext:(id<UIViewControllerPreviewing>)previewingContext commitViewController:(UIViewController *)viewControllerToCommit
{
    NSMutableDictionary * propertiesDict = [[NSMutableDictionary alloc] initWithDictionary:[self listViewEvent]];
    [propertiesDict setObject:_preview forKey:@"preview"];
    
    NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
    
    [[self previewContext] fireEvent:@"pop" withObject:propertiesDict];
}

- (UIViewController*)previewingContext:(id<UIViewControllerPreviewing>)previewingContext viewControllerForLocation:(CGPoint)location
{
    UITableView *tableView = [self ensureTableView];
    
    if (tableView != nil) {
        
        // If the tap was not on a cell, don't continue
        if ([tableView cellForRowAtIndexPath:[tableView indexPathForRowAtPoint:location]] == nil) {
            return nil;
        }
        
        [self setListViewEvent:[self receiveListViewEventFromIndexPath:[tableView indexPathForRowAtPoint:location]]];
        [[self previewContext] fireEvent:@"peek" withObject:[self listViewEvent]];
    } else {
        [[self previewContext] fireEvent:@"peek" withObject:@{@"preview": _preview}];
    }
    
    TiViewController *controller = [[TiViewController alloc] initWithViewProxy:_preview];
    [[_preview view] setFrame:[[controller view] bounds]];
    [[controller view] addSubview:[_preview view]];
    
    NSMutableArray *result = [NSMutableArray array];
    int actionIndex = 0;

    if (_contentHeight > 0) {
        controller.preferredContentSize = CGSizeMake(0.0, _contentHeight);
    }
    
    for (id item in _actions) {
        if ([item isKindOfClass:[TiUIiOSPreviewActionProxy class]] == YES) {
            [item setActionIndex:actionIndex];
            
            if ([self listViewEvent] != nil) {
                [item setListViewEvent:[self listViewEvent]];
            }
            
            [result addObject:[item action]];

            actionIndex++;
        } else if ([item isKindOfClass:[TiUIiOSPreviewActionGroupProxy class]] == YES) {
            [item setActionGroupIndex:actionIndex];
            [result addObject:[item group]];

            actionIndex++;
        }
    }
    
    [controller setPreviewActions:result];
    [_preview windowWillOpen];
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
    if ([_sourceView isKindOfClass:[TiUIListViewProxy class]] == YES) {
        TiUIListViewProxy* listProxy = (TiUIListViewProxy*)_sourceView;
        TiUIListView *view = (TiUIListView*)[listProxy view];
        
        return [view tableView];
    }
#endif
#ifdef USE_TI_UITABLEVIEW
    if ([_sourceView isKindOfClass:[TiUITableView class]] == YES) {
        TiUITableViewProxy* listProxy = (TiUITableViewProxy*)_sourceView;
        TiUITableView *view = (TiUITableView*)[listProxy view];
        
        return [view tableView];
    }
#endif
    
    return nil;
}

-(NSDictionary*)receiveListViewEventFromIndexPath:(NSIndexPath*)indexPath
{
#ifdef USE_TI_UILISTVIEW
    if ([_sourceView isKindOfClass:[TiUIListViewProxy class]] == YES) {
        TiUIListViewProxy* listProxy = (TiUIListViewProxy*)_sourceView;
        
        TiUIListSectionProxy *theSection = [listProxy sectionForIndex:indexPath.section];
        NSDictionary *theItem = [theSection itemAtIndex:indexPath.row];
        
        NSMutableDictionary *eventObject = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
                                            NUMINTEGER(indexPath.section), @"sectionIndex",
                                            NUMINTEGER(indexPath.row), @"itemIndex",
                                            _preview, @"preview",
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
