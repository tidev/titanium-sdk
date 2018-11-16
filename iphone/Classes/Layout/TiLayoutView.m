/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef TI_USE_AUTOLAYOUT
#import "TiLayoutView.h"
#import <TitaniumKit/TiUtils.h>

#define SuppressPerformSelectorLeakWarning(Stuff)                           \
  do {                                                                      \
    _Pragma("clang diagnostic push")                                        \
        _Pragma("clang diagnostic ignored \"-Warc-performSelector-leaks\"") \
            Stuff;                                                          \
    _Pragma("clang diagnostic pop")                                         \
  } while (0)

#define IS_PERCENT TiDimensionIsPercent
#define IS_AUTO TiDimensionIsAuto
#define IS_AUTOSIZE TiDimensionIsAutoSize
#define IS_AUTOFILL TiDimensionIsAutoFill
#define IS_DIP TiDimensionIsDip
#define IS_UNDEFINED TiDimensionIsUndefined
#define TI_VIEWS(...) NSDictionaryOfVariableBindings(__VA_ARGS__)

#define ARGS_NOT_NULL (args != nil && ![args isKindOfClass:[NSNull class]])

static inline NSString *TI_CONSTRAINT_STRING(NSLayoutConstraint *constraint)
{
  return [NSString stringWithFormat:@"<%p-%p-%li-%li-%li>",
                   [constraint firstItem],
                   [constraint secondItem],
                   (long)[constraint firstAttribute],
                   (long)[constraint secondAttribute],
                   (long)[constraint relation]];
}

static void TiLayoutRemoveChildConstraints(UIView *superview, UIView *child);

static NSString *capitalizedFirstLetter(NSString *string)
{
  NSString *retVal = string;
  if (string.length <= 1) {
    retVal = [string capitalizedString];
  } else {
    retVal = TI_STRING(@"%@%@", [[string substringToIndex:1] uppercaseString], [string substringFromIndex:1]);
  }
  return retVal;
}

static NSString *TiLayoutStringFromAttribute(NSLayoutAttribute attr)
{
  switch (attr) {
  case NSLayoutAttributeNotAnAttribute:
    return @"not_an_attribute";
  case NSLayoutAttributeLeft:
    return @"left";
  case NSLayoutAttributeRight:
    return @"right";
  case NSLayoutAttributeTop:
    return @"top";
  case NSLayoutAttributeBottom:
    return @"bottom";
  case NSLayoutAttributeLeading:
    return @"leading";
  case NSLayoutAttributeTrailing:
    return @"trailing";
  case NSLayoutAttributeWidth:
    return @"width";
  case NSLayoutAttributeHeight:
    return @"height";
  case NSLayoutAttributeCenterX:
    return @"centerX";
  case NSLayoutAttributeCenterY:
    return @"centerY";
  case NSLayoutAttributeBaseline:
    return @"baseline";
  case NSLayoutAttributeFirstBaseline:
    return @"first_baseline";
  case NSLayoutAttributeLeftMargin:
    return @"left_margin";
  case NSLayoutAttributeRightMargin:
    return @"right_margin";
  case NSLayoutAttributeTopMargin:
    return @"top_margin";
  case NSLayoutAttributeBottomMargin:
    return @"bottom_margin";
  case NSLayoutAttributeLeadingMargin:
    return @"leading_margin";
  case NSLayoutAttributeTrailingMargin:
    return @"trailing_margin";
  case NSLayoutAttributeCenterXWithinMargins:
    return @"center_x_within_margins";
  case NSLayoutAttributeCenterYWithinMargins:
    return @"center_y_within_margins";
  }
  return @"";
}
static NSString *TiLayoutStringFromRelation(NSLayoutRelation relation)
{
  switch (relation) {
  case NSLayoutRelationLessThanOrEqual:
    return @"<=";
  case NSLayoutRelationEqual:
    return @"==";
  case NSLayoutRelationGreaterThanOrEqual:
    return @">=";
  }
  return @"";
}

@interface NSLayoutConstraint (TiLayoutCategory)

@end

@implementation NSLayoutConstraint (TiLayoutCategory)

- (NSString *)description
{

  TiLayoutView *first = [self firstItem];
  TiLayoutView *second = [self secondItem];
  NSString *firstView;
  NSString *secondView;

  if ([first respondsToSelector:@selector(viewName)]) {
    firstView = [[first viewName] length] ? [first viewName] : [[first class] description];
  } else {
    firstView = TI_STRING(@"%@", [first class]);
  }

  if ([second respondsToSelector:@selector(viewName)]) {
    secondView = [[second viewName] length] ? [second viewName] : [[second class] description];
  } else {
    secondView = TI_STRING(@"%@", [second class]);
  }

  if ([self secondAttribute] == NSLayoutAttributeNotAnAttribute) {

    return TI_STRING(@"<(%@).%@ %@ %i (%@*%@)>",
        firstView,
        TiLayoutStringFromAttribute([self firstAttribute]),
        TiLayoutStringFromRelation([self relation]),
        (int)([self multiplier] * [self constant]),
        TI_STRING(@"%i", (int)[self multiplier]),
        TI_STRING(@"%i", (int)[self constant]));
  }

  return TI_STRING(@"<(%@).%@ %@ (%@).%@ %i (%@*%@)>",
      firstView,
      TiLayoutStringFromAttribute([self firstAttribute]),
      TiLayoutStringFromRelation([self relation]),
      secondView,
      TiLayoutStringFromAttribute([self secondAttribute]),
      (int)([self multiplier] * [self constant]),
      TI_STRING(@"%i", (int)[self multiplier]),
      TI_STRING(@"%i", (int)[self constant]));
}

@end

@interface TiLayoutView () {
  TiLayoutConstraint _tiLayoutConstraint;
  NSMutableDictionary *_constraintsAdded;
  BOOL _needsToRemoveConstrains;
  CGRect _oldRect;

  BOOL _isLeftPercentage;
  BOOL _isBottomPercentage;
  BOOL _isTopPercentage;
  BOOL _isRightPercentage;

  CGFloat _leftPercentage;
  CGFloat _rightPercentage;
  CGFloat _topPercentage;
  CGFloat _bottomPercentage;

  TiDimension _defaultWidth;
  TiDimension _defaultHeight;

  BOOL _initialized;
}
@end

@implementation TiLayoutView

DEFINE_EXCEPTIONS

- (void)dealloc
{
  [self.layer removeObserver:self forKeyPath:@"position"];
  [self.layer removeObserver:self forKeyPath:@"bounds"];
}

