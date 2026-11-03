/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiPoint.h"
#import "TiUtils.h"

@implementation TiPoint
@synthesize xDimension, yDimension;

- (id)initWithPoint:(CGPoint)point_
{
  if (self = [super init]) {
    [self setPoint:point_];
  }
  return self;
}

- (id)initWithObject:(id)object
{
  if (self = [super init]) {
    [self setValues:object];
  }
  return self;
}

- (void)setValues:(id)object
{
  if ([object isKindOfClass:[NSDictionary class]]) {
    xDimension = TiDimensionFromObject([object objectForKey:@"x"]);
    yDimension = TiDimensionFromObject([object objectForKey:@"y"]);
  } else {
    xDimension = TiDimensionUndefined;
    yDimension = TiDimensionUndefined;
  }
}

- (void)add:(TiPoint *)value
{
  if (!value) {
    return;
  }

  CGPoint offsetPoint = [value point];
  CGPoint newPoint = [self point];
  newPoint.x += offsetPoint.x;
  newPoint.y += offsetPoint.y;
  [self setPoint:newPoint];
}

- (void)setPoint:(CGPoint)point_
{
  xDimension = TiDimensionDip(point_.x);
  yDimension = TiDimensionDip(point_.y);
}

- (CGPoint)point
{
  return CGPointMake(TiDimensionCalculateValue(xDimension, 0),
      TiDimensionCalculateValue(yDimension, 0));
}

- (id)x
{
  return [TiUtils valueFromDimension:xDimension];
}

- (void)setX:(id)x
{
  xDimension = TiDimensionFromObject(x);
}

- (id)y
{
  return [TiUtils valueFromDimension:yDimension];
}

- (void)setY:(id)y
{
  yDimension = TiDimensionFromObject(y);
}

@end
