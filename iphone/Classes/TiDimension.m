/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiDimension.h"


const TiDimension TiDimensionZero = {TiDimensionTypePixels, 0};
const TiDimension TiDimensionAuto = {TiDimensionTypeAuto, 0};
const TiDimension TiDimensionUndefined = {TiDimensionTypeUndefined, 0};

TiDimension TiDimensionMake(TiDimensionType type, CGFloat value)
{
	if ((value!=0)&&(!isnormal(value))) {
		NSLog(@"[FATAL] Invalid dimension value (%f) requested. Making the dimension undefined instead.",value);
		return TiDimensionUndefined;
	}
	if (!((value > -1e5)&&(value < 1e5))) {
		NSLog(@"[FATAL] Extreme dimension value (%f) requested. Allowing, just in case this is intended.",value);
	}
	TiDimension dimension;
	dimension.type = type;
	dimension.value = value;
	return dimension;
}