- (void)initializeTiLayoutView
{
  if (_initialized)
    return;
  _initialized = YES;
  [self setViewName_:NSStringFromClass([self class])];
  [self setClipsToBounds:YES];
  [self setTranslatesAutoresizingMaskIntoConstraints:NO];
  [self setAutoresizingMask:UIViewAutoresizingNone];
  [self setHorizontalWrap:YES];
  [self setDefaultHeight:TiDimensionAutoSize];
  [self setDefaultWidth:TiDimensionAutoSize];
  [self.layer addObserver:self forKeyPath:@"position" options:0 context:NULL];
  [self.layer addObserver:self forKeyPath:@"bounds" options:0 context:NULL];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  // make it async, so that layout finishes before this is called
  dispatch_async(dispatch_get_main_queue(), ^{
    CGRect newRect = self.frame;
    if (_isInToolbar && !self.translatesAutoresizingMaskIntoConstraints) {
      [self setNeedsLayout];
      [self layoutIfNeeded];
      [self setTranslatesAutoresizingMaskIntoConstraints:YES];
      [[self superview] setNeedsLayout];
      [[self superview] layoutIfNeeded];
      _oldRect = newRect;
      return;
    }
    if (_isToolbar) {
      [super setNeedsLayout];
      [super layoutIfNeeded];
    }
    if (!CGRectEqualToRect(newRect, _oldRect)) {
      if ([self onLayout] != nil) {
        self.onLayout(self, newRect);
      }
      [self frameSizeChanged:[self frame] bounds:[self bounds]];
    }
    _oldRect = self.frame;
  });
}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds;
{
  // for subclass
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    [self initializeTiLayoutView];
  }
  return self;
}

- (void)setLoaded:(BOOL)loaded
{
  _loaded = loaded;
}

// disable initWithFrame
- (instancetype)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:CGRectZero];
  if (self) {
    [self initializeTiLayoutView];
  }
  return self;
}

- (void)setFrame:(CGRect)frame
{
  [super setFrame:frame];
}

- (void)setBounds:(CGRect)bounds
{
  [super setBounds:bounds];
}
- (instancetype)initWithProperties:(NSDictionary *)properties
{
  if (self = [self init]) {
    for (NSString *key in properties) {
      NSString *newKey = TI_STRING(@"set%@_:", capitalizedFirstLetter(key));
      SEL selector = NSSelectorFromString(newKey);
      if ([self respondsToSelector:selector]) {
        SuppressPerformSelectorLeakWarning([self performSelector:selector withObject:[properties objectForKey:key]]);
      }
    }
  }
  return self;
}

+ (void)removeConstraints:(UIView *)parent fromChild:(UIView *)child
{
  TiLayoutRemoveChildConstraints(parent, child);
}

- (TiLayoutConstraint *)tiLayoutConstraint;
{
  return &_tiLayoutConstraint;
}

#ifdef TI_UNIT_TESTS
- (void)setLeft:(id)arg
{
  [self setLeft_:arg];
}
- (void)setRight:(id)arg
{
  [self setRight_:arg];
}
- (void)setTop:(id)arg
{
  [self setTop_:arg];
}
- (void)setBottom:(id)arg
{
  [self setBottom_:arg];
}
- (void)setWidth:(id)arg
{
  [self setWidth_:arg];
}
- (void)setHeight:(id)arg
{
  [self setHeight_:arg];
}
- (void)setLayout:(id)arg
{
  _layout = arg;
  [self setLayout_:arg];
}
#endif

- (void)setViewName_:(NSString *)viewName
{
  [self setViewName:viewName];
}
- (void)setDefaultHeight:(TiDimension)defaultHeight
{
  _defaultHeight = defaultHeight;
  [self setNeedsUpdateConstraints];
}
- (void)setDefaultWidth:(TiDimension)defaultWidth
{
  _defaultWidth = defaultWidth;
  [self setNeedsUpdateConstraints];
}
- (void)setLeft_:(id)args
{
  _tiLayoutConstraint.left = TiDimensionFromObject(args);
  _tiLayoutConstraint.left_isSet = ARGS_NOT_NULL;
  _isLeftPercentage = IS_PERCENT(_tiLayoutConstraint.left);
  if (_isLeftPercentage && _leftPercentage != _tiLayoutConstraint.left.value) {
    _leftPercentage = _tiLayoutConstraint.left.value;
  }
  [self updateMargins];
}
- (void)setRight_:(id)args
{
  _tiLayoutConstraint.right = TiDimensionFromObject(args);
  _tiLayoutConstraint.right_isSet = ARGS_NOT_NULL;
  _isRightPercentage = IS_PERCENT(_tiLayoutConstraint.right);
  if (_isRightPercentage && _rightPercentage != _tiLayoutConstraint.right.value) {
    _rightPercentage = _tiLayoutConstraint.right.value;
  }
  [self updateMargins];
}
- (void)setTop_:(id)args
{
  _tiLayoutConstraint.top = TiDimensionFromObject(args);
  _tiLayoutConstraint.top_isSet = ARGS_NOT_NULL;
  _isTopPercentage = IS_PERCENT(_tiLayoutConstraint.top);
  if (_isTopPercentage && _topPercentage != _tiLayoutConstraint.top.value) {
    _topPercentage = _tiLayoutConstraint.top.value;
  }
  [self updateMargins];
}
- (void)setBottom_:(id)args
{
  _tiLayoutConstraint.bottom = TiDimensionFromObject(args);
  _tiLayoutConstraint.bottom_isSet = ARGS_NOT_NULL;
  _isBottomPercentage = IS_PERCENT(_tiLayoutConstraint.bottom);
  if (_isBottomPercentage && _bottomPercentage != _tiLayoutConstraint.bottom.value) {
    _bottomPercentage = _tiLayoutConstraint.bottom.value;
  }
  [self updateMargins];
}
- (void)setWidth_:(id)args
{
  if ([args isEqual:@"auto"]) {
    NSLog(@"[WARN] \"auto\" is deprecated and will be removed in the next release");
    _tiLayoutConstraint.width = [self defaultWidth];
  } else {
    _tiLayoutConstraint.width = TiDimensionFromObject(args);
  }
  _tiLayoutConstraint.width_isSet = ARGS_NOT_NULL;
  [self updateWidthAndHeight];
  [self updateMargins];
  [self setNeedsLayout];
  [self layoutIfNeeded];
}
- (void)setHeight_:(id)args
{
  if ([args isEqual:@"auto"]) {
    NSLog(@"[WARN] \"auto\" is deprecated and will be removed in the next release");
    _tiLayoutConstraint.height = [self defaultHeight];
  } else {
    _tiLayoutConstraint.height = TiDimensionFromObject(args);
  }
  _tiLayoutConstraint.height_isSet = ARGS_NOT_NULL;
  [self updateWidthAndHeight];
  [self updateMargins];
  [self setNeedsLayout];
  [self layoutIfNeeded];
}
- (void)setCenter_:(id)args
{
  ENSURE_SINGLE_ARG(args, NSDictionary)
  _tiLayoutConstraint.centerX = TiDimensionFromObject([args valueForKey:@"x"]);
  _tiLayoutConstraint.centerY = TiDimensionFromObject([args valueForKey:@"y"]);
  _tiLayoutConstraint.centerX_isSet = !IS_UNDEFINED(_tiLayoutConstraint.centerX);
  _tiLayoutConstraint.centerY_isSet = !IS_UNDEFINED(_tiLayoutConstraint.centerY);
  [self updateMargins];
}
- (void)setLayout_:(id)args
{
  TiLayoutRule rule = TiLayoutRuleFromObject(args);
  if (rule != _tiLayoutConstraint.layoutStyle) {
    _needsToRemoveConstrains = YES;
    _tiLayoutConstraint.layoutStyle = rule;
    [self updateWidthAndHeight];
    [self layoutChildren];
    [self layoutIfNeeded];
  }
}

