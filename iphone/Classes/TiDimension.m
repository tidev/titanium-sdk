/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiDimension.h"
#import "TiUtils.h"


const TiDimension TiDimensionZero = {TiDimensionTypeDip, 0};
const TiDimension TiDimensionAuto = {TiDimensionTypeAuto, 0};
const TiDimension TiDimensionAutoSize = {TiDimensionTypeAutoSize, 0};
const TiDimension TiDimensionAutoFill = {TiDimensionTypeAutoFill, 0};
const TiDimension TiDimensionUndefined = {TiDimensionTypeUndefined, 0};

TiDimension TiDimensionMake(TiDimensionType type, CGFloat value)
{
	if ((value!=0)&&(!isnormal(value))) {
		DebugLog(@"[WARN] Invalid dimension value (%f) requested. Making the dimension undefined instead.",value);
		return TiDimensionUndefined;
	}
	if (!((value > -1e5)&&(value < 1e5))) {
		DebugLog(@"[WARN] Extreme dimension value (%f) requested. Allowing, just in case this is intended.",value);
	}
	TiDimension dimension;
	dimension.type = type;
	dimension.value = value;
	return dimension;
}

CGFloat convertInchToPixels(CGFloat value)
{
    return [TiUtils dpi]*value;
}

CGFloat convertPixelsToDip(CGFloat value)
{
    if ([TiUtils isRetinaDisplay]) {
        return value/2.0;
    }
    return value;
}

CGFloat convertDipToInch(CGFloat value)
{
    if ([TiUtils isRetinaDisplay]) {
        return (value*2.0)/[TiUtils dpi];
    }
    return value/[TiUtils dpi];
}

CGFloat convertDipToPixels(CGFloat value)
{
    if ([TiUtils isRetinaDisplay]) {
        return (value * 2.0);
    }
    return value;
}


