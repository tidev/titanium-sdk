//
//  TiPreviewingDelegate.h
//  Titanium
//
//  Created by Hans Knöchel on 25/09/15.
//
//

#if IS_XCODE_7
#ifdef USE_TI_UIIOSPREVIEWCONTEXT

#import <Foundation/Foundation.h>
#import "TiWindowProxy.h"
#import "TiViewController.h"
#import "TiViewProxy.h"
#import "TiUIiOSPreviewContextProxy.h"
#import "TiUIiOSPreviewActionProxy.h"
#import "TiUIiOSPreviewActionGroupProxy.h"

@class TiUIiOSPreviewContextProxy;

@interface TiPreviewingDelegate : NSObject <UIViewControllerPreviewingDelegate>

@property(nonatomic, assign) TiUIiOSPreviewContextProxy *previewContext;

@property(nonatomic, assign) TiViewProxy* preview;
@property(nonatomic, assign) TiViewProxy* sourceView;
@property(nonatomic, retain) NSArray* actions;
@property(nonatomic) int contentHeight;
@property(nonatomic, retain) NSDictionary* listViewEvent;

- (instancetype)initWithPreviewContext:(TiUIiOSPreviewContextProxy*)previewContext;
- (CGRect)createSourceRectWithLocation:(CGPoint)location;

@end
#endif
#endif