- (void)animateProperties:(NSDictionary *)properties withDuration:(NSUInteger)milli andCallback:(void (^)(BOOL finished))callback
{
  [UIView animateWithDuration:(milli / 1000.0)
                   animations:^{
                     for (NSString *key in properties) {
                       NSString *newKey = TI_STRING(@"set%@_:", capitalizedFirstLetter(key));
                       SEL selector = NSSelectorFromString(newKey);
                       if ([self respondsToSelector:selector]) {
                         SuppressPerformSelectorLeakWarning([self performSelector:selector withObject:[properties objectForKey:key]]);
                       }
                     }
                   }
                   completion:callback];
}

- (CGFloat)heightIfWidthWere:(CGFloat)width
{
  if (_tiLayoutConstraint.height_isSet && IS_DIP(_tiLayoutConstraint.height)) {
    return TiDimensionCalculateValue(_tiLayoutConstraint.height, 1);
  }
  UIView *parent = [self superview];
  if (parent != nil) {
    [self removeFromSuperview];
  }
  UIView *dummyView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, width, 0)];
  [dummyView setAutoresizingMask:UIViewAutoresizingFlexibleHeight];
  [dummyView addSubview:self];

  [[[[[UIApplication sharedApplication] keyWindow] rootViewController] view] addSubview:dummyView];

  [self updateWidthAndHeight];
  [self layoutChildren];

  [dummyView layoutIfNeeded];

  CGSize size = [dummyView systemLayoutSizeFittingSize:UILayoutFittingCompressedSize];
  [dummyView removeFromSuperview];
  dummyView = nil;

  [self removeFromSuperview];

  _loaded = NO;
  if (parent != nil) {
    [parent addSubview:self];
    TiLayoutView *viewToUpdate = nil;
    if ([parent isKindOfClass:[TiLayoutView class]]) {
      viewToUpdate = (TiLayoutView *)parent;
    } else {
      viewToUpdate = self;
    }
    [viewToUpdate updateWidthAndHeight];
    [viewToUpdate layoutChildren];
  }
  return size.height;
}

- (void)removeFromSuperview
{
  [super removeFromSuperview];
  if ([self onViewRemoved] != nil) {
    self.onViewRemoved(self);
  }
}

- (void)addSubview:(nonnull UIView *)view
{
  _needsToRemoveConstrains = YES;
  [super addSubview:view];
  [self layoutChildren];
}
- (void)insertSubview:(UIView *)view belowSubview:(UIView *)siblingSubview
{
  _needsToRemoveConstrains = YES;
  [super insertSubview:view belowSubview:siblingSubview];
  [self layoutChildren];
}
- (void)insertSubview:(UIView *)view aboveSubview:(nonnull UIView *)siblingSubview
{
  _needsToRemoveConstrains = YES;
  [super insertSubview:view aboveSubview:siblingSubview];
  [self layoutChildren];
}
- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index
{
  _needsToRemoveConstrains = YES;
  [super insertSubview:view atIndex:index];
  [self layoutChildren];
}
- (void)layoutChildren
{
  if (!_loaded)
    return;

  BOOL isVertical = TiLayoutRuleIsVertical(_tiLayoutConstraint.layoutStyle);
  BOOL isHorizontal = TiLayoutRuleIsHorizontal(_tiLayoutConstraint.layoutStyle);

  NSArray *subviews = [self subviews];

  TiLayoutView *previous = nil;
  TiLayoutView *next = nil;

  for (NSUInteger index = 0, length = [subviews count]; index < length; index++) {
    TiLayoutView *child = [subviews objectAtIndex:index];
    if (![child isKindOfClass:[TiLayoutView class]]) {
      continue;
    };

    if ((isVertical || isHorizontal) && _needsToRemoveConstrains) {
      TiLayoutRemoveChildConstraints(self, child);
      // LOOK HERE and maybe remove
      [child updateWidthAndHeight];
    }

    if (index > 0) {
      NSUInteger i = index;
      TiLayoutView *prev = [subviews objectAtIndex:i - 1];
      while (![prev isKindOfClass:[TiLayoutView class]] && i != 0) {
        prev = [subviews objectAtIndex:i--];
      }
      previous = prev;
    }
    next = nil;
    if (length > index + 1) {
      NSUInteger i = index;
      TiLayoutView *nex = [subviews objectAtIndex:i + 1];
      while (![nex isKindOfClass:[TiLayoutView class]] && i != length) {
        nex = [subviews objectAtIndex:i++];
      }
      next = nex;
    }

    [self updateMarginsPrevious:previous current:child next:next];
  }
  _needsToRemoveConstrains = NO;
}

- (void)didMoveToSuperview
{
  if ([[self viewName] isEqualToString:@"this_view"]) {
    NSLog(@"break here");
  }

  UIView *superview = [self superview];
  if (superview != nil && !_loaded) {
    if ([superview isKindOfClass:[UIToolbar class]] || [superview isKindOfClass:[UINavigationBar class]]) {
      _isInToolbar = YES;
    }
    if ([[self subviews] count] && [[[self subviews] objectAtIndex:0] isKindOfClass:[UIToolbar class]]) {
      _isToolbar = YES;
    }
    for (UIView *v in [self subviews]) {
      if (![v isKindOfClass:[TiLayoutView class]]) {
        [v setTranslatesAutoresizingMaskIntoConstraints:NO];
        [v setAutoresizingMask:UIViewAutoresizingNone];
        [self addConstraints:TI_CONSTR(@"V:|[v]|", TI_VIEWS(v))];
        [self addConstraints:TI_CONSTR(@"H:|[v]|", TI_VIEWS(v))];
        break;
      }
    }

    _loaded = YES;
    [self updateWidthAndHeight];
    [self layoutChildren];
  }

  [super didMoveToSuperview];
}

- (void)addConstraints:(nonnull NSArray *)constraints
{
  for (NSLayoutConstraint *c in constraints) {
    [self addConstraint:c];
  }
}

- (void)removeConstraints:(nonnull NSArray *)constraints
{
  for (NSLayoutConstraint *c in constraints) {
    [self removeConstraint:c];
  }
}

