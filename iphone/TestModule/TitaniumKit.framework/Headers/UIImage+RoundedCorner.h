// UIImage+RoundedCorner.h
// Created by Trevor Harmon on 9/20/09.
// Free for personal or commercial use, with or without modification.
// No warranty is expressed or implied.

// NOTE: Appcelerator modified to convert from Category to
// new Class name since iPhone seems to have some issues with Categories
// of built in Classes

@interface UIImageRoundedCorner : NSObject {
}
+ (UIImage *)roundedCornerImage:(NSInteger)cornerSize borderSize:(NSInteger)borderSize image:(UIImage *)image;
@end
