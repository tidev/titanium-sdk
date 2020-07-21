/**
* Appcelerator Titanium Mobile
* Copyright (c) 2020-Present by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/

#import "UIImage+Compare.h"

typedef union {
  uint32_t raw;
  unsigned char bytes[4];
  struct {
    char red;
    char green;
    char blue;
    char alpha;
  } __attribute__((packed)) pixels;
} ImagePixel;

@implementation UIImage (Compare)

- (BOOL)compareWithImage:(UIImage *)image tolerance:(CGFloat)tolerance
{
  // Copied from https://github.com/facebookarchive/ios-snapshot-test-case/blob/master/FBSnapshotTestCase/Categories/UIImage%2BCompare.m
  if (CGSizeEqualToSize(self.size, image.size) == NO) {
    return NO;
  }

  CGSize referenceImageSize = CGSizeMake(CGImageGetWidth(self.CGImage), CGImageGetHeight(self.CGImage));
  CGSize imageSize = CGSizeMake(CGImageGetWidth(image.CGImage), CGImageGetHeight(image.CGImage));

  // The images have the equal size, so we could use the smallest amount of bytes because of byte padding
  size_t minBytesPerRow = MIN(CGImageGetBytesPerRow(self.CGImage), CGImageGetBytesPerRow(image.CGImage));
  size_t referenceImageSizeBytes = referenceImageSize.height * minBytesPerRow;
  void *referenceImagePixels = calloc(1, referenceImageSizeBytes);
  void *imagePixels = calloc(1, referenceImageSizeBytes);

  if (!referenceImagePixels || !imagePixels) {
    free(referenceImagePixels);
    free(imagePixels);
    return NO;
  }

  CGContextRef referenceImageContext = CGBitmapContextCreate(referenceImagePixels,
      referenceImageSize.width,
      referenceImageSize.height,
      CGImageGetBitsPerComponent(self.CGImage),
      minBytesPerRow,
      CGImageGetColorSpace(self.CGImage),
      (CGBitmapInfo)kCGImageAlphaPremultipliedLast);
  CGContextRef imageContext = CGBitmapContextCreate(imagePixels,
      imageSize.width,
      imageSize.height,
      CGImageGetBitsPerComponent(image.CGImage),
      minBytesPerRow,
      CGImageGetColorSpace(image.CGImage),
      (CGBitmapInfo)kCGImageAlphaPremultipliedLast);

  if (!referenceImageContext || !imageContext) {
    CGContextRelease(referenceImageContext);
    CGContextRelease(imageContext);
    free(referenceImagePixels);
    free(imagePixels);
    return NO;
  }

  CGContextDrawImage(referenceImageContext, CGRectMake(0, 0, referenceImageSize.width, referenceImageSize.height), self.CGImage);
  CGContextDrawImage(imageContext, CGRectMake(0, 0, imageSize.width, imageSize.height), image.CGImage);

  CGContextRelease(referenceImageContext);
  CGContextRelease(imageContext);

  BOOL imageEqual = YES;

  if (tolerance == 0) {
    // Do a fast compare if we can
    imageEqual = (memcmp(referenceImagePixels, imagePixels, referenceImageSizeBytes) == 0);
  } else {
    // Go through each pixel in turn and see if it is different
    const NSInteger pixelCount = referenceImageSize.width * referenceImageSize.height;

    ImagePixel *p1 = referenceImagePixels;
    ImagePixel *p2 = imagePixels;

    NSInteger numDiffPixels = 0;
    for (int n = 0; n < pixelCount; ++n) {
      // If this pixel is different, increment the pixel diff count and see
      // if we have hit our limit.
      if (p1->raw != p2->raw) {
        numDiffPixels++;

        CGFloat percent = (CGFloat)numDiffPixels / pixelCount;
        if (percent > tolerance) {
          imageEqual = NO;
          break;
        }
      }

      p1++;
      p2++;
    }
  }

  free(referenceImagePixels);
  free(imagePixels);

  return imageEqual;
}

@end
