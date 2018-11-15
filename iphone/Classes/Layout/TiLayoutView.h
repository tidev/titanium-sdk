/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef TI_USE_AUTOLAYOUT
#import "TiLayoutDimension.h"
#import <TitaniumKit/TiUtils.h>
#import <UIKit/UIKit.h>

#define TI_CONSTR(FORMAT, VIEWS) [NSLayoutConstraint constraintsWithVisualFormat:FORMAT options:NSLayoutFormatDirectionLeftToRight metrics:nil views:VIEWS]
#define TI_STRING(...) [NSString stringWithFormat:__VA_ARGS__]

@interface TiLayoutView : UIView <LayoutAutosizing>

// debug only, remove
#ifdef TI_UNIT_TESTS
@property (nonatomic, retain) id left;
@property (nonatomic, retain) id right;
@property (nonatomic, retain) id top;
@property (nonatomic, retain) id bottom;
@property (nonatomic, retain) id width;
@property (nonatomic, retain) id height;
@property (nonatomic, retain) id layout;
@property (nonatomic, retain) id center_;
#endif

@property (nonatomic) TiDimension defaultHeight;
@property (nonatomic) TiDimension defaultWidth;
//@property(nonatomic, retain) UIView* innerView;
@property (nonatomic, retain) NSString *viewName;
@property (nonatomic, copy) void (^onLayout)(TiLayoutView *sender, CGRect rect);
@property (nonatomic, copy) void (^onViewRemoved)(TiLayoutView *sender);
@property (nonatomic) BOOL horizontalWrap;
@property (nonatomic) BOOL loaded;
@property (nonatomic, readonly) BOOL isInToolbar;
@property (nonatomic, readonly) BOOL isToolbar;

- (instancetype)initWithProperties:(NSDictionary *)properties;

- (TiLayoutConstraint *)tiLayoutConstraint;

- (void)setLeft_:(id)args;
- (void)setRight_:(id)args;
- (void)setTop_:(id)args;
- (void)setBottom_:(id)args;
- (void)setWidth_:(id)args;
- (void)setHeight_:(id)args;
- (void)setLayout_:(id)args;
- (void)setCenter_:(id)args;

- (void)animateProperties:(NSDictionary *)properties withDuration:(NSUInteger)milli andCallback:(void (^)(BOOL finished))callback;

+ (void)removeConstraints:(UIView *)parent fromChild:(UIView *)child;
- (CGSize)sizeThatFits:(CGSize)size height:(id)height;
- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds;
- (void)initializeTiLayoutView;

- (CGFloat)heightIfWidthWere:(CGFloat)width;
@end
#endif
