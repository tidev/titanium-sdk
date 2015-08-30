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


#import "TiUILayoutView.h"

static NSMutableArray* viewControllers = nil;

@interface TiButton : TiLayoutView
@property (nonatomic) UIButton* button;
@property(nonatomic, copy) void (^onClick)(TiButton* sender);

@end

@implementation TiButton

- (instancetype)init
{
    self = [super init];
    if (self) {
        _button = [[UIButton alloc] init];
        [_button setTranslatesAutoresizingMaskIntoConstraints:NO];
        [_button setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
        [self addSubview:_button];
        
        [self setDefaultHeight:TiDimensionFromObject(@"SIZE")];
        [self setDefaultWidth:TiDimensionFromObject(@"SIZE")];
        
        [self setInnerView:_button];
        [_button addTarget:self action:@selector(onButtonClick:) forControlEvents:UIControlEventTouchUpInside];
    }
    return self;
}
-(void)onButtonClick:(id)sender
{
    if (_onClick != nil) {
        _onClick(self);
    }
}
@end

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
    [view setBackgroundColor:[UIColor lightGrayColor]];
    
//    contentView = [[TiLayoutView alloc] init];
//    contentView.viewName = @"BackgroundView";
//    [view addSubview:contentView];
//    [self setView:view];
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
    
    UIView* cell = [[UIView alloc] init];
    cell.backgroundColor = [UIColor whiteColor];
    TiLayoutView* parentView = [[TiLayoutView alloc] init];
    parentView.height = @"SIZE";
    {
        TiLabel* label = [[TiLabel alloc] init];
        label.top = @20;
        label.left = @20;
        label.right = @20;
        [label setText:@"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt"];
        [parentView addSubview:label];
    }
    {
        TiLabel* label = [[TiLabel alloc] init];
        label.top = @200;
        label.left = @20;
        label.bottom = @10;
        label.right = @20;
        [label setText:@"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt, Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt"];
        [parentView addSubview:label];
    }
    
    [cell addSubview:parentView];
    [cell setBounds: CGRectMake(0.0f, 0.0f, 200, [[UIScreen mainScreen] bounds].size.height)];
    [cell setNeedsLayout];
    [cell layoutIfNeeded];
    CGSize s = [cell systemLayoutSizeFittingSize:UILayoutFittingCompressedSize];
    NSLog(@"Rect %@", NSStringFromCGSize(cell.frame.size));
    [cell setFrame:CGRectMake(0, 0, 200, s.height)];
    cell.center = self.view.center;
    [[self view] addSubview:cell];
    
    /*
     TiToolbar* toolbar = [[TiToolbar alloc] init];
     [contentView insertSubview:toolbar atIndex:1];
    {
        TiSwitch* toggle1 = [[TiSwitch alloc] init];
        TiSwitch* toggle2 = [[TiSwitch alloc] init];
        TiSwitch* toggle3 = [[TiSwitch alloc] init];
        
        toggle1.viewName = @"Switch1";
        toggle2.viewName = @"Switch2";
        toggle3.viewName = @"Switch3";
        
        toggle1.backgroundColor = [UIColor redColor];
        toggle2.backgroundColor = [UIColor yellowColor];
        toggle3.backgroundColor = [UIColor greenColor];
        NSArray<TiLayoutView*>* items = @[toggle1,toggle2,toggle3];
        [toggle1 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
            NSLog(@"Item 1: %@", NSStringFromCGRect(rect));
        }];
        [toggle2 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
            NSLog(@"Item 2: %@", NSStringFromCGRect(rect));
        }];
        [toggle3 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
            NSLog(@"Item 3: %@", NSStringFromCGRect(rect));
        }];
        [toolbar setItems:items];
    }
    TiLayoutView* newView = [[TiLayoutView alloc] init];
    newView.backgroundColor = [UIColor redColor];
    newView.viewName = @"RedView";
    [newView setWidth_:@100];
    [newView setHeight_:@100];
    [contentView insertSubview:newView atIndex:5];
    */
    /*
    TiLayoutView* cV = contentView == nil ? (TiLayoutView*)self.view : contentView;
    
    TiButton* openNewButton = [[TiButton alloc] init];
    [[openNewButton button] setTitle:@"open new" forState:UIControlStateNormal];
    [openNewButton setTop_:@10];
    [openNewButton setOnClick:^(TiButton *sender) {
        [self openNewViewController];
    }];
    [cV addSubview:openNewButton];

    
    TiButton* closeNewButton = [[TiButton alloc] init];
    [[closeNewButton button] setTitle:@"close this" forState:UIControlStateNormal];
    [closeNewButton setBottom_:@60];
    [closeNewButton setOnClick:^(TiButton *sender) {
        [self closeThisViewController];
    }];
    [cV addSubview:closeNewButton];

    
    TiButton* logButton = [[TiButton alloc] init];
    [[logButton button] setTitle:@"log" forState:UIControlStateNormal];
    [logButton setBottom_:@10];
    [logButton setOnClick:^(TiButton *sender) {
        NSLog(@"%@", [self presentationController]);
    }];
    [cV addSubview:logButton];


    TiButton* openNavButton = [[TiButton alloc] init];
    [[openNavButton button] setTitle:@"open nav" forState:UIControlStateNormal];
    [openNavButton setTop_:@60];
    [openNavButton setOnClick:^(TiButton *sender) {
        [self openNavWindow];
    }];
    [cV addSubview:openNavButton];
    

    TiScrollView* container = [[TiScrollView alloc] init];
    container.top = @120;
    container.bottom = @120;
    container.left = @20;
    container.right = @20;
    container.layout = @"vertical";
    container.backgroundColor = [UIColor whiteColor];
    
    [cV addSubview:container];
    
    TiTextField* field = [[TiTextField alloc] init];
    field.backgroundColor = [self randomColor];
    [container addSubview:field];
    
    for (NSInteger i = 1; i < [viewControllers count]; i++) {
        TiButton* btn = [[TiButton alloc] init];
        [[btn button] setTitle:TI_STRING(@"Close view %li", (long)i) forState:UIControlStateNormal];
        btn.top = @5;
        btn.onClick = ^(TiButton *sender) {
            [self closeViewController:[viewControllers objectAtIndex:i]];
        };
        [container addSubview:btn];
    }
    */
    
    if ([self navigationController]) {

        TiSwitch* toggle1 = [[TiSwitch alloc] init];
        UIBarButtonItem* bttn = [[UIBarButtonItem alloc] initWithCustomView: toggle1];

        TiSwitch* toggle2 = [[TiSwitch alloc] init];
        
        UIBarButtonItem* btt2 = [[UIBarButtonItem alloc] initWithCustomView: toggle2];

//        [toggle1 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
//            [sender setHidden:NO];
//            [sender setTranslatesAutoresizingMaskIntoConstraints:YES];
//            [sender setAutoresizingMask:UIViewAutoresizingFlexibleHeight|UIViewAutoresizingFlexibleWidth];
//            NSLog(@"Final rect: %@", NSStringFromCGRect(rect));
//        }];
//        [toggle2 setOnLayout:^(TiLayoutView *sender, CGRect rect) {
//            [sender setHidden:NO];
//            [sender setTranslatesAutoresizingMaskIntoConstraints:YES];
//            [sender setAutoresizingMask:UIViewAutoresizingFlexibleHeight|UIViewAutoresizingFlexibleWidth];
//            NSLog(@"Final rect: %@", NSStringFromCGRect(rect));
//        }];
        [self setToolbarItems:@[bttn, btt2]];
        [[self navigationController] setToolbarHidden:NO];
    }
    
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
