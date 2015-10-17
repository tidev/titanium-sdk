//
//  TiSwitch.m
//  layout
//
//  Created by Pedro Enrique on 8/14/15.
//  Copyright © 2015 Pedro Enrique. All rights reserved.
//

#import "TiSwitch.h"

@interface TiSwitch()
{
    UISwitch* _switch;
}
@end
@implementation TiSwitch


- (instancetype)init
{
    self = [super init];
    if (self) {
        _switch = [[UISwitch alloc] init];
        [self setDefaultHeight:TiDimensionAutoSize];
        [self setDefaultWidth:TiDimensionAutoSize];
        [self addSubview:_switch];
    }
    return self;
}

-(UISwitch*)toggle
{
    return _switch;
}
@end
