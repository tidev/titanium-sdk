/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TI_USE_AUTOLAYOUT

#import "TiDimension.h"
#import "TiApp.h"
#import "TiUtils.h"

const TiDimension TiDimensionZero = { TiDimensionTypeDip, 0 };
const TiDimension TiDimensionAuto = { TiDimensionTypeAuto, 0 };
const TiDimension TiDimensionAutoSize = { TiDimensionTypeAutoSize, 0 };
const TiDimension TiDimensionAutoFill = { TiDimensionTypeAutoFill, 0 };
const TiDimension TiDimensionUndefined = { TiDimensionTypeUndefined, 0 };

TiDimension TiDimensionMake(TiDimensionType type, CGFloat value)
{
  if ((value != 0) && (!isnormal(value))) {
    DebugLog(@"[WARN] Invalid dimension value (%f) requested. Making the dimension undefined instead.", value);
    return TiDimensionUndefined;
  }
  if (!((value > -1e5) && (value < 1e5))) {
    DebugLog(@"[WARN] Extreme dimension value (%f) requested. Allowing, just in case this is intended.", value);
  }
  TiDimension dimension;
  dimension.type = type;
  dimension.value = value;
  return dimension;
}

CGFloat convertInchToPixels(CGFloat value)
{
  return [TiUtils dpi] * value;
}

CGFloat convertPixelsToDip(CGFloat value)
{
  return value / UIScreen.mainScreen.scale;
}

CGFloat convertDipToInch(CGFloat value)
{
  return (value * UIScreen.mainScreen.scale) / [TiUtils dpi];
}

CGFloat convertDipToPixels(CGFloat value)
{
  return value * UIScreen.mainScreen.scale;
}

BOOL hasValidUnit(id object)
{
  if (object == nil || [object respondsToSelector:@selector(floatValue)]) {
    return NO;
  }

  return [object hasSuffix:kTiBehaviorAuto] ||
      [object hasSuffix:kTiBehaviorFill] ||
      [object hasSuffix:kTiBehaviorSize] ||
      [object hasSuffix:kTiUnitPixel] ||
      [object hasSuffix:kTiUnitCm] ||
      [object hasSuffix:kTiUnitMm] ||
      [object hasSuffix:kTiUnitInch] ||
      [object hasSuffix:kTiUnitDip] ||
      [object hasSuffix:kTiUnitDipAlternate];
}

TiDimension TiDimensionFromObject(id object)
{
  // First, check if a default unit is set
  NSString *defaultUnit = [[TiApp tiAppProperties] objectForKey:@"ti.ui.defaultunit"];

  // If there is no default unit, return dip
  if (defaultUnit == nil) {
    return TiDimensionMake(TiDimensionTypeDip, [object floatValue]);
  }

  // If the object is convertable to a number, e.g. 200 or '200', append the default value
  if (!hasValidUnit(object)) {
    object = [NSString stringWithFormat:@"%@%@", object, defaultUnit];
  }

  // If the object is not convertable to a number, e.g. '200cm', check for the suffix
  if ([object isKindOfClass:[NSString class]]) {
    // Equals "auto"
    if ([object caseInsensitiveCompare:kTiBehaviorAuto] == NSOrderedSame) {
      return TiDimensionAuto;
    }
    // Equals "Ti.UI.FILL"
    if ([object caseInsensitiveCompare:kTiBehaviorFill] == NSOrderedSame) {
      return TiDimensionAutoFill;
    }
    // Equals "Ti.UI.SIZE"
    if ([object caseInsensitiveCompare:kTiBehaviorSize] == NSOrderedSame) {
      return TiDimensionAutoSize;
    }
    // Has suffix "px"
    if ([object hasSuffix:kTiUnitPixel]) {
      return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip([object floatValue]));
      // Has suffix "cm"
    } else if ([object hasSuffix:kTiUnitCm]) {
      float pixelVal = convertInchToPixels(([object floatValue] / INCH_IN_CM));
      return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip(pixelVal));
      // Has suffix "mm"
    } else if ([object hasSuffix:kTiUnitMm]) {
      float pixelVal = convertInchToPixels(([object floatValue] / INCH_IN_MM));
      return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip(pixelVal));
      // Has suffix "in"
    } else if ([object hasSuffix:kTiUnitInch]) {
      float pixelVal = convertInchToPixels([object floatValue]);
      return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip(pixelVal));
      // Has suffix "dip" or "dip"
    } else if ([object hasSuffix:kTiUnitDip] || [object hasSuffix:kTiUnitDipAlternate]) {
      return TiDimensionMake(TiDimensionTypeDip, [object floatValue]);
      // Has suffix "%"
    } else if ([object hasSuffix:kTiUnitPercent]) {
      return TiDimensionMake(TiDimensionTypePercent, ([object floatValue] / 100.0));
    }
  }

  // Anything else is not handled and returns undefined
  return TiDimensionUndefined;
}

#endif
