/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#import "TiDimension.h"
#import "TiPoint.h"

#import <CoreGraphics/CoreGraphics.h>
#import <QuartzCore/QuartzCore.h>

typedef enum {
	TiGradientTypeLinear,
	TiGradientTypeRadial,
} TiGradientType;

@interface TiGradient : TiProxy {
	TiGradientType type;

	TiPoint * startPoint;
	TiPoint * endPoint;

	TiDimension startRadius;
	TiDimension endRadius;

	BOOL backfillStart;
	BOOL backfillEnd;
	
	CGGradientRef cachedGradient;
	
	CFMutableArrayRef colorValues;
	CGFloat * colorOffsets;	//A -1 indicates a lack of entry.
	int arraySize;
	int offsetsDefined;
@private

}

//@property(nonatomic,readwrite,copy)	id	type;
//
//@property(nonatomic,readwrite,copy)	id	startPoint;
//@property(nonatomic,readwrite,copy)	id	endPoint;
//@property(nonatomic,readwrite,copy)	id startRadius;
//@property(nonatomic,readwrite,copy)	id endRadius;

@property(nonatomic,readwrite,assign)	BOOL backfillStart;
@property(nonatomic,readwrite,assign)	BOOL backfillEnd;

//@property(nonatomic,readwrite,copy)	NSArray * colors;

-(void)paintContext:(CGContextRef)context bounds:(CGRect)bounds;

+(TiGradient *)gradientFromObject:(id)value proxy:(TiProxy *)proxy;

@end

@interface TiGradientLayer : CALayer
{
	TiGradient * gradient;
}
@property(nonatomic,readwrite,retain) TiGradient * gradient;
@end

