/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITABLEVIEW) || defined(USE_TI_UILISTVIEW)

#import "TiSelectedCellbackgroundView.h"
#import <TitaniumKit/TiUtils.h>
static void addRoundedRectToPath(CGContextRef context, CGRect rect,
    float ovalWidth, float ovalHeight)

{
  float fw, fh;

  if (ovalWidth == 0 || ovalHeight == 0) { // 1
    CGContextAddRect(context, rect);
    return;
  }

  CGContextSaveGState(context); // 2

  CGContextTranslateCTM(context, CGRectGetMinX(rect), // 3
      CGRectGetMinY(rect));
  CGContextScaleCTM(context, ovalWidth, ovalHeight); // 4
  fw = CGRectGetWidth(rect) / ovalWidth; // 5
  fh = CGRectGetHeight(rect) / ovalHeight; // 6

  CGContextMoveToPoint(context, fw, fh / 2); // 7
  CGContextAddArcToPoint(context, fw, fh, fw / 2, fh, 1); // 8
  CGContextAddArcToPoint(context, 0, fh, 0, fh / 2, 1); // 9
  CGContextAddArcToPoint(context, 0, 0, fw / 2, 0, 1); // 10
  CGContextAddArcToPoint(context, fw, 0, fw, fh / 2, 1); // 11
  CGContextClosePath(context); // 12

  CGContextRestoreGState(context); // 13
}

#define ROUND_SIZE 10

@implementation TiSelectedCellBackgroundView

@synthesize position, fillColor, grouped;

- (id)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.fillColor = [UIColor clearColor];
    position = TiCellBackgroundViewPositionMiddle;
  }
  return self;
}

- (void)dealloc
{
  [fillColor release];
  [super dealloc];
}

- (BOOL)isOpaque
{
  return (CGColorGetAlpha([fillColor CGColor]) == 1.0);
}

- (void)drawRect:(CGRect)rect
{
  CGContextRef ctx = UIGraphicsGetCurrentContext();

  CGContextSetFillColorWithColor(ctx, [fillColor CGColor]);
  CGContextSetStrokeColorWithColor(ctx, [fillColor CGColor]);
  CGContextSetLineWidth(ctx, 2);

  if (grouped && position == TiCellBackgroundViewPositionTop) {
    CGFloat minx = CGRectGetMinX(rect), midx = CGRectGetMidX(rect), maxx = CGRectGetMaxX(rect);
    CGFloat miny = CGRectGetMinY(rect), maxy = CGRectGetMaxY(rect);

    CGContextMoveToPoint(ctx, minx, maxy);
    CGContextAddArcToPoint(ctx, minx, miny, midx, miny, ROUND_SIZE);
    CGContextAddArcToPoint(ctx, maxx, miny, maxx, maxy, ROUND_SIZE);
    CGContextAddLineToPoint(ctx, maxx, maxy);

    // Close the path
    CGContextClosePath(ctx);
    CGContextSaveGState(ctx);
    CGContextDrawPath(ctx, kCGPathFill);
    return;
  } else if (grouped && position == TiCellBackgroundViewPositionBottom) {
    CGFloat minx = CGRectGetMinX(rect), midx = CGRectGetMidX(rect), maxx = CGRectGetMaxX(rect);
    CGFloat miny = CGRectGetMinY(rect), maxy = CGRectGetMaxY(rect);

    CGContextMoveToPoint(ctx, minx, miny);
    CGContextAddArcToPoint(ctx, minx, maxy, midx, maxy, ROUND_SIZE);
    CGContextAddArcToPoint(ctx, maxx, maxy, maxx, miny, ROUND_SIZE);
    CGContextAddLineToPoint(ctx, maxx, miny);
    CGContextClosePath(ctx);
    CGContextSaveGState(ctx);
    CGContextDrawPath(ctx, kCGPathFill);
    return;
  } else if (!grouped || position == TiCellBackgroundViewPositionMiddle) {
    CGFloat minx = CGRectGetMinX(rect), maxx = CGRectGetMaxX(rect);
    CGFloat miny = CGRectGetMinY(rect), maxy = CGRectGetMaxY(rect);
    CGContextMoveToPoint(ctx, minx, miny);
    CGContextAddLineToPoint(ctx, maxx, miny);
    CGContextAddLineToPoint(ctx, maxx, maxy);
    CGContextAddLineToPoint(ctx, minx, maxy);
    CGContextClosePath(ctx);
    CGContextSaveGState(ctx);
    CGContextDrawPath(ctx, kCGPathFill);
    return;
  } else if (grouped && position == TiCellBackgroundViewPositionSingleLine) {
    CGContextBeginPath(ctx);
    addRoundedRectToPath(ctx, rect, ROUND_SIZE * 1.5, ROUND_SIZE * 1.5);
    CGContextFillPath(ctx);

    CGContextSetLineWidth(ctx, 2);
    CGContextBeginPath(ctx);
    addRoundedRectToPath(ctx, rect, ROUND_SIZE * 1.5, ROUND_SIZE * 1.5);
    CGContextStrokePath(ctx);

    return;
  }
  [super drawRect:rect];
}

- (void)setPosition:(TiCellBackgroundViewPosition)inPosition
{
  [self setNeedsDisplay];
}

@end

#endif
