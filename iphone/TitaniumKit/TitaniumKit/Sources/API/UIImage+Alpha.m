// UIImage+Alpha.m
// Created by Trevor Harmon on 9/20/09.
// Free for personal or commercial use, with or without modification.
// No warranty is expressed or implied.

#import "UIImage+Alpha.h"

@implementation UIImageAlpha

// Returns true if the image has an alpha layer
+ (BOOL)hasAlpha:(UIImage *)image
{
  CGImageAlphaInfo alpha = CGImageGetAlphaInfo(image.CGImage);
  return (alpha == kCGImageAlphaFirst || alpha == kCGImageAlphaLast || alpha == kCGImageAlphaPremultipliedFirst || alpha == kCGImageAlphaPremultipliedLast);
}

// Returns a "normalized" image form an existing image with alpha
// This uses a known good color space/alpha bitmapInfo combination
// We often use 8-bit PNGs with alpha channel that are kCGImageAlphaLast
// which causes CGBitmapContextCreate calls to return NULL
// see https://github.com/kean/Nuke/issues/35
// (or set environmnet variable CGBITMAP_CONTEXT_LOG_ERRORS to '1' to have table of valid combinatiosn spit out)
+ (UIImage *)normalize:(UIImage *)image
{
  CGFloat scale = MAX(image.scale, 1.0f);
  CGSize size = CGSizeMake(round(image.size.width * scale), round(image.size.height * scale));
  CGColorSpaceRef genericColorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef thumbBitmapCtxt = CGBitmapContextCreate(NULL,
      size.width,
      size.height,
      8, // bits per component
      (4 * size.width), // bytes per row
      genericColorSpace,
      kCGImageAlphaPremultipliedFirst);
  CGColorSpaceRelease(genericColorSpace);
  CGContextSetInterpolationQuality(thumbBitmapCtxt, kCGInterpolationDefault);
  CGRect destRect = CGRectMake(0, 0, size.width, size.height);
  CGContextDrawImage(thumbBitmapCtxt, destRect, image.CGImage);
  CGImageRef tmpThumbImage = CGBitmapContextCreateImage(thumbBitmapCtxt);
  CGContextRelease(thumbBitmapCtxt);
  UIImage *result = [UIImage imageWithCGImage:tmpThumbImage scale:scale orientation:UIImageOrientationUp];
  CGImageRelease(tmpThumbImage);

  return result;
}

// Returns a copy of the given image, adding an alpha channel if it doesn't already have one
+ (UIImage *)imageWithAlpha:(UIImage *)image
{
  if ([UIImageAlpha hasAlpha:image]) {
    return [UIImageAlpha normalize:image];
  }

  CGFloat scale = MAX(image.scale, 1.0f);
  CGImageRef imageRef = image.CGImage;
  size_t width = CGImageGetWidth(imageRef) * scale;
  size_t height = CGImageGetHeight(imageRef) * scale;

  // The bitsPerComponent and bitmapInfo values are hard-coded to prevent an "unsupported parameter combination" error
  CGContextRef offscreenContext = CGBitmapContextCreate(NULL,
      width,
      height,
      8,
      0,
      CGImageGetColorSpace(imageRef),
      kCGBitmapByteOrderDefault | kCGImageAlphaPremultipliedFirst);

  // Draw the image into the context and retrieve the new image, which will now have an alpha layer
  CGContextDrawImage(offscreenContext, CGRectMake(0, 0, width, height), imageRef);
  CGImageRef imageRefWithAlpha = CGBitmapContextCreateImage(offscreenContext);
  UIImage *imageWithAlpha = [UIImage imageWithCGImage:imageRefWithAlpha scale:image.scale orientation:UIImageOrientationUp];

  // Clean up
  CGContextRelease(offscreenContext);
  CGImageRelease(imageRefWithAlpha);

  return imageWithAlpha;
}

// Creates a mask that makes the outer edges transparent and everything else opaque
// The size must include the entire mask (opaque part + transparent border)
// The caller is responsible for releasing the returned reference by calling CGImageRelease
+ (CGImageRef)newBorderMask:(NSUInteger)borderSize size:(CGSize)size
{
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceGray();

  // Build a context that's the same dimensions as the new size
  CGContextRef maskContext = CGBitmapContextCreate(NULL,
      size.width,
      size.height,
      8, // 8-bit grayscale
      0,
      colorSpace,
      kCGBitmapByteOrderDefault | kCGImageAlphaNone);

  // Start with a mask that's entirely transparent
  CGContextSetFillColorWithColor(maskContext, [UIColor blackColor].CGColor);
  CGContextFillRect(maskContext, CGRectMake(0, 0, size.width, size.height));

  // Make the inner part (within the border) opaque
  CGContextSetFillColorWithColor(maskContext, [UIColor whiteColor].CGColor);
  CGContextFillRect(maskContext, CGRectMake(borderSize, borderSize, size.width - borderSize * 2, size.height - borderSize * 2));

  // Get an image of the context
  CGImageRef maskImageRef = CGBitmapContextCreateImage(maskContext);

  // Clean up
  CGContextRelease(maskContext);
  CGColorSpaceRelease(colorSpace);

  return maskImageRef;
}

// Returns a copy of the image with a transparent border of the given size added around its edges.
// If the image has no alpha layer, one will be added to it.
+ (UIImage *)transparentBorderImage:(NSUInteger)borderSize image:(UIImage *)image_
{
  // If the image does not have an alpha layer, add one
  UIImage *image = [UIImageAlpha imageWithAlpha:image_];
  CGFloat scale = MAX(image.scale, 1.0f);
  NSUInteger scaledBorderSize = borderSize * scale;
  CGRect newRect = CGRectMake(0, 0, image.size.width * scale + scaledBorderSize * 2, image.size.height * scale + scaledBorderSize * 2);

  // Build a context that's the same dimensions as the new size
  CGContextRef bitmap = CGBitmapContextCreate(NULL,
      newRect.size.width,
      newRect.size.height,
      CGImageGetBitsPerComponent(image.CGImage),
      0, // calculate automatically
      CGImageGetColorSpace(image.CGImage),
      CGImageGetBitmapInfo(image.CGImage));

  // Draw the image in the center of the context, leaving a gap around the edges
  CGRect imageLocation = CGRectMake(scaledBorderSize, scaledBorderSize, image.size.width * scale, image.size.height * scale);
  CGContextDrawImage(bitmap, imageLocation, image.CGImage);
  CGImageRef borderImageRef = CGBitmapContextCreateImage(bitmap);

  // Create a mask to make the border transparent, and combine it with the image
  CGImageRef maskImageRef = [UIImageAlpha newBorderMask:scaledBorderSize size:newRect.size];
  if ((maskImageRef == NULL) || (borderImageRef == NULL)) {
    CGContextRelease(bitmap);
    CGImageRelease(maskImageRef);
    CGImageRelease(borderImageRef);
    return nil;
  }
  CGImageRef transparentBorderImageRef = CGImageCreateWithMask(borderImageRef, maskImageRef);
  UIImage *transparentBorderImage = [UIImage imageWithCGImage:transparentBorderImageRef scale:image.scale orientation:UIImageOrientationUp];

  // Clean up
  CGContextRelease(bitmap);
  CGImageRelease(borderImageRef);
  CGImageRelease(maskImageRef);
  CGImageRelease(transparentBorderImageRef);

  return transparentBorderImage;
}

@end
