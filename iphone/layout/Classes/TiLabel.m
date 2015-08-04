/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiLabel.h"

@interface TiLabel()
{
    UILabel* label;
}
@end

@implementation TiLabel

- (instancetype)init
{
    self = [super init];
    if (self) {
        label = [[UILabel alloc] init];
        [label setTranslatesAutoresizingMaskIntoConstraints:NO];
        [label setNumberOfLines:0];
        [self addSubview:label];
        
        [self setDefaultHeight:TiDimensionFromObject(@"SIZE")];
        [self setDefaultWidth:TiDimensionFromObject(@"SIZE")];
        
        [self setInnerView:label];
    }
    return self;
}


-(void)setText:(NSString*) text
{
    [label setText:text];
//    [label setNeedsUpdateConstraints];
}

@end
