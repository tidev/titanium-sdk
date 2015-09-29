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
        _proxy = [previewContext window];
        _sourceView = [previewContext sourceView];
        _actions = [previewContext actions];
        _contentHeight = [previewContext contentHeight];
    }
    
    return self;
}

-(void)dealloc
{
    [_proxy forgetSelf];
    [_sourceView forgetSelf];
    
    RELEASE_TO_NIL(_proxy);
    RELEASE_TO_NIL(_sourceView);
    RELEASE_TO_NIL(_actions);
    
    [super dealloc];
}

-(void)previewingContext:(id<UIViewControllerPreviewing>)previewingContext commitViewController:(UIViewController *)viewControllerToCommit
{
    [_proxy open:@[@{@"modal" : NUMBOOL(YES), @"animated" : NUMBOOL(NO)}]];
}

- (UIViewController*)previewingContext:(id<UIViewControllerPreviewing>)previewingContext viewControllerForLocation:(CGPoint)location
{
    TiViewController *controller = (TiViewController*)[_proxy hostingController];
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
    [_proxy windowWillOpen];
    
    return controller;
}

-(CGRect)createSourceRectWithController:(TiViewController*)controller andLocation:(CGPoint*)location
{
    UITableView *tableView = nil;
    
    if ([_sourceView isKindOfClass:[TiUIListViewProxy class]] == YES) {
        TiUIListViewProxy* listProxy = (TiUIListViewProxy*)_sourceView;
        TiUIListView *view = (TiUIListView*)[listProxy view];
        tableView = [view tableView];
    } else if ([_sourceView isKindOfClass:[TiUITableViewProxy class]] == YES) {
        TiUITableViewProxy* tableProxy = (TiUITableViewProxy*)_sourceView;
        TiUITableView *view = (TiUITableView*)[tableProxy view];
        tableView = [view tableView];
    }
    
    if (tableView) {
        NSIndexPath *indexPath = [tableView indexPathForRowAtPoint:*location];
        UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
        
        return cell.frame;
    } else {
        return [[controller view] bounds];
    }
}

@end
#endif
