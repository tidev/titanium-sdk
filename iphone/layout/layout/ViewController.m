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

    TiLayoutView* parentView = [[TiLayoutView alloc] init];
    [parentView setWidth:@300];
    [parentView setHeight:@"SIZE"];
    [parentView setLayout_:@"vertical"];
    [parentView setBackgroundColor:[UIColor lightGrayColor]];
    
    TiLayoutView* view = [[TiLayoutView alloc] init];
    [view setWidth:@"100"];
    [view setHeight:@"100"];
    [view setViewName:@"this_view"];
    [view setBackgroundColor:[UIColor redColor]];

    TiLabel* label = [[TiLabel alloc] init];
    [label setText:@"Bacon ipsum dolor amet jowl boudin prosciutto capicola, tail ribeye flank. Pork belly chicken meatloaf picanha chuck frankfurter pig filet mignon jowl ham"];

    [parentView addSubview:view];
    [parentView addSubview:label];

    [myView addSubview:parentView];
    [[self view] addSubview:myView];

    
    CGFloat height = [parentView heightIfWidthWere:300];
    NSLog(@"Height: %f", height);

    [parentView setOnLayout:^(TiLayoutView *sender, CGRect rect) {
        NSLog(@"Height: %f", rect.size.height);
    }];


    NSMutableArray* array = [NSMutableArray array];
    //
    for (NSInteger i =0; i < 100; i++) {
        
        TiTableViewRow* row = [[TiTableViewRow alloc] init];
        [row setLayout_:@"vertical"];
        [row setHeight_:@"SIZE"];
        
        
        if (i % 2) {
            TiLabel* label = [[TiLabel alloc] init];
            [label setText:@"Bacon ipsum dolor amet jowl boudin prosciutto capicola, tail ribeye flank. Pork belly chicken meatloaf picanha chuck frankfurter pig filet mignon jowl ham"];
            TiView* v = [[TiView alloc] init];
            [v setWidth:@"100"];
            [v setHeight:@"100"];
            [v setBackgroundColor: [UIColor redColor]];
            [row addSubview:label];
            [row addSubview:v];
            [[row parentView] setViewName: @"1"];
        } else {
            TiLabel* label = [[TiLabel alloc] init];
            [label setText:@"Bacon ipsum dolor amet jowl boudin prosciutto capicola, tail ribeye flank. Pork belly chicken meatloaf picanha chuck frankfurter pig filet mignon jowl ham. Picanha tenderloin rump ball tip."];
            [row addSubview:label];
            [[row parentView] setViewName: @"2"];
        }
        [array addObject:row];
    }

    
    TiTableView* table = [[TiTableView alloc] init];
    [table setTableData:array];
    
    [myView addSubview:table];
    [[self view] addSubview:myView];
    
}
@end
