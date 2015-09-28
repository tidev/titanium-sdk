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
#import "TiUIiOSPreviewActionProxy.h"
#import "TiUIiOSPreviewActionGroupProxy.h"

@interface TiPreviewingDelegate : NSObject <UIViewControllerPreviewingDelegate>

@property(nonatomic, assign) TiWindowProxy* proxy;
@property(nonatomic, assign) TiViewProxy* sourceView;

-(instancetype)initWithWindowProxy:(TiWindowProxy*)proxy andSourceView:(TiViewProxy*)sourceView;

@end
#endif