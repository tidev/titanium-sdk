/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIMASKEDIMAGE

#import "TiUIMaskedImage.h"
#import <TitaniumKit/ImageLoader.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/Webcolor.h>

@implementation TiUIMaskedImage

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoSize];
  [self setDefaultWidth:TiDimensionAutoSize];
}
#endif

- (UIImage *)image
{
  id value = imageURL;
  TiProxy *ourProxy = [self proxy];

  if (value == nil) {
    value = [ourProxy valueForKey:@"image"];
  }
  return [TiUtils toImage:value proxy:ourProxy];
}

- (UIImage *)mask
{
  id value = maskURL;
  TiProxy *ourProxy = [self proxy];

  if (value == nil) {
    value = [ourProxy valueForKey:@"mask"];
  }
  return [TiUtils toImage:value proxy:ourProxy];
}

- (CGFloat)contentWidthForWidth:(CGFloat)value
{
  UIImage *image = [self image];
  if (image != nil) {
    return image.size.width;
  }
  return value;
}

- (CGFloat)contentHeightForWidth:(CGFloat)value
{
  UIImage *image = [self image];
  if (image != nil) {
    return image.size.height;
  }
  return value;
}

- (void)dealloc
{
  RELEASE_TO_NIL(maskURL)
  RELEASE_TO_NIL(imageURL);
  RELEASE_TO_NIL(tint);
  [super dealloc];
}

- (void)configurationSet
{
  [[self layer] setGeometryFlipped:YES];
}

- (void)setImage_:(id)newImage
{
  RELEASE_TO_NIL(imageURL);
  imageURL = [[TiUtils toURL:newImage proxy:self.proxy] retain]; //If this results in a nil, then it's a proxy.
  [self setNeedsDisplay];
}

- (void)setMask_:(id)newMask
{
  RELEASE_TO_NIL(maskURL);
  maskURL = [[TiUtils toURL:newMask proxy:self.proxy] retain];
  [self setNeedsDisplay];
}

- (void)setTint_:(id)tint_
{
  RELEASE_TO_NIL(tint);
  tint = [[[TiUtils colorValue:tint_] color] retain];
  [self setNeedsDisplay];
}

- (void)setMode_:(id)value
{
  mode = [TiUtils intValue:value];
  [self setNeedsDisplay];
}

- (void)setVisible_:(id)visible
{
  [super setVisible_:visible];
  if (![self isHidden]) {
    [self setNeedsDisplay];
  }
}

- (void)drawRect:(CGRect)rect
{
  if ([self isHidden]) {
    return;
  }

  CGContextRef ourContext = UIGraphicsGetCurrentContext();
  CGRect bounds = [self bounds];
  UIImage *mask = [self mask];

  if (mask != nil) {
    CGContextClearRect(ourContext, bounds);
    CGContextDrawImage(ourContext, bounds, [mask CGImage]);
  } else {
    CGContextSetGrayFillColor(ourContext, 1.0, 1.0);
    CGContextFillRect(ourContext, bounds);
  }

  CGContextSetBlendMode(ourContext, mode);

  UIImage *image = [self image];
  if (image != nil) {
    CGContextDrawImage(ourContext, bounds, [image CGImage]);
  }

  if (tint != nil) {
    CGContextSetFillColorWithColor(ourContext, [tint CGColor]);
    CGContextFillRect(ourContext, bounds);
  }
}

@end

#endif
