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
  if ([TiUtils is3xRetina]) {
    return value / 3.0;
  }
  if ([TiUtils is2xRetina]) {
    return value / 2.0;
  }
  return value;
}

CGFloat convertDipToInch(CGFloat value)
{
  if ([TiUtils is3xRetina]) {
    return (value * 3.0) / [TiUtils dpi];
  }
  if ([TiUtils is2xRetina]) {
    return (value * 2.0) / [TiUtils dpi];
  }
  return value / [TiUtils dpi];
}

CGFloat convertDipToDefaultUnit(CGFloat value)
{
  id unit = [[TiApp tiAppProperties] objectForKey:@"ti.ui.defaultunit"];
  if (unit != nil) {
    if ([unit caseInsensitiveCompare:kTiUnitCm] == NSOrderedSame) {
      value = convertDipToInch(value) * INCH_IN_CM;
    } else if ([unit caseInsensitiveCompare:kTiUnitInch] == NSOrderedSame) {
      value = convertDipToInch(value);
    } else if ([unit caseInsensitiveCompare:kTiUnitMm] == NSOrderedSame) {
      value = convertDipToInch(value) * INCH_IN_MM;
    } else if ([unit caseInsensitiveCompare:kTiUnitPixel] == NSOrderedSame) {
      value = convertDipToPixels(value);
    }
  }
  return value;
}

CGFloat convertDipToPixels(CGFloat value)
{
  if ([TiUtils is3xRetina]) {
    return (value * 3.0);
  }
  if ([TiUtils is2xRetina]) {
    return (value * 2.0);
  }
  return value;
}

TiDimension TiDimensionFromObject(id object)
{
  if ([object isKindOfClass:[NSString class]]) {
    if ([object caseInsensitiveCompare:kTiBehaviorAuto] == NSOrderedSame) {
      return TiDimensionAuto;
    }
    if ([object caseInsensitiveCompare:kTiBehaviorFill] == NSOrderedSame) {
      return TiDimensionAutoFill;
    }
    if ([object caseInsensitiveCompare:kTiBehaviorSize] == NSOrderedSame) {
      return TiDimensionAutoSize;
    }

    if ([object hasSuffix:kTiUnitPixel]) {
      return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip([object floatValue]));
    } else if ([object hasSuffix:kTiUnitCm]) {
      float pixelVal = convertInchToPixels(([object floatValue] / INCH_IN_CM));
      return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip(pixelVal));
    } else if ([object hasSuffix:kTiUnitMm]) {
      float pixelVal = convertInchToPixels(([object floatValue] / INCH_IN_MM));
      return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip(pixelVal));
    } else if ([object hasSuffix:kTiUnitInch]) {
      float pixelVal = convertInchToPixels([object floatValue]);
      return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip(pixelVal));
    } else if ([object hasSuffix:kTiUnitDip] || [object hasSuffix:kTiUnitDipAlternate]) {
      return TiDimensionMake(TiDimensionTypeDip, [object floatValue]);
    } else if ([object hasSuffix:kTiUnitPercent]) {
      return TiDimensionMake(TiDimensionTypePercent, ([object floatValue] / 100.0));
    }
  }
  if ([object respondsToSelector:@selector(floatValue)]) {
    id val = [[TiApp tiAppProperties] objectForKey:@"ti.ui.defaultunit"];
    if (val == nil) {
      return TiDimensionMake(TiDimensionTypeDip, [object floatValue]);
    }
    if ([val isKindOfClass:[NSString class]]) {
      if (([val caseInsensitiveCompare:kTiUnitDip] == NSOrderedSame) || ([val caseInsensitiveCompare:kTiUnitDipAlternate] == NSOrderedSame)
          || ([val caseInsensitiveCompare:kTiUnitSystem] == NSOrderedSame)) {
        return TiDimensionMake(TiDimensionTypeDip, [object floatValue]);
      } else if ([val caseInsensitiveCompare:kTiUnitPixel] == NSOrderedSame) {
        return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip([object floatValue]));
      } else if ([val caseInsensitiveCompare:kTiUnitInch] == NSOrderedSame) {
        float pixelVal = convertInchToPixels([object floatValue]);
        return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip(pixelVal));
      } else if ([val caseInsensitiveCompare:kTiUnitCm] == NSOrderedSame) {
        float pixelVal = convertInchToPixels([object floatValue] / INCH_IN_CM);
        return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip(pixelVal));
      } else if ([val caseInsensitiveCompare:kTiUnitMm] == NSOrderedSame) {
        float pixelVal = convertInchToPixels([object floatValue] / INCH_IN_MM);
        return TiDimensionMake(TiDimensionTypeDip, convertPixelsToDip(pixelVal));
      } else {
        DebugLog(@"[WARN] Property ti.ui.defaultunit is not valid value. Defaulting to system");
        return TiDimensionMake(TiDimensionTypeDip, [object floatValue]);
      }
    } else {
      DebugLog(@"[WARN] Property ti.ui.defaultunit is not of type string. Defaulting to system");
      return TiDimensionMake(TiDimensionTypeDip, [object floatValue]);
    }
  }
  return TiDimensionUndefined;
}

#endif