- (void)removeAndReplaceConstraint:(nonnull NSLayoutConstraint *)constraint
{
  [self removeConstraint:constraint];
  [self addConstraint:constraint];
}
- (void)removeAndReplaceConstraints:(NSArray *)constraints
{
  for (NSLayoutConstraint *c in constraints) {
    [self removeAndReplaceConstraint:c];
  }
}

- (void)addConstraint:(nonnull NSLayoutConstraint *)constraint
{
  if (!_constraintsAdded)
    _constraintsAdded = [NSMutableDictionary dictionary];
  NSString *description = TI_CONSTRAINT_STRING(constraint);

  NSLayoutConstraint *currentConstraint = [_constraintsAdded valueForKey:description];
  if (currentConstraint) {
    if ([constraint constant] != [currentConstraint constant]) {
      [currentConstraint setConstant:[constraint constant]];
    }
  } else {
    [_constraintsAdded setObject:constraint forKey:description];
    [super addConstraint:constraint];
  }
}

- (void)removeConstraint:(nonnull NSLayoutConstraint *)constraint
{
  if (!_constraintsAdded)
    _constraintsAdded = [NSMutableDictionary dictionary];
  NSString *description = TI_CONSTRAINT_STRING(constraint);
  NSLayoutConstraint *currentConstraint = [_constraintsAdded valueForKey:description];
  if (currentConstraint != nil) {
    [super removeConstraint:currentConstraint];
    [_constraintsAdded removeObjectForKey:description];
  }
}

- (void)updateWidthAndHeight
{
  if (!_loaded)
    return;

  UIView *superview = [self superview];
  if (superview == nil)
    return;

  TiDimension width = _tiLayoutConstraint.width;
  TiDimension height = _tiLayoutConstraint.height;
  TiDimension left = _tiLayoutConstraint.left;
  TiDimension right = _tiLayoutConstraint.right;
  TiDimension top = _tiLayoutConstraint.top;
  TiDimension bottom = _tiLayoutConstraint.bottom;

  BOOL widthSet = _tiLayoutConstraint.width_isSet;
  BOOL heightSet = _tiLayoutConstraint.height_isSet;
  BOOL leftSet = _tiLayoutConstraint.left_isSet;
  BOOL rightSet = _tiLayoutConstraint.right_isSet;
  BOOL topSet = _tiLayoutConstraint.top_isSet;
  BOOL bottomSet = _tiLayoutConstraint.bottom_isSet;

  NSDictionary *viewsDict = TI_VIEWS(self, superview);

  if (![superview isKindOfClass:[TiLayoutView class]] && ![self isInToolbar]) {

    if ([self isKindOfClass:NSClassFromString(@"TiTableViewRow")]) {
      NSLog(@"break here");
    }
    if ([superview isKindOfClass:[UITableView class]]) {
      return;
    } else if ([superview isKindOfClass:[UIScrollView class]]) {
      TiLayoutRemoveChildConstraints(superview, self);
      [superview addConstraints:TI_CONSTR(@"V:|[self]|", viewsDict)];
      [superview addConstraints:TI_CONSTR(@"H:|[self]|", viewsDict)];
      if (IS_AUTOFILL(height)) {
        [superview addConstraints:TI_CONSTR(@"V:[self(superview)]", viewsDict)];
      } else if (IS_DIP(height)) {
        [superview addConstraints:TI_CONSTR(TI_STRING(@"V:[self(%f)]", TiDimensionCalculateValue(height, 1)), viewsDict)];
      } else {
        [superview addConstraints:TI_CONSTR(@"V:[self(>=superview)]", viewsDict)];
      }

      if (IS_AUTOFILL(width)) {
        [superview addConstraints:TI_CONSTR(@"H:[self(superview)]", viewsDict)];
      } else if (IS_DIP(width)) {
        [superview addConstraints:TI_CONSTR(TI_STRING(@"H:[self(%f)]", TiDimensionCalculateValue(width, 1)), viewsDict)];
      } else {
        [superview addConstraints:TI_CONSTR(@"H:[self(>=superview)]", viewsDict)];
      }
      return;
    }
    [superview addConstraints:TI_CONSTR(@"V:[self(superview)]", viewsDict)];
    [superview addConstraints:TI_CONSTR(@"H:[self(superview)]", viewsDict)];
    [superview addConstraints:TI_CONSTR(@"V:|[self]|", viewsDict)];
    [superview addConstraints:TI_CONSTR(@"H:|[self]|", viewsDict)];
    return;
  }

  if (![self isInToolbar]) {
    if (widthSet) {
      [self removeConstraints:TI_CONSTR(@"H:[self(0)]", viewsDict)];
      [superview removeConstraint:[NSLayoutConstraint constraintWithItem:self
                                                               attribute:NSLayoutAttributeWidth
                                                               relatedBy:NSLayoutRelationEqual
                                                                  toItem:superview
                                                               attribute:NSLayoutAttributeWidth
                                                              multiplier:1
                                                                constant:1]];
    }
    if (heightSet) {
      [self removeConstraints:TI_CONSTR(@"V:[self(0)]", viewsDict)];
      [superview removeConstraint:[NSLayoutConstraint constraintWithItem:self
                                                               attribute:NSLayoutAttributeHeight
                                                               relatedBy:NSLayoutRelationEqual
                                                                  toItem:superview
                                                               attribute:NSLayoutAttributeHeight
                                                              multiplier:1
                                                                constant:1]];
    }

    // ========= percentage % ============
    if (IS_PERCENT(width)) {
      [superview addConstraint:[NSLayoutConstraint constraintWithItem:self
                                                            attribute:NSLayoutAttributeWidth
                                                            relatedBy:NSLayoutRelationEqual
                                                               toItem:superview
                                                            attribute:NSLayoutAttributeWidth
                                                           multiplier:width.value
                                                             constant:1]];
    }
    if (IS_PERCENT(height)) {
      [superview addConstraint:[NSLayoutConstraint constraintWithItem:self
                                                            attribute:NSLayoutAttributeHeight
                                                            relatedBy:NSLayoutRelationEqual
                                                               toItem:superview
                                                            attribute:NSLayoutAttributeHeight
                                                           multiplier:height.value
                                                             constant:1]];
    }

    if (leftSet && IS_UNDEFINED(left)) {
      [superview removeConstraints:TI_CONSTR(@"H:|-(0)-[self]", viewsDict)];
    }
    if (rightSet && IS_UNDEFINED(right)) {
      [superview removeConstraints:TI_CONSTR(@"H:[self]-(0)-|", viewsDict)];
    }
    if (topSet && IS_UNDEFINED(top)) {
      [superview removeConstraints:TI_CONSTR(@"V:|-(0)-[self]", viewsDict)];
    }
    if (bottomSet && IS_UNDEFINED(bottom)) {
      [superview removeConstraints:TI_CONSTR(@"V:[self]-(0)-|", viewsDict)];
    }
  }
  if (IS_DIP(width)) {
    CGFloat value = TiDimensionCalculateValue(width, 1);
    [self addConstraints:TI_CONSTR(TI_STRING(@"H:[self(%f@750)]", value), viewsDict)];
  }

  if (IS_DIP(height)) {
    CGFloat value = TiDimensionCalculateValue(height, 1);
    [self addConstraints:TI_CONSTR(TI_STRING(@"V:[self(%f@750)]", value), viewsDict)];
  }

  if (![self isInToolbar]) {
    if (IS_AUTOFILL(height) || (IS_UNDEFINED(height) && IS_AUTOFILL(_defaultHeight))) {
      [superview addConstraints:TI_CONSTR(TI_STRING(@"V:[self(superview@500)]"), viewsDict)];
    }

    if (IS_AUTOFILL(width) || (IS_UNDEFINED(width) && IS_AUTOFILL(_defaultWidth))) {
      [superview addConstraints:TI_CONSTR(TI_STRING(@"H:[self(superview@500)]"), viewsDict)];
    }

    if (IS_AUTOSIZE(width) || (IS_UNDEFINED(width) && IS_AUTOSIZE(_defaultWidth))) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"H:[self(0@20)]"), viewsDict)]; // should try to be 0 width with a very low priority
      [superview addConstraints:TI_CONSTR(TI_STRING(@"H:[self(<=superview)]"), viewsDict)];
    }
    if (IS_AUTOSIZE(height) || (IS_UNDEFINED(height) && IS_AUTOSIZE(_defaultHeight))) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"V:[self(0@20)]"), viewsDict)]; // should try to be 0 height with a very low priority
      [superview addConstraints:TI_CONSTR(TI_STRING(@"V:[self(<=superview)]"), viewsDict)];
    }
  }
}

