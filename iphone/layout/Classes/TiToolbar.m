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

-(void)setItems:(id)items
{
    NSMutableArray<UIBarButtonItem*>* allItems = [NSMutableArray array];
    for(id currentItem in items) {
        UIBarButtonItem* newItem = nil;
        if ([currentItem isKindOfClass:[TiLayoutView class]]) {
            newItem = [[UIBarButtonItem alloc] initWithCustomView:(TiLayoutView*)currentItem];
        } else if ([currentItem isKindOfClass:[UIBarButtonItem class]]) {
            newItem = (UIBarButtonItem*)currentItem;
        }
        if (newItem) {
            [allItems addObject:newItem];
        }
    }
    [[self toolbar] setItems:allItems];
}

@end
