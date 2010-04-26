/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiGradient.h"

#import "TiUtils.h"

@implementation TiGradient
@synthesize backfillStart, backfillEnd;

-(void)ensureOffsetArraySize:(int)newSize
{
	if (newSize <= arraySize)
	{
		return;
	}
	colorOffsets = realloc(colorOffsets, (sizeof(CGFloat) * newSize));
	for (int i=arraySize; i<newSize; i++)
	{
		colorOffsets[i]=-1;
	}
	arraySize = newSize;
}

-(CGGradientRef) cachedGradient
{
	if ((cachedGradient == NULL) && (colorValues != NULL))
	{
		CGColorSpaceRef rgb = CGColorSpaceCreateDeviceRGB();
		BOOL needsFreeing = NO;

		CGFloat * tempOffsets;
		if (offsetsDefined == CFArrayGetCount(colorValues))
		{
			tempOffsets = colorOffsets;
		}
		else
		{
			tempOffsets = NULL;
		}
		//TODO: Between these extremes, we should do intelligent gradient computation.

		cachedGradient = CGGradientCreateWithColors(rgb, colorValues, tempOffsets);

		if (needsFreeing)
		{
			free(tempOffsets);
		}
		CGColorSpaceRelease(rgb);
	}
	return cachedGradient;
}

-(void)clearCache
{
	if (cachedGradient != NULL)
	{
		CGGradientRelease(cachedGradient);
		cachedGradient = NULL;
	}
}

- (void) dealloc
{
	if (colorValues != NULL)
	{
		CFRelease(colorValues);
	}
	[self clearCache];
	free(colorOffsets);
	[super dealloc];
}



-(id)type
{
	switch (type)
	{
		case TiGradientTypeRadial:
			return @"radial";
	}
	return @"linear";
}

-(void)setType:(id)newType
{
	ENSURE_TYPE(newType,NSString);
	[self clearCache];
	if ([newType compare:@"linear" options:NSCaseInsensitiveSearch]==NSOrderedSame)
	{
		type = TiGradientTypeLinear;
		return;
	}

	if ([newType compare:@"radial" options:NSCaseInsensitiveSearch]==NSOrderedSame)
	{
		type = TiGradientTypeRadial;
		return;
	}

	[self throwException:TiExceptionInvalidType subreason:@"Must be either 'linear' or 'radial'" location:CODELOCATION];
}

-(void)setStartPoint:(id)newStart
{
	startPoint = [TiUtils pointValue:newStart];
}

-(void)setEndPoint:(id)newEnd
{
	endPoint = [TiUtils pointValue:newEnd];
}

-(void)setStartRadius:(id)newRadius
{
	startRadius = [TiUtils dimensionValue:newRadius];
}

-(void)setEndRadius:(id)newRadius
{
	startRadius = [TiUtils dimensionValue:newRadius];
}

-(void)setColors:(NSArray *)newColors;
{
	ENSURE_TYPE(newColors,NSArray);
	if (colorValues == NULL)
	{
		colorValues = CFArrayCreateMutable(NULL, [newColors count], &kCFTypeArrayCallBacks);
	}
	else
	{
		CFArrayRemoveAllValues(colorValues);
	}

	[self ensureOffsetArraySize:[newColors count]];
	int currentIndex=0;
	offsetsDefined = 0;

	Class dictClass = [NSDictionary class];
	for (id thisEntry in newColors)
	{
		CGFloat thisOffset = -1;
		if ([thisEntry isKindOfClass:dictClass])
		{
			thisOffset = [TiUtils floatValue:@"offset" properties:thisEntry def:-1];
			thisEntry = [thisEntry objectForKey:@"color"];
		}

		UIColor * thisColor = [[TiUtils colorValue:thisEntry] _color];
		if (thisColor == nil)
		{
			[self throwException:TiExceptionInvalidType subreason:
					@"Colors must be an array of colors or objects with a color property" location:CODELOCATION];
		}

		colorOffsets[currentIndex] = thisOffset;
		if (thisOffset != -1)
		{
			offsetsDefined ++;
		}

		CFArrayAppendValue(colorValues, [thisColor CGColor]);
		currentIndex ++;
	}
	[self clearCache];
}

-(void)paintContext:(CGContextRef)context bounds:(CGRect)bounds
{
	CGGradientDrawingOptions options = 0;
	if(backfillStart)
	{
		options |= kCGGradientDrawsBeforeStartLocation;
	}
	if(backfillEnd)
	{
		options |= kCGGradientDrawsAfterEndLocation;
	}

	switch (type)
	{
		case TiGradientTypeLinear:
			CGContextDrawLinearGradient(context, [self cachedGradient], startPoint, endPoint, options);
			break;
		case TiGradientTypeRadial:
			CGContextDrawRadialGradient(context, [self cachedGradient], startPoint,
					TiDimensionCalculateValue(startRadius,0), endPoint, TiDimensionCalculateValue(endRadius,0), options);
			break;
	}
}

@end
