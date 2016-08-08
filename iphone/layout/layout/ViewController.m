/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ViewController.h"
#import "TiScrollableView.h"
#import "TiScrollView.h"
#import "TiTextField.h"
#import "TiSwitch.h"
#import "TiToolbar.h"
#import "TiView.h"
#import "TiLabel.h"
#import "TiButton.h"
#import "TiTableView.h"

#define FILL @"FILL"
#define SIZE @"SIZE"



@implementation ViewController

-(UIColor*) randomColor
{
    CGFloat hue = ( arc4random() % 256 / 256.0 );  //  0.0 to 1.0
    CGFloat saturation = ( arc4random() % 128 / 256.0 ) + 0.5;  //  0.5 to 1.0, away from white
    CGFloat brightness = ( arc4random() % 128 / 256.0 ) + 0.5;  //  0.5 to 1.0, away from black
    return [UIColor colorWithHue:hue saturation:saturation brightness:brightness alpha:1];
}
// UIBarButtonItem *fixedItem = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFixedSpace target:nil action:nil];


- (void)viewDidLoad {
    
    [super viewDidLoad];
    
    TiLayoutView* myView = [[TiLayoutView alloc] init];
    [[self view] addSubview:myView];
    
    // Write your quicky tests here
    
}
@end
