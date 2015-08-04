/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ViewController.h"
#import "TiLayoutView.h"

@interface ViewController ()

@end

@implementation ViewController

-(void)loadView
{
    TiLayoutView* view = [[TiLayoutView alloc] init];
    [view setBackgroundColor:[UIColor purpleColor]];
    [self setView:view];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
