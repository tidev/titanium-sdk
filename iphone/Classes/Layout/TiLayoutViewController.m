//
//  TiLayoutViewController.m
//  layout
//
//  Created by Pedro Enrique on 8/10/15.
//  Copyright (c) 2015 Pedro Enrique. All rights reserved.
//

#import "TiLayoutViewController.h"
#define LOG_MISSING NSLog(@"Missing %s", __PRETTY_FUNCTION__);

 
#ifdef TI_UNIT_TESTS
#import "TiUtils.h"
@implementation TiViewProxy
-(TiLayoutView*)view
{
    if (view != nil) return view;
    view = [[TiLayoutView alloc] init];
    return view;
}
@end
#else
#import "TiUIView.h"
#import "TiApp.h"
#endif


@interface TiLayoutViewController ()

@end

@implementation TiLayoutViewController

@synthesize viewProxy = _viewProxy;

-(instancetype)initWithViewProxy:(TiViewProxy<TiWindowProtocol>*)viewProxy
{
    if (self = [self init])
    {
        _viewProxy = viewProxy;
        [TiUtils configureController:self withObject:_viewProxy];
    }
    return self;
}

- (instancetype)init
{
    self = [super init];
    if (self) {

    }
    return self;
}

- (void) loadView
{
    if (_viewProxy != nil) {
        _hostingView = [_viewProxy view];
        if ([_viewProxy isModal] || [_viewProxy isManaged]) {
            [super loadView];
            [[self view] addSubview:_hostingView];
        } else {
            [self setView:_hostingView];
        }
        return;
    }
    [super loadView];
}

- (void)viewDidLoad {
    [super viewDidLoad];

}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];

}

- (BOOL)shouldAutorotate
{
    return YES;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
    if (_viewProxy != nil) {
        UIInterfaceOrientationMask mask = (UIInterfaceOrientationMask)[_viewProxy orientationFlags];
        return mask;
    }
    return (UIInterfaceOrientationMask)[[TiApp controller] defaultOrientations];
}

-(TiViewProxy*)proxy
{
    DebugLog(@"[WARN] [TiLayoutViewController proxy] is deprecated, use \"viewProxy\" instead. Place a breakpoint here");
    return [self viewProxy];
}

-(void)notifyScrollViews:(UIView*)parent keyboardSize:(CGSize)size
{
    for (UIView* child in [parent subviews]) {
        if ([child conformsToProtocol:@protocol(TiScrolling)]) {
            if (CGSizeEqualToSize(size, CGSizeZero)) {
                [(UIView<TiScrolling>*)child keyboardDidHide];
            } else {
                [(UIView<TiScrolling>*)child keyboardDidShowAtHeight: size.height];
            }
        }
        [self notifyScrollViews:child keyboardSize:size];
    }
}

-(void)keyboardWillShow:(NSNotification*)noti
{
    NSDictionary* userInfo = [noti userInfo];
    CGSize keyboardSize = [[userInfo objectForKey:UIKeyboardFrameBeginUserInfoKey] CGRectValue].size;
    [self notifyScrollViews:[self view] keyboardSize:keyboardSize];
    
}

-(void)keyboardWillHide:(NSNotification*)noti
{
    [self notifyScrollViews:[self view] keyboardSize:CGSizeZero];
}

-(void)viewWillAppear:(BOOL)animated
{
   	if ([_viewProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_viewProxy viewWillAppear:animated];
    }
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
    [super viewWillAppear:animated];
}
-(void)viewWillDisappear:(BOOL)animated
{
   	if ([_viewProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_viewProxy viewWillDisappear:animated];
    }
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
    [super viewWillDisappear:animated];
}
-(void)viewDidAppear:(BOOL)animated
{
   	if ([_viewProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_viewProxy viewDidAppear:animated];
    }
    [super viewDidAppear:animated];
}
-(void)viewDidDisappear:(BOOL)animated
{
   	if ([_viewProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_viewProxy viewDidDisappear:animated];
    }
    [super viewDidDisappear:animated];
}

@end