- (void)updateMarginsForAbsoluteLayout:(TiLayoutView *)child
{
  NSDictionary *viewsDict = TI_VIEWS(child);
  TiLayoutConstraint *childConstraints = [child tiLayoutConstraint];
  TiDimension left = childConstraints->left;
  TiDimension right = childConstraints->right;
  TiDimension top = childConstraints->top;
  TiDimension bottom = childConstraints->bottom;
  TiDimension centerX = childConstraints->centerX;
  TiDimension centerY = childConstraints->centerY;

  TiDimension width = childConstraints->width;
  TiDimension height = childConstraints->height;

  BOOL leftSet = childConstraints->left_isSet;
  BOOL rightSet = childConstraints->right_isSet;
  BOOL topSet = childConstraints->top_isSet;
  BOOL bottomSet = childConstraints->bottom_isSet;

  // ========= Ti.UI.FILL ============
  if (IS_AUTOFILL(width) || (IS_UNDEFINED(width) && IS_AUTOFILL(child->_defaultWidth))) {
    if (IS_UNDEFINED(left))
      left = TiDimensionFromObject(@0);
    if (IS_UNDEFINED(right))
      right = TiDimensionFromObject(@0);
  }

  if (IS_AUTOFILL(height) || (IS_UNDEFINED(height) && IS_AUTOFILL(child->_defaultHeight))) {
    if (IS_UNDEFINED(top))
      top = TiDimensionFromObject(@0);
    if (IS_UNDEFINED(bottom))
      bottom = TiDimensionFromObject(@0);
  }

  CGFloat leftValue = TiDimensionCalculateValue(left, 1);
  CGFloat rightValue = TiDimensionCalculateValue(right, 1);
  CGFloat topValue = TiDimensionCalculateValue(top, 1);
  CGFloat bottomValue = TiDimensionCalculateValue(bottom, 1);

  // ========= TI.UI.SIZE ============
  if (IS_AUTOSIZE(_tiLayoutConstraint.width) || (IS_UNDEFINED(_tiLayoutConstraint.width) && IS_AUTOSIZE(_defaultWidth))) {
    [self addConstraints:TI_CONSTR(TI_STRING(@"H:|-(>=%f)-[child]-(>=%f)-|", leftValue, rightValue), viewsDict)];
  } else if (_tiLayoutConstraint.width_isSet) {
    [self removeConstraints:TI_CONSTR(TI_STRING(@"H:|-(>=%f)-[child]-(>=%f)-|", leftValue, rightValue), viewsDict)];
  }
  if (IS_AUTOSIZE(_tiLayoutConstraint.height) || (IS_UNDEFINED(_tiLayoutConstraint.height) && IS_AUTOSIZE(_defaultHeight))) {
    [self addConstraints:TI_CONSTR(TI_STRING(@"V:|-(>=%f)-[child]-(>=%f)-|", topValue, bottomValue), viewsDict)];
  } else if (_tiLayoutConstraint.height_isSet) {
    [self removeConstraints:TI_CONSTR(TI_STRING(@"V:|-(>=%f)-[child]-(>=%f)-|", topValue, bottomValue), viewsDict)];
  }

  // ========= left & right ============
  if (IS_UNDEFINED(left) && IS_UNDEFINED(right)) {
    if (rightSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"H:[child]-(%f)-|", rightValue), viewsDict)];
    }
    if (leftSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"H:|-(%f)-[child]", leftValue), viewsDict)];
    }
    if (IS_UNDEFINED(centerX)) {
      [self removeConstraint:[NSLayoutConstraint constraintWithItem:child attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeLeft multiplier:1 constant:0]];
      [self addConstraint:[NSLayoutConstraint constraintWithItem:self attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:child attribute:NSLayoutAttributeCenterX multiplier:1 constant:0]];
    } else {
      CGFloat centerXValue = TiDimensionCalculateValue(centerX, 1);
      [self removeConstraint:[NSLayoutConstraint constraintWithItem:self attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:child attribute:NSLayoutAttributeCenterX multiplier:1 constant:0]];
      [self addConstraint:[NSLayoutConstraint constraintWithItem:child attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeLeft multiplier:1 constant:centerXValue]];
    }
  } else {
    [self removeConstraint:[NSLayoutConstraint constraintWithItem:self attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:child attribute:NSLayoutAttributeCenterX multiplier:1 constant:0]];
    [self removeConstraint:[NSLayoutConstraint constraintWithItem:child attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeLeft multiplier:1 constant:0]];

    if (IS_DIP(left)) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"H:|-(%f)-[child]", leftValue), viewsDict)];
    } else if (leftSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"H:|-(%f)-[child]", leftValue), viewsDict)];
    }

    if (IS_DIP(right) && (IS_UNDEFINED(left) || IS_AUTOFILL(width) || IS_AUTOSIZE(width) || IS_UNDEFINED(width))) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"H:[child]-(%f)-|", rightValue), viewsDict)];
    } else if (rightSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"H:[child]-(%f)-|", rightValue), viewsDict)];
    }
  }

  if (IS_UNDEFINED(top) && IS_UNDEFINED(bottom)) {
    if (topSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"V:|-(%f)-[child]", topValue), viewsDict)];
    }
    if (bottomSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"V:[child]-(%f)-|", bottomValue), viewsDict)];
    }
    if (IS_UNDEFINED(centerY)) {
      [self removeConstraint:[NSLayoutConstraint constraintWithItem:child attribute:NSLayoutAttributeCenterY relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeTop multiplier:1 constant:0]];
      [self addConstraint:[NSLayoutConstraint constraintWithItem:child attribute:NSLayoutAttributeCenterY relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeCenterY multiplier:1 constant:0]];
    } else {
      CGFloat centerYValue = TiDimensionCalculateValue(centerY, 1);
      [self removeConstraint:[NSLayoutConstraint constraintWithItem:child attribute:NSLayoutAttributeCenterY relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeCenterY multiplier:1 constant:0]];
      [self addConstraint:[NSLayoutConstraint constraintWithItem:child attribute:NSLayoutAttributeCenterY relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeTop multiplier:1 constant:centerYValue]];
    }
  } else {
    [self removeConstraint:[NSLayoutConstraint constraintWithItem:child attribute:NSLayoutAttributeCenterY relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeCenterY multiplier:1 constant:0]];
    [self removeConstraint:[NSLayoutConstraint constraintWithItem:child attribute:NSLayoutAttributeCenterY relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeTop multiplier:1 constant:0]];

    if (IS_DIP(top)) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"V:|-(%f)-[child]", topValue), viewsDict)];
    } else if (topSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"V:|-(%f)-[child]", topValue), viewsDict)];
    }
    if (IS_DIP(bottom) && (IS_UNDEFINED(top) || IS_AUTOFILL(height) || IS_AUTOSIZE(height) || IS_UNDEFINED(height))) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"V:[child]-(%f)-|", bottomValue), viewsDict)];
    } else if (bottomSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"V:[child]-(%f)-|", bottomValue), viewsDict)];
    }
  }
}

