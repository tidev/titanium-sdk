//
//  TiToolbar.m
//  layout
//
//  Created by Pedro Enrique on 8/17/15.
//  Copyright © 2015 Pedro Enrique. All rights reserved.
//

#import "TiToolbar.h"


@implementation TiToolbar

- (instancetype)init
{
    self = [super init];
    if (self) {
        _toolbar = [[UIToolbar alloc] init];
        [self addSubview:_toolbar];
        [self setDefaultHeight:TiDimensionAutoSize];
        [self setDefaultWidth:TiDimensionAutoFill];
    }
    return self;
}

-(void)setItems:(NSArray<TiLayoutView*>*)items
{
    NSMutableArray<UIBarButtonItem*>* allItems = [NSMutableArray array];
    for(TiLayoutView* currentItem in items) {
        UIBarButtonItem* newItem = [[UIBarButtonItem alloc] initWithCustomView:currentItem];
        [allItems addObject:newItem];
    }
    [[self toolbar] setItems:allItems];
}

@end
