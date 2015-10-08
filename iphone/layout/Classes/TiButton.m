//
//  TiButton.m
//  layout
//
//  Created by Pedro Enrique on 9/28/15.
//  Copyright © 2015 Pedro Enrique. All rights reserved.
//

#import "TiButton.h"
#import "TiUtils.h"

@implementation TiButton

- (instancetype)init
{
    self = [super init];
    if (self) {
        _button = [[UIButton alloc] initWithFrame:[self bounds]];
        [_button setAutoresizingMask:UIViewAutoresizingFlexibleHeight|UIViewAutoresizingFlexibleWidth];
        [self addSubview:_button];
        
        [self setDefaultHeight:TiDimensionAutoSize];
        [self setDefaultWidth:TiDimensionAutoSize];
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
-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    [TiUtils setView:_button positionRect:bounds];
    [super frameSizeChanged:frame bounds:bounds];
}


@end
