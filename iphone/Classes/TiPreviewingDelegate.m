//
//  TiPreviewingDelegate.m
//  Titanium
//
//  Created by Hans Knöchel on 25/09/15.
//
//

#if IS_XCODE_7
#import "TiPreviewingDelegate.h"
#import "TiUIListViewProxy.h"
#import "TiUIListView.h"
#import "TiUITableViewProxy.h"
#import "TiUITableView.h"

@implementation TiPreviewingDelegate

-(instancetype)initWithPreviewContext:(TiUIiOSPreviewContextProxy*)previewContext
{
    if (self = [self init]) {
        
        _previewContext = previewContext;
        
        _preview = [_previewContext preview];
        _sourceView = [_previewContext sourceView];
        _actions = [_previewContext actions];
        _contentHeight = [_previewContext contentHeight];
        _popCallback = [_previewContext popCallback];
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
    NSMutableDictionary * propertiesDict = [[NSMutableDictionary alloc] initWithDictionary:@{ @"preview" : _preview }];
    
    if([self currentIndexPath] != nil) {
        [propertiesDict setValue:NUMINTEGER([self currentIndexPath].section) forKey:@"sectionIndex"];
        [propertiesDict setValue:NUMINTEGER([self currentIndexPath].row) forKey:@"itemIndex"];
    }
    
    NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
    
    [_popCallback call:invocationArray thisObject:_previewContext];
    [invocationArray release];
}

- (UIViewController*)previewingContext:(id<UIViewControllerPreviewing>)previewingContext viewControllerForLocation:(CGPoint)location
{
    TiViewController *controller = [[TiViewController alloc] initWithViewProxy:_preview];
    [[_preview view] setFrame:[[controller view] bounds]];
    [[controller view] addSubview:[_preview view]];
    
    NSMutableArray *result = [NSMutableArray array];
    int actionIndex = 0;

    if (_contentHeight > 0) {
        controller.preferredContentSize = CGSizeMake(0.0, _contentHeight);
    }
    
    UITableView *tableView = [self ensureTableView];
    UITableViewCell *cell = nil;
    
    // Handle UITableView and touches on non-cells
    if(tableView != nil) {
        cell = [tableView cellForRowAtIndexPath:[tableView indexPathForRowAtPoint:location]];
        
        // If the tap was not on a cell, don't continue
        if(cell == nil) {
            return nil;
        }
    } else {
        [self setCurrentIndexPath:nil];
    }
    
    for (id item in _actions) {
        if ([item isKindOfClass:[TiUIiOSPreviewActionProxy class]] == YES) {
            [item setActionIndex:actionIndex];
            
            if(cell != nil) {
                [self setCurrentIndexPath:[tableView indexPathForRowAtPoint:location]];
                [item setTableViewIndexPath:[self currentIndexPath]];
            }
            
            [result addObject:[item action]];

            actionIndex++;
        } else if ([item isKindOfClass:[TiUIiOSPreviewActionGroupProxy class]] == YES) {
            [item setActionGroupIndex:actionIndex];
            [result addObject:[item group]];

            actionIndex++;
        }
    }

    previewingContext.sourceRect = [self createSourceRectWithLocation:&location];
    [controller setPreviewActions:result];
    [_preview windowWillOpen];
    
    return controller;
}

-(CGRect)createSourceRectWithLocation:(CGPoint*)location
{
    UITableView *tableView = [self ensureTableView];
    
    if (tableView) {
        NSIndexPath *indexPath = [tableView indexPathForRowAtPoint:*location];
        UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
        
        return cell.frame;
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
    if ([_sourceView isKindOfClass:[TiUITableViewProxy class]] == YES) {
        TiUITableViewProxy* tableProxy = (TiUITableViewProxy*)_sourceView;
        TiUITableView *view = (TiUITableView*)[tableProxy view];
        return [view tableView];
    }
#endif
    
    return nil;
}

@end
#endif
