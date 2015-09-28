//
//  TiUILayoutView.m
//  layout
//
//  Created by Pedro Enrique on 8/24/15.
//  Copyright © 2015 Pedro Enrique. All rights reserved.
//

#if 0
#import "TiUILayoutView.h"
#import "TiDimension.h"


#define TI_VIEWS_DICT(...) NSDictionaryOfVariableBindings(__VA_ARGS__)
#define TI_CONSTRAINT(FORMAT,VIEWS) [NSLayoutConstraint constraintsWithVisualFormat:FORMAT options:NSLayoutFormatDirectionLeftToRight metrics:nil views:VIEWS]
#define TI_STRING(...) [NSString stringWithFormat:__VA_ARGS__]
#define IS_PERCENT TiDimensionIsPercent
#define IS_AUTO TiDimensionIsAuto
#define IS_AUTOSIZE TiDimensionIsAutoSize
#define IS_AUTOFILL TiDimensionIsAutoFill
#define IS_DIP TiDimensionIsDip
#define IS_UNDEFINED TiDimensionIsUndefined
#define TI_CONSTRAINT_STRING(constraint) \
    [NSString stringWithFormat:@"<%p-%p-%li-%li-%li>", \
             [constraint firstItem], \
             [constraint secondItem], \
             (long)[constraint firstAttribute], \
             (long)[constraint secondAttribute], \
             (long)[constraint relation] \
             ] \



static void TiLayoutAddConstraint(UIView* view, NSArray* constraints);
static void TiLayoutRemoveConstraint(UIView* view, NSArray* constraints);
static NSMutableDictionary* constraintDictionary;

@interface TiUILayoutView()
{
    TiLayoutConstraint _tiLayoutProperties;
    TiLayoutConstraint _tiPrevLayoutProperties;
}
@end

@implementation TiUILayoutView

- (instancetype)init
{
    self = [super init];
    if (self) {
        [self setTranslatesAutoresizingMaskIntoConstraints:NO];
        [self setDefaultHeight:TiDimensionAutoFill];
        [self setDefaultWidth:TiDimensionAutoFill];
    }
    return self;
}

- (void)setLeft_:(id)args
{
    _tiLayoutProperties.left = TiDimensionFromObject(args);
    [self setNeedsUpdateConstraints];
    [self updateConstraints];
}
- (void)setRight_:(id)args
{
    _tiLayoutProperties.right = TiDimensionFromObject(args);
    [self setNeedsUpdateConstraints];
    [self updateConstraints];
}
- (void)setTop_:(id)args
{
    _tiLayoutProperties.top = TiDimensionFromObject(args);
    [self setNeedsUpdateConstraints];
    [self updateConstraints];
}
- (void)setBottom_:(id)args
{
    _tiLayoutProperties.bottom = TiDimensionFromObject(args);
    [self setNeedsUpdateConstraints];
    [self updateConstraints];
}
- (void)setCenter_:(id)args
{
    NSDictionary* arg = (NSDictionary*)args;
    _tiLayoutProperties.centerX = TiDimensionFromObject([arg valueForKey:@"x"]);
    _tiLayoutProperties.centerY = TiDimensionFromObject([arg valueForKey:@"y"]);
    [self setNeedsUpdateConstraints];
    [self updateConstraints];
}
- (void)setWidth_:(id)args
{
    _tiLayoutProperties.width = TiDimensionFromObject(args);
    [self setNeedsUpdateConstraints];
    [self updateConstraints];
}
- (void)setHeight_:(id)args
{
    _tiLayoutProperties.height = TiDimensionFromObject(args);
    [self setNeedsUpdateConstraints];
    [self updateConstraints];
}

-(NSString*)viewName
{
    return [self viewName_];
}

-(void)setInnerView:(UIView *)innerView
{
    if (_innerView != nil) {
        @throw [NSException exceptionWithName:TI_STRING(@"%s", __PRETTY_FUNCTION__) reason:@"InnerView already set" userInfo:nil];
    }
    _innerView = innerView;
    [self addSubview:_innerView];
    [self sendSubviewToBack:_innerView];
    [_innerView setTranslatesAutoresizingMaskIntoConstraints:NO];
    TiLayoutAddConstraint(self, TI_CONSTRAINT( @"V:|[innerView]|" , TI_VIEWS_DICT(innerView)));
    TiLayoutAddConstraint(self, TI_CONSTRAINT( @"H:|[innerView]|" , TI_VIEWS_DICT(innerView)));
    TiLayoutAddConstraint(self, TI_CONSTRAINT( @"V:[self(innerView)]" , TI_VIEWS_DICT(self, innerView)));
    TiLayoutAddConstraint(self, TI_CONSTRAINT( @"H:[self(innerView)]" , TI_VIEWS_DICT(self, innerView)));

    [self setNeedsUpdateConstraints];
    [self updateConstraints];
}

