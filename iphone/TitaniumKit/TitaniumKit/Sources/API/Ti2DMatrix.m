/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "Ti2DMatrix.h"
#import "TiBase.h"
#import "TiDimension.h"

@implementation Ti2DMatrix

- (id)init
{
  if (self = [super init]) {
    matrix = CGAffineTransformIdentity;
  }
  return self;
}

- (id)initWithMatrix:(CGAffineTransform)matrix_
{
  if (self = [self init]) {
    matrix = matrix_;
  }
  return self;
}

- (id)initWithProperties:(NSDictionary *)dict_
{
  if (self = [self init]) {
    if ([dict_ objectForKey:@"rotate"] != nil) {
      CGFloat angle = [[dict_ objectForKey:@"rotate"] floatValue];
      matrix = CGAffineTransformRotate(matrix, degreesToRadians(angle));
    }
    if ([dict_ objectForKey:@"scale"] != nil) {
      CGFloat xy = [[dict_ objectForKey:@"scale"] floatValue];
      matrix = CGAffineTransformScale(matrix, xy, xy);
    }
  }
  return self;
}

- (NSString *)apiName
{
  return @"Ti.UI.2DMatrix";
}

- (CGAffineTransform)matrix
{
  return matrix;
}

- (Ti2DMatrix *)translate:(id)args
{
  // Fetch given coordinates.
  id xObject = [args objectAtIndex:0];
  id yObject = [args count] == 2 ? [args objectAtIndex:1] : xObject;

  // Convert coordinates from Titanium default unit to dip.
  CGFloat tx = TiDimensionFromObject(xObject).value;
  CGFloat ty = TiDimensionFromObject(yObject).value;

  // Return a new matrix with the given translation applied to this matrix.
  CGAffineTransform newtransform = CGAffineTransformTranslate(matrix, tx, ty);
  return [[[Ti2DMatrix alloc] initWithMatrix:newtransform] autorelease];
}

- (Ti2DMatrix *)scale:(id)args
{
  CGFloat sx = [[args objectAtIndex:0] floatValue];
  CGFloat sy = [args count] == 2 ? [[args objectAtIndex:1] floatValue] : sx;
  // if they pass in 0, they mean really small which requires at least a value!=0
  if (sx == 0)
    sx = 0.0001;
  if (sy == 0)
    sy = 0.0001;
  CGAffineTransform newtransform = CGAffineTransformScale(matrix, sx, sy);
  return [[[Ti2DMatrix alloc] initWithMatrix:newtransform] autorelease];
}

- (Ti2DMatrix *)rotate:(id)args
{
  ENSURE_ARG_COUNT(args, 1);

  CGFloat angle = [[args objectAtIndex:0] floatValue];
  CGAffineTransform newtransform = CGAffineTransformRotate(matrix, degreesToRadians(angle));
  return [[[Ti2DMatrix alloc] initWithMatrix:newtransform] autorelease];
}

- (Ti2DMatrix *)invert:(id)args
{
  return [[[Ti2DMatrix alloc] initWithMatrix:CGAffineTransformInvert(matrix)] autorelease];
}

- (Ti2DMatrix *)multiply:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  Ti2DMatrix *othermatrix = [args objectAtIndex:0];
  ENSURE_TYPE(othermatrix, Ti2DMatrix);
  CGAffineTransform newtransform = CGAffineTransformConcat(matrix, [othermatrix matrix]);
  return [[[Ti2DMatrix alloc] initWithMatrix:newtransform] autorelease];
}

#define MAKE_PROP(x, y)            \
  -(void)set##x : (NSNumber *)_##y \
  {                                \
    matrix.y = [_##y floatValue];  \
  }                                \
                                   \
  -(NSNumber *)y                   \
  {                                \
    return @(matrix.y);            \
  }

MAKE_PROP(A, a)
MAKE_PROP(B, b)
MAKE_PROP(C, c)
MAKE_PROP(D, d)

- (void)setTx:(NSNumber *)value
{
  matrix.tx = TiDimensionFromObject(value).value;
}

- (NSNumber *)tx
{
  return [NSNumber numberWithFloat:convertDipToDefaultUnit(matrix.tx)];
}

- (void)setTy:(NSNumber *)value
{
  matrix.ty = TiDimensionFromObject(value).value;
}

- (NSNumber *)ty
{
  return [NSNumber numberWithFloat:convertDipToDefaultUnit(matrix.ty)];
}

- (id)description
{
  return @"[object Ti2DMatrix]";
}

@end