- (CGSize)sizeThatFits:(CGSize)size
{
  if ([[self superview] isKindOfClass:[UINavigationBar class]]) {
    return [super sizeThatFits:size];
  }
  return [self sizeThatFits:size height:@"SIZE"];
}

- (CGSize)sizeThatFits:(CGSize)size height:(id)height
{
  if (height == nil)
    height = @"SIZE";
  UIView *parent = [self superview];
  if (CGSizeEqualToSize(size, CGSizeZero))
    return size;
  if (parent != nil) {
    [self removeFromSuperview];
  }

  TiLayoutView *parentView = [[TiLayoutView alloc] init];
  [parentView setHeight_:height];
  [parentView addSubview:self];

  UIView *dummyView = [[UIView alloc] init];
  [dummyView addSubview:parentView];
  [dummyView setBounds:CGRectMake(0, 0, size.width, size.height)];
  [dummyView setNeedsLayout];
  [dummyView layoutIfNeeded];

  CGSize newSize = [dummyView systemLayoutSizeFittingSize:UILayoutFittingCompressedSize];
  [self removeFromSuperview];
  [self setLoaded:NO];
  if (parent != nil) {
    [parent addSubview:self];
  }
  return newSize;
}

- (void)updateMarginsForVerticalLayout:(TiLayoutView *)prev current:(TiLayoutView *)child next:(TiLayoutView *)next
{
  NSDictionary *viewsDict = TI_VIEWS(child);

  TiLayoutConstraint *childConstraints = [child tiLayoutConstraint];

  TiDimension left = childConstraints->left;
  TiDimension right = childConstraints->right;
  TiDimension top = childConstraints->top;
  TiDimension bottom = childConstraints->bottom;

  TiDimension width = childConstraints->width;
  TiDimension height = childConstraints->height;

  BOOL leftSet = childConstraints->left_isSet;
  BOOL rightSet = childConstraints->right_isSet;

  // ========= Ti.UI.FILL ============
  if (IS_AUTOFILL(width) || (IS_UNDEFINED(width) && IS_AUTOFILL(child->_defaultWidth))) {
    if (IS_UNDEFINED(left))
      left = TiDimensionFromObject(@0);
    if (IS_UNDEFINED(right))
      right = TiDimensionFromObject(@0);
  }

  CGFloat leftValue = TiDimensionCalculateValue(left, 1);
  CGFloat rightValue = TiDimensionCalculateValue(right, 1);
  CGFloat topValue = TiDimensionCalculateValue(top, 1);
  CGFloat bottomValue = TiDimensionCalculateValue(bottom, 1);

  // ========= TI.UI.SIZE ============
  if (IS_AUTOSIZE(_tiLayoutConstraint.width)) {
    [self addConstraints:TI_CONSTR(TI_STRING(@"H:|-(>=0)-[child]-(>=0)-|"), viewsDict)];
  } else if (_tiLayoutConstraint.width_isSet) {
    [self removeConstraints:TI_CONSTR(TI_STRING(@"H:|-(>=0)-[child]-(>=0)-|"), viewsDict)];
  }
  if (IS_AUTOSIZE(_tiLayoutConstraint.height)) {
    [self addConstraints:TI_CONSTR(TI_STRING(@"V:|-(>=0)-[child]-(>=0)-|"), viewsDict)];
  } else if (_tiLayoutConstraint.height_isSet) {
    [self removeConstraints:TI_CONSTR(TI_STRING(@"V:|-(>=0)-[child]-(>=0)-|"), viewsDict)];
  }

  // ========= left & right ============
  if (IS_UNDEFINED(left) && IS_UNDEFINED(right)) {
    [self addConstraint:[NSLayoutConstraint constraintWithItem:self attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:child attribute:NSLayoutAttributeCenterX multiplier:1 constant:0]];
  } else {
    [self removeConstraint:[NSLayoutConstraint constraintWithItem:self attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:child attribute:NSLayoutAttributeCenterX multiplier:1 constant:0]];

    if (IS_DIP(left)) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"H:|-(%f)-[child]", leftValue), viewsDict)];
    } else if (leftSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"H:|-(%f)-[child]", leftValue), viewsDict)];
    }

    if (IS_DIP(right) && (IS_UNDEFINED(left) || IS_AUTOFILL(width) || IS_UNDEFINED(width))) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"H:[child]-(%f)-|", rightValue), viewsDict)];
    } else if (rightSet) {
      [self removeConstraints:TI_CONSTR(TI_STRING(@"H:[child]-(%f)-|", rightValue), viewsDict)];
    }
  }

  if (prev == nil) // first one
  {
    [self addConstraints:TI_CONSTR(TI_STRING(@"V:|-(%f)-[child]", topValue), viewsDict)];
  } else {
    NSDictionary *viewsDict2 = TI_VIEWS(prev, child);
    [self removeConstraints:TI_CONSTR(@"V:|-0-[child]", viewsDict)];

    TiLayoutConstraint *previousConstraints = [prev tiLayoutConstraint];
    TiDimension prevBottom = previousConstraints->bottom;

    CGFloat prevBottomValue = TiDimensionCalculateValue(prevBottom, 1);
    [self addConstraints:TI_CONSTR(TI_STRING(@"V:[prev]-(%f)-[child]", (topValue + prevBottomValue)), viewsDict2)];
  }
  if (next == nil && (IS_AUTOFILL(height) || (IS_UNDEFINED(height) && IS_AUTOFILL(child->_defaultHeight)))) // last one
  {
    [self addConstraints:TI_CONSTR(TI_STRING(@"V:[child]-(%f)-|", (bottomValue)), viewsDict)];
  } else {
    [self removeConstraints:TI_CONSTR(@"V:[child]-(0)-|", viewsDict)];
  }
}

