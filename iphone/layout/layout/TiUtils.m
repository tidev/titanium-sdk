/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUtils.h"
#import "TiLayoutView.h"

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
    firstView = [first viewName];
  } else {
    firstView = TI_STRING(@"%@", [first class]);
  }

  if ([second respondsToSelector:@selector(viewName)]) {
    secondView = [second viewName];
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

static BOOL _isTesting = NO;
@implementation TiUtils

+ (NSString *)stringFromAttribute:(NSLayoutAttribute)attr
{
  return TiLayoutStringFromAttribute(attr);
}
+ (NSString *)stringFromRelation:(NSLayoutRelation)relation
{
  return TiLayoutStringFromRelation(relation);
}

+ (void)setIsTesting:(BOOL)flag
{
  NSLog(@"%s %i", __PRETTY_FUNCTION__, flag);
  _isTesting = flag;
}
+ (BOOL)isTesting
{
  NSLog(@"%s %i", __PRETTY_FUNCTION__, _isTesting);
  return _isTesting;
}

+ (BOOL)isIPad
{
  return [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad;
}

+ (BOOL)isRetinaDisplay
{
  // since we call this alot, cache it
  static CGFloat scale = 0.0;
  if (scale == 0.0) {
    // NOTE: iPad in iPhone compatibility mode will return a scale factor of 2.0
    // when in 2x zoom, which leads to false positives and bugs. This tries to
    // future proof against possible different model names, but in the event of
    // an iPad with a retina display, this will need to be fixed.
    // Credit to Brion on github for the origional fix.
    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone) {
      NSRange iPadStringPosition = [[[UIDevice currentDevice] model] rangeOfString:@"iPad"];
      if (iPadStringPosition.location != NSNotFound) {
        scale = 1.0;
        return NO;
      }
    }
    scale = [[UIScreen mainScreen] scale];
  }
  return scale > 1.0;
}

+ (BOOL)isRetinaHDDisplay
{
  if ([TiUtils isIOS8OrGreater]) {
    return ([UIScreen mainScreen].scale == 3.0);
  }
  return NO;
}

+ (BOOL)isIOS8OrGreater
{
  return [UIView instancesRespondToSelector:@selector(layoutMarginsDidChange)];
}

+ (int)dpi
{
  if ([TiUtils isIPad]) {
    if ([TiUtils isRetinaDisplay]) {
      return 260;
    }
    return 130;
  } else {
    if ([TiUtils isRetinaHDDisplay]) {
      return 480;
    } else if ([TiUtils isRetinaDisplay]) {
      return 320;
    }
    return 160;
  }
}
+ (CGFloat)floatValue:(id)value def:(CGFloat)def
{
  return [self floatValue:value def:def valid:NULL];
}

+ (CGFloat)floatValue:(id)value def:(CGFloat)def valid:(BOOL *)isValid
{
  if ([value respondsToSelector:@selector(floatValue)]) {
    if (isValid != NULL)
      *isValid = YES;
    return [value floatValue];
  }
  if (isValid != NULL) {
    *isValid = NO;
  }
  return def;
}

+ (CGFloat)floatValue:(id)value
{
  return [self floatValue:value def:NSNotFound];
}

+ (void)setView:(UIView *)view positionRect:(CGRect)frameRect
{
  CGPoint anchorPoint = [[view layer] anchorPoint];
  CGPoint newCenter;
  newCenter.x = frameRect.origin.x + (anchorPoint.x * frameRect.size.width);
  newCenter.y = frameRect.origin.y + (anchorPoint.y * frameRect.size.height);
  CGRect newBounds = CGRectMake(0, 0, frameRect.size.width, frameRect.size.height);

  [view setBounds:newBounds];
  [view setCenter:newCenter];
}

@end

@implementation NSTimer (Blocks)

+ (id)scheduledTimerWithTimeInterval:(NSTimeInterval)inTimeInterval block:(void (^)())inBlock repeats:(BOOL)inRepeats
{
  void (^block)() = [inBlock copy];
  id ret = [self scheduledTimerWithTimeInterval:inTimeInterval target:self selector:@selector(jdExecuteSimpleBlock:) userInfo:block repeats:inRepeats];
  return ret;
}

+ (void)jdExecuteSimpleBlock:(NSTimer *)inTimer;
{
  if ([inTimer userInfo]) {
    void (^block)() = (void (^)())[inTimer userInfo];
    block();
  }
}

@end
