//
//  TiPreviewingDelegate.h
//  Titanium
//
//  Created by Hans Knöchel on 25/09/15.
//
//

#if IS_XCODE_7
#import <Foundation/Foundation.h>
#import "TiWindowProxy.h"
#import "TiViewController.h"
#import "TiViewProxy.h"
#import "TiUIiOSPreviewContextProxy.h"
#import "TiUIiOSPreviewActionProxy.h"
#import "TiUIiOSPreviewActionGroupProxy.h"

@class TiUIiOSPreviewContextProxy;

@interface TiPreviewingDelegate : NSObject <UIViewControllerPreviewingDelegate>
{
    
}
@property(nonatomic, assign) TiWindowProxy* proxy;
@property(nonatomic, assign) TiViewProxy* sourceView;
@property(nonatomic, retain) NSArray* actions;

- (instancetype)initWithPreviewContext:(TiUIiOSPreviewContextProxy*)previewContext;

@end
#endif