- (void)updateMarginsForHorizontalLayout:(TiLayoutView *)prev current:(TiLayoutView *)child next:(TiLayoutView *)next
{
  TiLayoutConstraint *childConstraints = [child tiLayoutConstraint];
  TiDimension left = childConstraints->left;
  TiDimension right = childConstraints->right;
  TiDimension top = childConstraints->top;
  TiDimension bottom = childConstraints->bottom;

  CGFloat leftValue = TiDimensionCalculateValue(left, 1);
  CGFloat rightValue = TiDimensionCalculateValue(right, 1);
  CGFloat topValue = TiDimensionCalculateValue(top, 1);
  CGFloat bottomValue = TiDimensionCalculateValue(bottom, 1);

  if (prev == nil) // first
  {
    [self addConstraints:TI_CONSTR(TI_STRING(@"H:|-(>=%f)-[child]", leftValue), TI_VIEWS(child))];
  } else {
    TiLayoutConstraint *previousConstraints = [prev tiLayoutConstraint];
    TiDimension prevRight = previousConstraints->right;

    CGFloat prevRightValue = TiDimensionCalculateValue(prevRight, 1);
    [self addConstraints:TI_CONSTR(TI_STRING(@"H:[prev]-(%f)-[child]", (leftValue + prevRightValue)), TI_VIEWS(prev, child))];
  }

  if (_horizontalWrap) {
    [self addConstraints:TI_CONSTR(TI_STRING(@"V:|-(>=%f)-[child]", (topValue)), TI_VIEWS(child))];
    [self addConstraints:TI_CONSTR(TI_STRING(@"V:[child]-(>=%f)-|", (bottomValue)), TI_VIEWS(child))];

  } else {

    TiDimension height = childConstraints->height;
    if (IS_AUTOFILL(height) || (IS_UNDEFINED(height) && IS_AUTOFILL(child->_defaultHeight))) {
      if (IS_UNDEFINED(top))
        top = TiDimensionFromObject(@0);
      if (IS_UNDEFINED(bottom))
        bottom = TiDimensionFromObject(@0);
    }

    BOOL bottomUndefined = IS_UNDEFINED(bottom);
    BOOL topUndefined = IS_UNDEFINED(top);
    if (bottomUndefined && topUndefined) {
      [self addConstraint:[NSLayoutConstraint constraintWithItem:self attribute:NSLayoutAttributeCenterY relatedBy:NSLayoutRelationEqual toItem:child attribute:NSLayoutAttributeCenterY multiplier:1 constant:0]];
    } else {
      if (!bottomUndefined) {
        [self addConstraints:TI_CONSTR(TI_STRING(@"V:[child]-(%f)-|", (bottomValue)), TI_VIEWS(child))];
      }
      if (!topUndefined) {
        [self addConstraints:TI_CONSTR(TI_STRING(@"V:|-(%f)-[child]", (topValue)), TI_VIEWS(child))];
      }
    }
    if (next == nil) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"H:[child]-(>=%f)-|", (rightValue)), TI_VIEWS(child))];
    }
  }
}

- (void)removeConstraintFromChild:(UIView *)child attribute:(NSLayoutAttribute)attribute
{
  NSArray *constraints = [self constraints];
  for (NSLayoutConstraint *c in constraints) {
    if (([c firstItem] == child || [c secondItem] == child) && ([c firstAttribute] == attribute || [c secondAttribute] == attribute)) {
      [self removeConstraint:c];
      return;
    }
  }
}

- (void)redoConstraintsForHorizontalWrap
{
  CGFloat maxWidthAlowed = self.frame.size.width;
  NSArray *children = [self subviews];
  NSUInteger length = [children count];
  ;

  TiLayoutView *tallestView;
  TiLayoutView *tempView;
  CGFloat currentPosition = 0;
  for (NSUInteger i = 0; i < length; i++) {

    TiLayoutView *prev = nil;
    TiLayoutView *curr = [children objectAtIndex:i];
    TiLayoutView *next = nil;

    TiLayoutConstraint *childConstraints = [curr tiLayoutConstraint];

    TiDimension top = childConstraints->top;
    TiDimension left = childConstraints->left;
    TiDimension right = childConstraints->left;
    TiDimension bottom = childConstraints->bottom;

    CGFloat topValue = TiDimensionCalculateValue(top, 1);
    CGFloat leftValue = TiDimensionCalculateValue(left, 1);
    CGFloat rightValue = TiDimensionCalculateValue(right, 1);
    CGFloat bottomValue = TiDimensionCalculateValue(bottom, 1);

    CGFloat prevBottomValue = 0;
    CGFloat prevRightValue = 0;

    if (i != 0) // not first one
    {
      prev = [children objectAtIndex:i - 1];

      TiLayoutConstraint *prevConstraints = [prev tiLayoutConstraint];

      TiDimension prevBottom = prevConstraints->bottom;
      TiDimension prevRight = prevConstraints->right;

      prevBottomValue = TiDimensionCalculateValue(prevBottom, 1);
      prevRightValue = TiDimensionCalculateValue(prevRight, 1);
    }
    if (i < length - 1) {
      next = [children objectAtIndex:i + 1];
    }

    CGFloat spaceTakenHorizontally = leftValue + curr.frame.size.width + rightValue;
    CGFloat spaceTakenVeritcally = topValue + curr.frame.size.height + bottomValue;

    currentPosition += spaceTakenHorizontally;

    if (currentPosition > maxWidthAlowed) {

      currentPosition = spaceTakenHorizontally;
      tempView = tallestView;
      tallestView = nil;
      [self removeConstraintFromChild:curr attribute:NSLayoutAttributeLeft];
      [self addConstraints:TI_CONSTR(TI_STRING(@"H:|-(>=%f)-[curr]", leftValue), TI_VIEWS(curr))];
    }

    [self removeConstraintFromChild:curr attribute:NSLayoutAttributeTop];

    if (tempView != nil) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"V:[tempView]-(%f)-[curr]", topValue + TiDimensionCalculateValue([tempView tiLayoutConstraint] -> bottom, 0)), TI_VIEWS(tempView, curr))];
    } else {
      [self addConstraints:TI_CONSTR(TI_STRING(@"V:|-(%f)-[curr]", topValue), TI_VIEWS(curr))];
    }

    if (tallestView == nil) {
      tallestView = curr;
    } else {
      TiLayoutConstraint *tallestConstraints = [tallestView tiLayoutConstraint];
      CGFloat tallestBottom = TiDimensionCalculateValue(tallestConstraints->bottom, 0);
      CGFloat tallestTop = TiDimensionCalculateValue(tallestConstraints->top, 0);
      CGFloat tallestSpaceTakenVeritcally = tallestTop + tallestView.frame.size.height + tallestBottom;
      if (spaceTakenVeritcally > tallestSpaceTakenVeritcally) {
        tallestView = curr;
        spaceTakenVeritcally = tallestSpaceTakenVeritcally;
      }
    }

    if (next == nil) {
      [self addConstraints:TI_CONSTR(TI_STRING(@"V:[curr]-(>=%f)-|", bottomValue), TI_VIEWS(curr))];
    }
  }
}

