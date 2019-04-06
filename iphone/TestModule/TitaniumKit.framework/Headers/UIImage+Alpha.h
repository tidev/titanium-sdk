// UIImage+Alpha.h
// Created by Trevor Harmon on 9/20/09.
// Free for personal or commercial use, with or without modification.
// No warranty is expressed or implied.

// NOTE: Appcelerator modified to convert from Category to
// new Class name since iPhone seems to have some issues with Categories
// of built in Classes

// Helper methods for adding an alpha layer to an image

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface UIImageAlpha : NSObject

+ (BOOL)hasAlpha:(UIImage *)image;
+ (UIImage *)normalize:(UIImage *)image;
+ (UIImage *)imageWithAlpha:(UIImage *)image;
+ (UIImage *)transparentBorderImage:(NSUInteger)borderSize image:(UIImage *)image;
+ (CGImageRef)newBorderMask:(NSUInteger)borderSize size:(CGSize)size;

@end
