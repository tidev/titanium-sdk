/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ViewController.h"
#import "TiLayoutView.h"
#import "TiScrollView.h"
#import "TiTextField.h"
#import "TiSwitch.h"
#import "TiToolbar.h"
#import "TiUtils.h"
#import "TiLabel.h"
#import "TiButton.h"

#define FILL @"FILL"
#define SIZE @"SIZE"

static NSMutableArray* viewControllers = nil;



@interface ViewController ()
{
    TiLayoutView* contentView;
}
@end

@implementation ViewController

-(UIColor*) randomColor
{
    CGFloat hue = ( arc4random() % 256 / 256.0 );  //  0.0 to 1.0
    CGFloat saturation = ( arc4random() % 128 / 256.0 ) + 0.5;  //  0.5 to 1.0, away from white
    CGFloat brightness = ( arc4random() % 128 / 256.0 ) + 0.5;  //  0.5 to 1.0, away from black
    return [UIColor colorWithHue:hue saturation:saturation brightness:brightness alpha:1];
}

-(void)loadView
{
    self.edgesForExtendedLayout = UIRectEdgeNone;
    
    if (viewControllers == nil) {
        viewControllers = [[NSMutableArray alloc] init];
    }
    [viewControllers addObject:self];

    [super loadView];
    UIView* view = [self view];
    [view setBackgroundColor:[UIColor whiteColor]];
    
    contentView = [[TiLayoutView alloc] init];
    contentView.viewName = @"contentView";
    contentView.backgroundColor = [UIColor lightGrayColor];
    [view addSubview:contentView];
}

-(void)onTimer:(id)sender
{
    [self openNavWindow];
}

-(TiLayoutView*)contentView
{
    return contentView;
}

- (void)viewDidLoad {
    [super viewDidLoad];

    TiScrollView* scrollView = [[TiScrollView alloc] init];
    scrollView.layout = @"vertical";
    scrollView.contentView.width = FILL;
    scrollView.contentView.height = SIZE;
    
    for (int i = 0; i < 30; i++) {
        TiLayoutView* view = [[TiLayoutView alloc] init];
        view.height = @100;
        view.viewName = TI_STRING(@"View.%i", i);
        view.backgroundColor = [self randomColor];
        [scrollView addSubview:view];
    }
    
    [[self contentView] addSubview:scrollView];
    [scrollView setOnContentLayout:^(TiLayoutView *sender, CGRect rect) {
        NSLog(@"ContentView Rect: %@", NSStringFromCGRect(rect));
        NSLog(@"%@", [sender constraints]);
    }];
    [scrollView setOnLayout:^(TiLayoutView *sender, CGRect rect) {
        NSLog(@"Scrollview Rect: %@", NSStringFromCGRect(rect));
        NSLog(@"%@", [sender constraints]);
    }];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

-(void)triggerLayoutUpdate
{
    UIApplication *app = [UIApplication sharedApplication];
    UIWindow *window = [app keyWindow];
    UIViewController* root = [window rootViewController];
    window.rootViewController = nil;
    window.rootViewController = root;
}

-(UIViewController*)rootViewController
{
    UIViewController* rootViewController = [self presentingViewController];
    if (rootViewController == nil) {
        rootViewController = [[[UIApplication sharedApplication] keyWindow] rootViewController];
    }
    return rootViewController;
}

-(void)openNewViewController
{
    ViewController *newViewController = [[ViewController alloc] init];
//    [self presentViewController:newViewController animated:YES completion:nil];
    UIViewController* rootViewController = [self rootViewController];
    [rootViewController addChildViewController:newViewController];
    [[rootViewController view] addSubview:[newViewController view]];
    [[rootViewController view] bringSubviewToFront:[newViewController view]];
    [newViewController didMoveToParentViewController:rootViewController];
    [self triggerLayoutUpdate];
}

-(void)closeThisViewController
{
//    [[self presentingViewController] dismissViewControllerAnimated:YES completion:nil];
    [self closeViewController:self];
}

-(void)closeViewController:(UIViewController*)controller;
{
    
    if ([controller navigationController] != nil && [[[controller navigationController] viewControllers] objectAtIndex:0] == controller) {
        controller = [controller navigationController];
    }
    
    [[controller view] removeFromSuperview];
    [controller removeFromParentViewController];
    [viewControllers removeObject:self];

    [self triggerLayoutUpdate];
}

-(void)openNavWindow
{
    UINavigationController* newViewController = [[UINavigationController alloc] init];
    [[newViewController navigationBar] setTranslucent:NO];
    [newViewController pushViewController:[[ViewController alloc] init] animated:NO];
    
    UIViewController* rootViewController = [self rootViewController];
//    [rootViewController addChildViewController:newViewController];
//    [[rootViewController view] insertSubview:[newViewController view] aboveSubview: [rootViewController view]];
//    [newViewController didMoveToParentViewController:rootViewController];
    [rootViewController presentViewController:newViewController animated:YES completion:nil];
}
@end
