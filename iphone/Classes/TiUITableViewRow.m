
//
//  TiUITableViewRow.m
//  Titanium
//
//  Created by Pedro Enrique on 8/20/15.
//
//

#import "TiUITableViewRow.h"

@implementation TiUITableViewRow

- (instancetype)init
{
    self = [super init];
    if (self) {
        [self setDefaultHeight:TiDimensionAutoSize];
        [self setDefaultWidth:TiDimensionAutoFill];
        [self setWidth_:@"FILL"];
        [self setHeight_:@"SIZE"];
    }
    return self;
}

- (void)processTouchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
    
}
- (void)processTouchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
    
}
- (void)processTouchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
    
}
- (void)processTouchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
    
}

-(void)setBackgroundColor_:(id)value
{
    
}

-(void)setBackgroundImage_:(id)value
{
    
}

-(void)removeFromSuperview
{
    [super removeFromSuperview];
}

-(void)didMoveToSuperview
{
    [self setLoaded:NO];
    [super didMoveToSuperview];
    [self setTranslatesAutoresizingMaskIntoConstraints:YES];
    [self setAutoresizingMask:UIViewAutoresizingFlexibleHeight|UIViewAutoresizingFlexibleWidth];
    [self setFrame:[[self superview] bounds]];
}



@end
