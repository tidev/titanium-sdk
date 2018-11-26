/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef TI_USE_AUTOLAYOUT
#include <Foundation/Foundation.h>
#include <UIKit/UIKit.h>
#include <math.h>

extern NSString *const kTiBehaviorSize;
extern NSString *const kTiBehaviorFill;
extern NSString *const kTiBehaviorAuto;
extern NSString *const kTiUnitPixel;
extern NSString *const kTiUnitCm;
extern NSString *const kTiUnitMm;
extern NSString *const kTiUnitInch;
extern NSString *const kTiUnitDip;
extern NSString *const kTiUnitDipAlternate;
extern NSString *const kTiUnitSystem;
extern NSString *const kTiUnitPercent;

#define INCH_IN_CM 2.54
#define INCH_IN_MM 25.4

#define TI_INLINE static __inline__

//Not a class for speed reasons, like LayoutConstraint.

typedef enum {
  TiDimensionTypeUndefined,
  TiDimensionTypeDip,
  TiDimensionTypeAuto,
  TiDimensionTypeAutoSize,
  TiDimensionTypeAutoFill,
  TiDimensionTypePercent,
} TiDimensionType;

/**
 The dimension struct.
 */
struct TiDimension {
  TiDimensionType type;
  CGFloat value;
  //If type is TiDimensionTypeDip, value is a Dip constant,
  //If type is TiDimensionTypePercent, value ranges from 0 (0%) to 1.0 (100%)
};

typedef struct TiDimension TiDimension;

extern const TiDimension TiDimensionZero;
extern const TiDimension TiDimensionAuto;
extern const TiDimension TiDimensionAutoSize;
extern const TiDimension TiDimensionAutoFill;
extern const TiDimension TiDimensionUndefined;

TiDimension TiDimensionMake(TiDimensionType type, CGFloat value);
TiDimension TiDimensionFromObject(id object);
CGFloat convertInchToPixels(CGFloat value);
CGFloat convertPixelsToDip(CGFloat value);
CGFloat convertDipToInch(CGFloat value);

CGFloat convertDipToPixels(CGFloat value);

TI_INLINE TiDimension TiDimensionDip(CGFloat value)
{
  return TiDimensionMake(TiDimensionTypeDip, value);
}

TI_INLINE bool TiDimensionIsPercent(TiDimension dimension)
{
  return dimension.type == TiDimensionTypePercent;
}

TI_INLINE bool TiDimensionIsAuto(TiDimension dimension)
{
  return dimension.type == TiDimensionTypeAuto;
}

TI_INLINE bool TiDimensionIsAutoSize(TiDimension dimension)
{
  return dimension.type == TiDimensionTypeAutoSize;
}

TI_INLINE bool TiDimensionIsAutoFill(TiDimension dimension)
{
  return dimension.type == TiDimensionTypeAutoFill;
}

TI_INLINE bool TiDimensionIsDip(TiDimension dimension)
{
  return dimension.type == TiDimensionTypeDip;
}

TI_INLINE bool TiDimensionIsUndefined(TiDimension dimension)
{
  return dimension.type == TiDimensionTypeUndefined;
}

TI_INLINE bool TiDimensionEqual(TiDimension dimension1, TiDimension dimension2)
{
  if (dimension1.type != dimension2.type) {
    return false;
  }
  if (TiDimensionIsDip(dimension1) || TiDimensionIsPercent(dimension1)) {
    return dimension1.value == dimension2.value;
  }
  return true;
}

TI_INLINE BOOL TiDimensionDidCalculateValue(TiDimension dimension, CGFloat boundingValue, CGFloat *result)
{
  switch (dimension.type) {
  case TiDimensionTypeDip:
    *result = dimension.value;
    return YES;
  case TiDimensionTypePercent:
    *result = roundf(dimension.value * boundingValue);
    return YES;
  default: {
    break;
  }
  }
  return NO;
}

TI_INLINE CGFloat TiDimensionCalculateValue(TiDimension dimension, CGFloat boundingValue)
{
  CGFloat result;
  if (TiDimensionDidCalculateValue(dimension, boundingValue, &result)) {
    return result;
  }
  return 0.0;
}

TI_INLINE CGFloat TiDimensionCalculateRatio(TiDimension dimension, CGFloat boundingValue)
{
  switch (dimension.type) {
  case TiDimensionTypePercent:
    return dimension.value;
  case TiDimensionTypeDip:
    return dimension.value / boundingValue;
  default: {
    break;
  }
  }
  return 0.0;
}

TI_INLINE CGFloat TiDimensionCalculateMargins(TiDimension dimension1, TiDimension dimension2, CGFloat boundingValue)
{
  return boundingValue - (TiDimensionCalculateValue(dimension1, boundingValue) + TiDimensionCalculateValue(dimension2, boundingValue));
}

//TODO: Do these ALL have to be TI_INLINE?
TI_INLINE CGRect TiDimensionLayerContentCenter(TiDimension top, TiDimension left, TiDimension bottom, TiDimension right, CGSize imageSize)
{
  CGRect result;
  result.origin.y = TiDimensionCalculateRatio(top, imageSize.height);
  result.size.height = 1.0 - TiDimensionCalculateRatio(bottom, imageSize.height) - result.origin.y;
  result.origin.x = TiDimensionCalculateRatio(left, imageSize.width);
  result.size.width = 1.0 - TiDimensionCalculateRatio(right, imageSize.width) - result.origin.x;

  return result;
}

typedef enum {
  TiLayoutRuleAbsolute,
  TiLayoutRuleVertical,
  TiLayoutRuleHorizontal,
} TiLayoutRule;

struct TiLayoutConstraint {

  BOOL centerX_isSet;
  BOOL left_isSet;
  BOOL right_isSet;
  BOOL width_isSet;

  BOOL centerY_isSet;
  BOOL top_isSet;
  BOOL bottom_isSet;
  BOOL height_isSet;

  TiDimension centerX;
  TiDimension left;
  TiDimension right;
  TiDimension width;

  TiDimension centerY;
  TiDimension top;
  TiDimension bottom;
  TiDimension height;

  TiLayoutRule layoutStyle;
  struct {
    unsigned int horizontalWrap : 1;
  } layoutFlags;

  CGFloat minimumHeight;
  CGFloat minimumWidth;
};

typedef struct TiLayoutConstraint TiLayoutConstraint;

TI_INLINE CGFloat TiFixedValueRuleFromObject(id value)
{
  if ([value respondsToSelector:@selector(floatValue)]) {
    return [value floatValue];
  }
  return 0;
}

TI_INLINE TiLayoutRule TiLayoutRuleFromObject(id object)
{
  if ([object isKindOfClass:[NSString class]]) {
    if ([object caseInsensitiveCompare:@"vertical"] == NSOrderedSame) {
      return TiLayoutRuleVertical;
    }
    if ([object caseInsensitiveCompare:@"horizontal"] == NSOrderedSame) {
      return TiLayoutRuleHorizontal;
    }
  }
  return TiLayoutRuleAbsolute;
}

TI_INLINE BOOL TiLayoutRuleIsAbsolute(TiLayoutRule rule)
{
  return rule == TiLayoutRuleAbsolute;
}

TI_INLINE BOOL TiLayoutRuleIsVertical(TiLayoutRule rule)
{
  return rule == TiLayoutRuleVertical;
}

TI_INLINE BOOL TiLayoutRuleIsHorizontal(TiLayoutRule rule)
{
  return rule == TiLayoutRuleHorizontal;
}
#endif
