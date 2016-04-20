//
//  TiTextField.m
//  layout
//
//  Created by Pedro Enrique on 8/7/15.
//  Copyright (c) 2015 Pedro Enrique. All rights reserved.
//

#import "TiTextField.h"

@interface TiTextField()
{
    UITextField* _textField;
}
@end

@implementation TiTextField

- (instancetype)init
{
    self = [super init];
    if (self) {
        _textField = [[UITextField alloc] init];
        [_textField setTranslatesAutoresizingMaskIntoConstraints:NO];
        [self addSubview:_textField];
        
        [self setDefaultHeight:TiDimensionAutoSize];
        [self setDefaultWidth:TiDimensionAutoFill];
    }
    return self;
}

-(void)addButton:(NSString*)name
{
    UIToolbar* toolbar = (UIToolbar*)[_textField inputAccessoryView];
    if (toolbar == nil) {
        toolbar = [[UIToolbar alloc] init];
        [toolbar sizeToFit];
        [_textField setInputAccessoryView:toolbar];
    }
    NSMutableArray* items;
    if ([toolbar items] == nil) {
        items = [NSMutableArray array];
    } else {
        items = [NSMutableArray arrayWithArray:[toolbar items]];
    }
    [items addObject:[[UIBarButtonItem alloc] initWithTitle:name
                                                     style:UIBarButtonItemStylePlain
                                                    target:self
                                                    action:@selector(onButtonClick:)]];
    [toolbar setItems:items];
}

-(void)onButtonClick:(id)sender
{
    
}

@end


