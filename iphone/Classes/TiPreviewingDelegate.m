//
//  TiPreviewingDelegate.m
//  Titanium
//
//  Created by Hans Knöchel on 25/09/15.
//
//

#if IS_XCODE_7
#import "TiPreviewingDelegate.h"

@implementation TiPreviewingDelegate
@synthesize proxy = _proxy, sourceView = _sourceView, actions = _actions;

-(instancetype)initWithPreviewContext:(TiUIiOSPreviewContextProxy*)previewContext
{
    if (self = [self init]) {
        _proxy = [previewContext window];
        _sourceView = [previewContext sourceView];
        _actions = [previewContext actions];
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
    
    [_proxy windowWillOpen];
    
    //controller.preferredContentSize = CGSizeMake(0, 300);
    previewingContext.sourceRect = _sourceView.view.frame;
    
    NSMutableArray *result = [NSMutableArray array];
    int index = 0;
    
    for (id item in _actions) {
        if ([item isKindOfClass:[TiUIiOSPreviewActionProxy class]] == YES) {
            [item setActionIndex:index];
            [result addObject:[item action]];

            index++;
        } else if ([item isKindOfClass:[TiUIiOSPreviewActionGroupProxy class]] == YES) {
            [item setActionGroupIndex:index];
            [result addObject:[item group]];

            index++;
        }
    }

    [controller setActionItems:result];
    
    return controller;
}

@end
#endif
