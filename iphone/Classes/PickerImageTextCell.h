/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

@interface PickerImageTextCell : UIView {
	UIImageView * imageView;
	UILabel * textLabel;
}

@property(nonatomic,readwrite,retain)	UIImageView * imageView;
@property(nonatomic,readwrite,retain)	UILabel * textLabel;

@end
