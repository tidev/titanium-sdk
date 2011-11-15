/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBase.h"

//Not a class for speed reasons, like LayoutConstraint.

typedef enum {
	TiDimensionTypeUndefined,
	TiDimensionTypePixels,
	TiDimensionTypeAuto,
	TiDimensionTypePercent,
} TiDimensionType;

struct TiDimension {
	TiDimensionType type;
	CGFloat value;
	//If type is TiDimensionTypePixels, value is a pixel constant,
	//If type is TiDimensionTypePercent, value ranges from 0 (0%) to 1.0 (100%)
};

typedef struct TiDimension TiDimension;

extern const TiDimension TiDimensionZero;
extern const TiDimension TiDimensionAuto;
extern const TiDimension TiDimensionUndefined;

TiDimension TiDimensionMake(TiDimensionType type, CGFloat value);

TI_INLINE TiDimension TiDimensionPixels(CGFloat value)
{
	return TiDimensionMake(TiDimensionTypePixels,value);
}

TI_INLINE bool TiDimensionIsPercent(TiDimension dimension)
{
	return dimension.type == TiDimensionTypePercent;
}

TI_INLINE bool TiDimensionIsAuto(TiDimension dimension)
{
	return dimension.type == TiDimensionTypeAuto;
}

TI_INLINE bool TiDimensionIsPixels(TiDimension dimension)
{
	return dimension.type == TiDimensionTypePixels;
}

TI_INLINE bool TiDimensionIsUndefined(TiDimension dimension)
{
	return dimension.type == TiDimensionTypeUndefined;
}

TI_INLINE bool TiDimensionEqual(TiDimension dimension1, TiDimension dimension2)
{
	if (dimension1.type != dimension2.type)
	{
		return false;
	}
	if (TiDimensionIsPixels(dimension1) || TiDimensionIsPercent(dimension1)) {
		//Value is only valid in pixels and percent. In undefined and auto, value is ignored.
		return dimension1.value == dimension2.value;
	}
	return true;
}

TI_INLINE TiDimension TiDimensionFromObject(id object)
{
	if ([object isKindOfClass:[NSString class]])
	{
		if ([object caseInsensitiveCompare:@"auto"]==NSOrderedSame)
		{
			return TiDimensionAuto;
		}
		// do px vs % parsing
		NSRange range = [object rangeOfString:@"px"];
		if (range.location!=NSNotFound)
		{
			NSString *value = [[object substringToIndex:range.location] stringByReplacingOccurrencesOfString:@" " withString:@""];
			return TiDimensionMake(TiDimensionTypePixels, [value floatValue]);
		}
		range = [object rangeOfString:@"%"];
		if (range.location!=NSNotFound)
		{
			NSString *value = [[object substringToIndex:range.location] stringByReplacingOccurrencesOfString:@" " withString:@""];
			return TiDimensionMake(TiDimensionTypePercent, ([value floatValue] / 100.0));
		}
	}
	if ([object respondsToSelector:@selector(floatValue)])
	{
		return TiDimensionMake(TiDimensionTypePixels, [object floatValue]);
	}
	return TiDimensionUndefined;
}

TI_INLINE BOOL TiDimensionDidCalculateValue(TiDimension dimension,CGFloat boundingValue,CGFloat * result)
{
	switch (dimension.type)
	{
		case TiDimensionTypePixels:
			*result = dimension.value;
			return YES;
		case TiDimensionTypePercent:
			*result = dimension.value * boundingValue;
			return YES;
		default: {
			break;
		}
	}
	return NO;
}

TI_INLINE CGFloat TiDimensionCalculateValue(TiDimension dimension,CGFloat boundingValue)
{
	CGFloat result;
	if(TiDimensionDidCalculateValue(dimension,boundingValue,&result))
	{
		return result;
	}
	return 0.0;
}

TI_INLINE CGFloat TiDimensionCalculateRatio(TiDimension dimension,CGFloat boundingValue)
{
	switch (dimension.type)
	{
		case TiDimensionTypePercent:
			return dimension.value;
		case TiDimensionTypePixels:
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
	result.origin.y = TiDimensionCalculateRatio(top,imageSize.height);
	result.size.height = 1.0 - TiDimensionCalculateRatio(bottom,imageSize.height) - result.origin.y;
	result.origin.x = TiDimensionCalculateRatio(left,imageSize.width);
	result.size.width = 1.0 - TiDimensionCalculateRatio(right,imageSize.width) - result.origin.x;

	return result;
}
