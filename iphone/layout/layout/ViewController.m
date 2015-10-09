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

    TiLayoutView* myView = [[TiLayoutView alloc] init];
    [[self view] addSubview:myView];

    TiScrollableView* scrollable = [[TiScrollableView alloc] init];
    [scrollable setViewName:@"scrollable"];
    [scrollable setBackgroundColor:[UIColor grayColor]];
    [scrollable setHeight_:@"SIZE"];
    
    NSNumber* bigger = @300;
    NSNumber* top = @10;
    NSNumber* bottom = @5;
    for (int i = 0; i < 5; i++) {
        TiLayoutView* view = [[TiLayoutView alloc] init];
        [view setBackgroundColor:[UIColor blueColor]];
        if (i == 2) {
            [view setHeight_:bigger];
            [view setTop_:top];
            [view setBottom_:bottom];
        } else {
            [view setHeight_:@200];
        }
        [view setWidth_:@200];
        [scrollable addSubview:view];
    }
    
    [myView addSubview:scrollable];
    
    [scrollable setOnLayout:^(TiLayoutView *sender, CGRect rect) {
        
    }];

}
@end
