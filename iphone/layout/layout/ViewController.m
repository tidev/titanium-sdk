/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ViewController.h"
#import "TiButton.h"
#import "TiLabel.h"
#import "TiScrollView.h"
#import "TiScrollableView.h"
#import "TiSwitch.h"
#import "TiTableView.h"
#import "TiTextField.h"
#import "TiToolbar.h"
#import "TiView.h"

#define FILL @"FILL"
#define SIZE @"SIZE"

@implementation ViewController

- (UIColor *)randomColor
{
  CGFloat hue = (arc4random() % 256 / 256.0); //  0.0 to 1.0
  CGFloat saturation = (arc4random() % 128 / 256.0) + 0.5; //  0.5 to 1.0, away from white
  CGFloat brightness = (arc4random() % 128 / 256.0) + 0.5; //  0.5 to 1.0, away from black
  return [UIColor colorWithHue:hue saturation:saturation brightness:brightness alpha:1];
}
// UIBarButtonItem *fixedItem = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFixedSpace target:nil action:nil];

- (void)viewDidLoad
{

  [super viewDidLoad];

  TiLayoutView *myView = [[TiLayoutView alloc] init];
  [[self view] addSubview:myView];

  // Write your quicky tests here
}
@end
