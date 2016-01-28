//
//  TiLayoutViewController.h
//  layout
//
//  Created by Pedro Enrique on 8/10/15.
//  Copyright (c) 2015 Pedro Enrique. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "TiLayoutView.h"

#ifdef TI_UNIT_TESTS
@protocol TiWindowProtocol<NSObject>
-(void)resignFocus;
-(void)gainFocus;
-(BOOL)isModal;
@end

@interface TiViewProxy : NSObject
{
    TiLayoutView* view;
}
-(TiLayoutView*)view;
@end
#else
#import "TiViewProxy.h"
#import "TiControllerProtocols.h"
#endif

@interface TiLayoutViewController : UIViewController
{
}

@property(nonatomic, readonly) TiViewProxy<TiWindowProtocol>* viewProxy;
@property(nonatomic, readonly) TiLayoutView* hostingView;
-(instancetype)initWithViewProxy:(TiViewProxy<TiWindowProtocol>*)viewProxy;
-(TiViewProxy*)proxy;

@end