-(void)didMoveToSuperview
{
    [super didMoveToSuperview];
    [self setNeedsUpdateConstraints];
    [self updateConstraints];
}

- (void)updateConstraints
{
    UIView* parent = [self superview];
    TiDimension width = _tiLayoutProperties.width;
    TiDimension height = _tiLayoutProperties.height;
    
    // width
    if (!TiDimensionEqual(width, _tiPrevLayoutProperties.width))
    {
        _tiPrevLayoutProperties.width = width;
        CGFloat value = TiDimensionCalculateValue(width, 1);
        NSArray* percentConstraints = @[[NSLayoutConstraint constraintWithItem:self attribute:NSLayoutAttributeWidth relatedBy:NSLayoutRelationEqual toItem:parent attribute:NSLayoutAttributeWidth multiplier:width.value constant:1]];
        NSArray* fixedConstraints = TI_CONSTRAINT( TI_STRING(@"H:[self(%f)]", value), TI_VIEWS_DICT(self));

        switch(width.type) {
            case TiDimensionTypeDip:
                TiLayoutRemoveConstraint(parent, percentConstraints);
                TiLayoutAddConstraint(self, fixedConstraints);
                break;
            case TiDimensionTypePercent:
                if (parent != nil) {
                    TiLayoutRemoveConstraint(self, fixedConstraints);
                    TiLayoutAddConstraint(parent, percentConstraints);
                } else {
                    // reset in case of no superview
                    _tiPrevLayoutProperties.width = TiDimensionUndefined;
                }
                break;
            case TiDimensionTypeUndefined:
                TiLayoutRemoveConstraint(parent, percentConstraints);
                TiLayoutRemoveConstraint(self, fixedConstraints);
                break;
            default:
                break;
        }
    }
    // height
    if (!TiDimensionEqual(height, _tiPrevLayoutProperties.height))
    {
        _tiPrevLayoutProperties.height = height;
        CGFloat value = TiDimensionCalculateValue(height, 1);
        NSArray* percentConstraints = @[[NSLayoutConstraint constraintWithItem:self attribute:NSLayoutAttributeHeight relatedBy:NSLayoutRelationEqual toItem:parent attribute:NSLayoutAttributeHeight multiplier:height.value constant:1]];
        NSArray* fixedConstraints = TI_CONSTRAINT( TI_STRING(@"V:[self(%f)]", value), TI_VIEWS_DICT(self));
        
        switch(height.type) {
            case TiDimensionTypeDip:
                TiLayoutRemoveConstraint(parent, percentConstraints);
                TiLayoutAddConstraint(self, fixedConstraints);
                break;
            case TiDimensionTypePercent:
                if (parent != nil) {
                    TiLayoutRemoveConstraint(self, fixedConstraints);
                    TiLayoutAddConstraint(parent, percentConstraints);
                } else {
                    // reset in case of no superview
                    _tiPrevLayoutProperties.height = TiDimensionUndefined;
                }
                break;
            case TiDimensionTypeUndefined:
                TiLayoutRemoveConstraint(parent, percentConstraints);
                TiLayoutRemoveConstraint(self, fixedConstraints);
                break;
            default:
                break;
        }
    }
    if (parent == nil) {
        [super updateConstraints];
        return;
    }

    TiDimension left = _tiLayoutProperties.left;
    TiDimension right = _tiLayoutProperties.right;
    TiDimension top = _tiLayoutProperties.top;
    TiDimension bottom = _tiLayoutProperties.bottom;
    TiDimension centerX = _tiLayoutProperties.centerX;
    TiDimension centerY = _tiLayoutProperties.centerY;
    
    BOOL hasLeft = !IS_UNDEFINED(left);
    BOOL hasRight = !IS_UNDEFINED(right);
    BOOL hasTop = !IS_UNDEFINED(top);
    BOOL hasBottom = !IS_UNDEFINED(bottom);
    
    if (IS_AUTOFILL(width) || (IS_UNDEFINED(width) && IS_AUTOFILL(_defaultWidth))) {
        if (!hasLeft) left = TiDimensionFromObject(@0);
        if (!hasRight) right = TiDimensionFromObject(@0);
    }

    if (IS_AUTOFILL(height) || (IS_UNDEFINED(height) && IS_AUTOFILL(_defaultHeight))) {
        if (!hasTop) top = TiDimensionFromObject(@0);
        if (!hasBottom) bottom = TiDimensionFromObject(@0);
    }

    if (IS_AUTOSIZE(width) || (IS_UNDEFINED(width) && IS_AUTOSIZE(_defaultWidth))) {
        TiLayoutAddConstraint(parent, TI_CONSTRAINT( @"H:|-(>=0)-[self]-(>=0)-|", TI_VIEWS_DICT(self)));
    } else {
        TiLayoutRemoveConstraint(parent, TI_CONSTRAINT( @"H:|-(>=0)-[self]-(>=0)-|", TI_VIEWS_DICT(self)));
    }
    if (IS_AUTOSIZE(height) || (IS_UNDEFINED(height) && IS_AUTOSIZE(_defaultHeight))) {
        TiLayoutAddConstraint(parent, TI_CONSTRAINT( @"V:|-(>=0)-[self]-(>=0)-|", TI_VIEWS_DICT(self)));
    } else {
        TiLayoutRemoveConstraint(parent, TI_CONSTRAINT( @"V:|-(>=0)-[self]-(>=0)-|", TI_VIEWS_DICT(self)));
    }

    NSLayoutConstraint* centerXConstraint;
    {
        CGFloat value = 0;
        if (IS_UNDEFINED(centerX)) {
            value = TiDimensionCalculateValue(centerX, 1);
        }
        centerXConstraint = [NSLayoutConstraint constraintWithItem:parent attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeCenterX multiplier:1 constant:value];
    }
    // left
    if (!TiDimensionEqual(left, _tiPrevLayoutProperties.left))
    {
        _tiPrevLayoutProperties.left = left;
        CGFloat value = TiDimensionCalculateValue(left, 1);
        switch(left.type) {
            case TiDimensionTypeDip:
                TiLayoutRemoveConstraint(parent, @[centerXConstraint]);
                TiLayoutAddConstraint(parent, TI_CONSTRAINT( TI_STRING(@"H:|-(%f)-[self]", value), TI_VIEWS_DICT(self)));
                break;
            case TiDimensionTypePercent:
                TiLayoutRemoveConstraint(parent, @[centerXConstraint]);
                break;
            case TiDimensionTypeUndefined:
                TiLayoutRemoveConstraint(parent, TI_CONSTRAINT( TI_STRING(@"H:|-(%f)-[self]", value), TI_VIEWS_DICT(self)));
                break;
            default:
                break;
        }
    }
    // right
    if (!TiDimensionEqual(right, _tiPrevLayoutProperties.right))
    {
        _tiPrevLayoutProperties.right = right;
        CGFloat value = TiDimensionCalculateValue(right, 1);
        switch(right.type) {
            case TiDimensionTypeDip:
                TiLayoutRemoveConstraint(parent, @[centerXConstraint]);
                TiLayoutAddConstraint(parent, TI_CONSTRAINT( TI_STRING(@"H:[self]-(%f)-|", value), TI_VIEWS_DICT(self)));
                break;
            case TiDimensionTypePercent:
                TiLayoutRemoveConstraint(parent, @[centerXConstraint]);
                break;
            case TiDimensionTypeUndefined:
                TiLayoutRemoveConstraint(parent, TI_CONSTRAINT( TI_STRING(@"H:|-(%f)-[self]", value), TI_VIEWS_DICT(self)));
                break;
            default:
                break;
        }
    }
    // center x
    if (!hasRight && !hasLeft) {
        TiLayoutAddConstraint(parent, @[centerXConstraint]);
    }
    
    
    NSLayoutConstraint* centerYConstraint;
    {
        CGFloat value = 0;
        if (IS_UNDEFINED(centerY)) {
            value = TiDimensionCalculateValue(centerY, 1);
        }
        centerYConstraint = [NSLayoutConstraint constraintWithItem:parent attribute:NSLayoutAttributeCenterY relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeCenterY multiplier:1 constant:value];
        
    }
    // top
    if (!TiDimensionEqual(top, _tiPrevLayoutProperties.top))
    {
        _tiPrevLayoutProperties.top = top;
        CGFloat value = TiDimensionCalculateValue(top, 1);
        switch(top.type) {
            case TiDimensionTypeDip:
                TiLayoutRemoveConstraint(parent, @[centerYConstraint]);
                TiLayoutAddConstraint(parent, TI_CONSTRAINT( TI_STRING(@"V:|-(%f)-[self]", value), TI_VIEWS_DICT(self)));
                break;
            case TiDimensionTypePercent:
                TiLayoutRemoveConstraint(parent, @[centerYConstraint]);
                break;
            case TiDimensionTypeUndefined:
                TiLayoutRemoveConstraint(parent, TI_CONSTRAINT( TI_STRING(@"V:|-(%f)-[self]", value), TI_VIEWS_DICT(self)));
                break;
            default:
                break;
        }
    }
    // bottom
    if (!TiDimensionEqual(bottom, _tiPrevLayoutProperties.bottom))
    {
        _tiPrevLayoutProperties.bottom = bottom;
        CGFloat value = TiDimensionCalculateValue(bottom, 1);
        switch(bottom.type) {
            case TiDimensionTypeDip:
                TiLayoutRemoveConstraint(parent, @[centerYConstraint]);
                TiLayoutAddConstraint(parent, TI_CONSTRAINT( TI_STRING(@"V:[self]-(%f)-|", value), TI_VIEWS_DICT(self)));
                break;
            case TiDimensionTypePercent:
                TiLayoutRemoveConstraint(parent, @[centerYConstraint]);
                break;
            case TiDimensionTypeUndefined:
                TiLayoutRemoveConstraint(parent, TI_CONSTRAINT( TI_STRING(@"V:[self]-(%f)-|", value), TI_VIEWS_DICT(self)));
                break;
            default:
                break;
        }
    }
    // center y
    if (!hasTop && !hasBottom) {
        TiLayoutAddConstraint(parent, @[centerYConstraint]);
    }

    
    BOOL isWidthSize = (IS_AUTOSIZE(width) || (IS_UNDEFINED(width) || IS_AUTOSIZE(_defaultWidth)));
    BOOL isHeightSize = (IS_AUTOSIZE(height) || (IS_UNDEFINED(height) || IS_AUTOSIZE(_defaultHeight)));
    
    if (isWidthSize || isHeightSize)
    {
        for (UIView* child in [self subviews]) {
            if (isWidthSize)
                TiLayoutAddConstraint(self, TI_CONSTRAINT( @"H:|-(>=0)-[child]-(>=0)-|", TI_VIEWS_DICT(child)));
            if (isHeightSize)
                TiLayoutAddConstraint(self, TI_CONSTRAINT( @"V:|-(>=0)-[child]-(>=0)-|", TI_VIEWS_DICT(child)));
        }
    }

    [super updateConstraints];
}

@end


static NSLayoutConstraint* TiLayoutGetConstraint(UIView* view, NSString* description)
{
    for (NSLayoutConstraint* current in [view constraints]) {
        if ([description isEqualToString:TI_CONSTRAINT_STRING(current)]) {
            return current;
        }
    }
    return nil;
}

static void TiLayoutAddConstraint(UIView* view, NSArray* constraints)
{
    for (NSLayoutConstraint* constraint in constraints) {
        NSLayoutConstraint* existing = TiLayoutGetConstraint(view, TI_CONSTRAINT_STRING(constraint));
        if (existing != nil) {
            [existing setConstant:[constraint constant]];
        } else {
            NSLog(@"[DEBUG] Constraint Added   %@", constraint);
            [view addConstraint:constraint];
        }
    }
}

static void TiLayoutRemoveConstraint(UIView* view, NSArray* constraints)
{
    for (NSLayoutConstraint* constraint in constraints) {
        NSLayoutConstraint* existing = TiLayoutGetConstraint(view, TI_CONSTRAINT_STRING(constraint));
        if (existing != nil) {
            NSLog(@"[DEBUG] Constraint Removed %@", constraint);
            [view removeConstraint:existing];
        }
    }
    
}
#endif