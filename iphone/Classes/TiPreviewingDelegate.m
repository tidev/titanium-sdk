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
    
    RELEASE_TO_NIL(_preview);
    RELEASE_TO_NIL(_sourceView);
    RELEASE_TO_NIL(_actions);
    RELEASE_TO_NIL(_popCallback);
    RELEASE_TO_NIL(_previewContext);
    
    [super dealloc];
}

-(void)previewingContext:(id<UIViewControllerPreviewing>)previewingContext commitViewController:(UIViewController *)viewControllerToCommit
{
    NSDictionary * propertiesDict = @{ @"preview" : _preview };
    NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
    
    [_popCallback call:invocationArray thisObject:_previewContext];
    [invocationArray release];
}

- (UIViewController*)previewingContext:(id<UIViewControllerPreviewing>)previewingContext viewControllerForLocation:(CGPoint)location
{
    TiViewController *controller = [[TiViewController alloc] initWithViewProxy:_preview];
    NSMutableArray *result = [NSMutableArray array];
    int actionIndex = 0;

    if (_contentHeight > 0) {
        controller.preferredContentSize = CGSizeMake(0.0, _contentHeight);
    }
    
    for (id item in _actions) {
        if ([item isKindOfClass:[TiUIiOSPreviewActionProxy class]] == YES) {
            [item setActionIndex:actionIndex];
            [result addObject:[item action]];

            actionIndex++;
        } else if ([item isKindOfClass:[TiUIiOSPreviewActionGroupProxy class]] == YES) {
            [item setActionGroupIndex:actionIndex];
            [result addObject:[item group]];

            actionIndex++;
        }
    }

    previewingContext.sourceRect = [self createSourceRectWithController:controller andLocation:&location];
    [controller setActionItems:result];
    [_preview windowWillOpen];
    
    return controller;
}

-(CGRect)createSourceRectWithController:(TiViewController*)controller andLocation:(CGPoint*)location
{
    UITableView *tableView = nil;

#ifdef USE_TI_UILISTVIEW
    if ([_sourceView isKindOfClass:[TiUIListViewProxy class]] == YES) {
        TiUIListViewProxy* listProxy = (TiUIListViewProxy*)_sourceView;
        TiUIListView *view = (TiUIListView*)[listProxy view];
        tableView = [view tableView];
    }
#endif
    
#ifdef USE_TI_UITABLEVIEW
    if ([_sourceView isKindOfClass:[TiUITableViewProxy class]] == YES) {
        TiUITableViewProxy* tableProxy = (TiUITableViewProxy*)_sourceView;
        TiUITableView *view = (TiUITableView*)[tableProxy view];
        tableView = [view tableView];
    }
#endif
    
    if (tableView) {
        NSIndexPath *indexPath = [tableView indexPathForRowAtPoint:*location];
        UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
        
        return cell.frame;
    }

    return CGRectZero; // The Frame is detected automatically on normal views
}

@end
#endif
