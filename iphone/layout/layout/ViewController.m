/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ViewController.h"
#import "TiScrollableView.h"
#import "TiScrollView.h"
//#import "TiTextField.h"
//#import "TiSwitch.h"
//#import "TiToolbar.h"
//#import "TiUtils.h"
#import "TiLabel.h"
#import "TiButton.h"

#define FILL @"FILL"
#define SIZE @"SIZE"


static TiLayoutView* createWindow(TiLayoutView* parent)
{
    TiLayoutView* window = [[TiLayoutView alloc] init];
    [window setWidth_:@320];
    [window setHeight_:@480];
    [window setBackgroundColor:[UIColor whiteColor]];
    [window setViewName:@"window"];
    [parent addSubview:window];
    return window;
}

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

- (void)viewDidLoad {
    [super viewDidLoad];

    
    TiLayoutView* window = [[TiLayoutView alloc] init];
    
    
    {
        TiScrollView* scrollView = [[TiScrollView alloc] init];
        scrollView.top = @10;
        scrollView.left = @10;
        scrollView.width = @100;
        scrollView.height = @150;
        scrollView.backgroundColor = [UIColor greenColor];
        
        TiLayoutView* view = [[TiLayoutView alloc] init];
        view.width = @150;
        view.height = @200;
        view.top = @10;
        view.backgroundColor = [UIColor grayColor];
        
        TiLabel* label = [[TiLabel alloc] init];
        label.width = @"SIZE";
        label.height = @"SIZE";
        label.text = @"Bounce:true, vertbar:false";
        label.backgroundColor = [UIColor yellowColor];
        
        
        
        [view addSubview:label];
        [scrollView addSubview:view];
        
        [window addSubview:scrollView];
    }

    {
        TiScrollView* scrollView = [[TiScrollView alloc] init];
        scrollView.top = @10;
        scrollView.right = @10;
        scrollView.width = @100;
        scrollView.height = @150;
        scrollView.backgroundColor = [UIColor greenColor];
        
        TiLayoutView* view = [[TiLayoutView alloc] init];
        view.width = @150;
        view.height = @200;
        view.top = @10;
        view.backgroundColor = [UIColor grayColor];
        
        TiLabel* label = [[TiLabel alloc] init];
        label.text = @"Bounce:true, horzbar:false";
        label.width = @"SIZE";
        label.height = @"SIZE";
        label.backgroundColor = [UIColor yellowColor];
        
        
        
        [view addSubview:label];
        [scrollView addSubview:view];
        
        [window addSubview:scrollView];
    }

    [[self view] addSubview:window];

}
@end
