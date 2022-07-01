/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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

  TiPoint *startPoint;
  TiPoint *endPoint;

  TiDimension startRadius;
  TiDimension endRadius;

  BOOL backfillStart;
  BOOL backfillEnd;

  CGGradientRef cachedGradient;

  CFMutableArrayRef colorValues;
  CGFloat *colorOffsets; //A -1 indicates a lack of entry.
  NSUInteger arraySize;
  int offsetsDefined;
  @private
}

@property (nonatomic, readwrite, assign) BOOL backfillStart;
@property (nonatomic, readwrite, assign) BOOL backfillEnd;

- (void)paintContext:(CGContextRef)context bounds:(CGRect)bounds;
- (void)clearCache;
- (void)setColors:(NSArray *)newColors;

+ (TiGradient *)gradientFromObject:(id)value proxy:(TiProxy *)proxy;

@end

@interface TiGradientLayer : CALayer {
  TiGradient *gradient;
}
@property (nonatomic, readwrite, retain) TiGradient *gradient;
@end
