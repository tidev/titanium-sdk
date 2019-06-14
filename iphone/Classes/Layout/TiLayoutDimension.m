/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef TI_USE_AUTOLAYOUT
#import "TiLayoutDimension.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiUtils.h>

NSString *const kTiBehaviorSize = @"SIZE";
NSString *const kTiBehaviorFill = @"FILL";
NSString *const kTiBehaviorAuto = @"auto";
NSString *const kTiUnitPixel = @"px";
NSString *const kTiUnitCm = @"cm";
NSString *const kTiUnitMm = @"mm";
NSString *const kTiUnitInch = @"in";
NSString *const kTiUnitDip = @"dip";
NSString *const kTiUnitDipAlternate = @"dp";
NSString *const kTiUnitSystem = @"system";
NSString *const kTiUnitPercent = @"%";

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
  if ([TiUtils isRetinaHDDisplay]) {
    return value / 3.0;
  }
  if ([TiUtils isRetinaDisplay]) {
    return value / 2.0;
  }
  return value;
}

CGFloat convertDipToInch(CGFloat value)
{
  if ([TiUtils isRetinaHDDisplay]) {
    return (value * 3.0) / [TiUtils dpi];
  }
  if ([TiUtils isRetinaDisplay]) {
    return (value * 2.0) / [TiUtils dpi];
  }
  return value / [TiUtils dpi];
}

CGFloat convertDipToPixels(CGFloat value)
{
  if ([TiUtils isRetinaHDDisplay]) {
    return (value * 3.0);
  }
  if ([TiUtils isRetinaDisplay]) {
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
    if ([object caseInsensitiveCompare:@"undefined"] == NSOrderedSame) {
      return TiDimensionUndefined;
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
        //                DebugLog(@"[WARN] Property ti.ui.defaultunit is not valid value. Defaulting to system");
        return TiDimensionMake(TiDimensionTypeDip, [object floatValue]);
      }
    } else {
      //            DebugLog(@"[WARN] Property ti.ui.defaultunit is not of type string. Defaulting to system");
      return TiDimensionMake(TiDimensionTypeDip, [object floatValue]);
    }
  }
  return TiDimensionUndefined;
}
#endif
