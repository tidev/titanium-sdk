/**
* Appcelerator Titanium Mobile
* Copyright (c) 2020-Present by Appcelerator, Inc. All Rights Reserved.
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface UIImage (Compare)

- (BOOL)compareWithImage:(UIImage *)image tolerance:(CGFloat)tolerance;

@end

NS_ASSUME_NONNULL_END