- (void)checkPercentageMargins
{
  //    NSUInteger startAt = _innerView == nil ? 0 : 1;
  BOOL isScrollViewContentView = [[self superview] isKindOfClass:[UIScrollView class]];
  CGRect rect;
  if (isScrollViewContentView) {
    rect = [[[self superview] superview] frame];
  } else {
    rect = self.frame;
  }

  if (CGRectIsEmpty(rect))
    return;

  TiLayoutView *previous = nil;
  TiLayoutView *next = nil;
  NSArray *subviews = [self subviews];
  for (NSUInteger index = 0, length = [subviews count]; index < length; index++) {
    TiLayoutView *child = [subviews objectAtIndex:index];
    if (![child isKindOfClass:[TiLayoutView class]]) {
      continue;
    }
    CGFloat parentWidth = rect.size.width;
    CGFloat parentHeight = rect.size.height;
    BOOL isLeftPercentage = child->_isLeftPercentage;
    BOOL isRightPercentage = child->_isRightPercentage;
    BOOL isTopPercentage = child->_isTopPercentage;
    BOOL isBottomPercentage = child->_isBottomPercentage;
    BOOL needsUpdate = NO;
    if (isLeftPercentage || isRightPercentage || isTopPercentage || isBottomPercentage) {

      if (isLeftPercentage) {
        CGFloat value = parentWidth * child->_leftPercentage;
        TiDimension newValue = TiDimensionFromObject([NSString stringWithFormat:@"%f", value]);
        if (!TiDimensionEqual(newValue, child->_tiLayoutConstraint.left)) {
          child->_tiLayoutConstraint.left = newValue;
          needsUpdate = YES;
        }
      }
      if (isRightPercentage) {
        CGFloat value = parentWidth * child->_rightPercentage;
        TiDimension newValue = TiDimensionFromObject([NSString stringWithFormat:@"%f", value]);
        if (!TiDimensionEqual(newValue, child->_tiLayoutConstraint.right)) {
          child->_tiLayoutConstraint.right = newValue;
          needsUpdate = YES;
        }
      }
      if (isTopPercentage) {
        CGFloat value = parentHeight * child->_topPercentage;
        TiDimension newValue = TiDimensionFromObject([NSString stringWithFormat:@"%f", value]);
        if (!TiDimensionEqual(newValue, child->_tiLayoutConstraint.top)) {
          child->_tiLayoutConstraint.top = newValue;
          needsUpdate = YES;
        }
      }
      if (isBottomPercentage) {
        CGFloat value = parentHeight * child->_bottomPercentage;
        TiDimension newValue = TiDimensionFromObject([NSString stringWithFormat:@"%f", value]);
        if (!TiDimensionEqual(newValue, child->_tiLayoutConstraint.bottom)) {
          child->_tiLayoutConstraint.bottom = newValue;
          needsUpdate = YES;
        }
      }
    }

    if (needsUpdate) {
      if (index > 0) {
        NSUInteger i = index;
        TiLayoutView *prev = [subviews objectAtIndex:i - 1];
        while (![prev isKindOfClass:[TiLayoutView class]] && i != 0) {
          prev = [subviews objectAtIndex:i--];
        }
        previous = prev;
      }
      next = nil;
      if (index > length) {
        NSUInteger i = index;
        TiLayoutView *nex = [subviews objectAtIndex:i + 1];
        while (![nex isKindOfClass:[TiLayoutView class]] && i != length) {
          nex = [subviews objectAtIndex:i++];
        }
        next = nex;
      }

      [self updateMarginsPrevious:previous current:child next:next];
    }
  }
}

- (void)layoutSubviews
{
  if (![self loaded]) {
    [super layoutSubviews];
    return;
  }
  [self checkPercentageMargins];
  [super layoutSubviews];

  if (TiLayoutRuleIsHorizontal(_tiLayoutConstraint.layoutStyle) && [self horizontalWrap]) {
    _needsToRemoveConstrains = YES;
    [self layoutChildren];
    [super layoutSubviews];
    [self redoConstraintsForHorizontalWrap];
    [super layoutSubviews];
  }
}

- (void)updateMarginsPrevious:(TiLayoutView *)prev current:(TiLayoutView *)current next:(TiLayoutView *)next
{
  if (TiLayoutRuleIsHorizontal(_tiLayoutConstraint.layoutStyle)) {
    [self updateMarginsForHorizontalLayout:prev current:current next:next];
  } else if (TiLayoutRuleIsVertical(_tiLayoutConstraint.layoutStyle)) {
    [self updateMarginsForVerticalLayout:prev current:current next:next];
  } else {
    [self updateMarginsForAbsoluteLayout:current];
  }
}

- (void)updateMargins
{
  TiLayoutView *parent = (TiLayoutView *)[self superview];
  if (parent != nil) {
    if ([parent isKindOfClass:[TiLayoutView class]]) {
      if (TiLayoutRuleIsAbsolute([parent tiLayoutConstraint] -> layoutStyle)) {
        [parent updateMarginsForAbsoluteLayout:self];
      } else {
        [parent layoutChildren];
      }
    }
    [parent setNeedsLayout];
    [parent layoutIfNeeded];
  }
}

@end

void TiLayoutRemoveChildConstraints(UIView *superview, UIView *child)
{
  NSMutableArray *toRemoved = [NSMutableArray array];
  for (NSLayoutConstraint *constraint in [superview constraints]) {
    if (([constraint firstItem] == child || [constraint secondItem] == child)) {
      [toRemoved addObject:constraint];
    }
  }
  [superview removeConstraints:toRemoved];
}
#endif
