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
//#import "TiSwitch.h"
#import "TiToolbar.h"
//#import "TiUtils.h"
#import "TiLabel.h"
#import "TiButton.h"

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
    
    dispatch_async(dispatch_get_main_queue(), ^{
        
        UIView* thisView = [self view];
        
        TiLayoutView* window = [[TiLayoutView alloc] init];
        [window setOnLayout:^(TiLayoutView *s, CGRect r) {
            NSLog(@"here");
        }];
        
        TiToolbar* toolbar = [[TiToolbar alloc] init];
        [window insertSubview:toolbar atIndex:0];
        
        toolbar.backgroundColor = [UIColor grayColor];
        
        UIBarButtonItem *flexSpace = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace target:nil action:nil];
        UIBarButtonItem* button1 = [[UIBarButtonItem alloc] initWithTitle:@"meh 1" style:UIBarButtonItemStylePlain target:nil action:nil];
        
        TiTextField* textField = [[TiTextField alloc] init];
        textField.viewName = @"TiUITextField";
        
        button1.width = 33;
        
        textField.backgroundColor = [UIColor yellowColor];
        textField.width = @200;
        textField.height = @32;
        
        [toolbar setItems:@[flexSpace, button1, flexSpace, textField, flexSpace]];
        
        
        [thisView addSubview:window];
        [thisView bringSubviewToFront:window];
        
        NSLog(@"Done");
    });
}
@end
