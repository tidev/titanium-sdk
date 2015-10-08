//
//  TiButton.m
//  layout
//
//  Created by Pedro Enrique on 9/28/15.
//  Copyright © 2015 Pedro Enrique. All rights reserved.
//

#import "TiButton.h"

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
