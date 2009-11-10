/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

@class TitaniumImageView;
@protocol TitaniumImageViewDelegate

@optional
- (void) imageView: (TitaniumImageView *)touchedImage touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event;

@end



@interface TitaniumImageView : UIImageView
{
	NSObject<TitaniumImageViewDelegate>	* delegate;
}
@property(nonatomic,readwrite,assign)	NSObject<TitaniumImageViewDelegate> * delegate;

@end

@class TitaniumBlobWrapper;
@interface TitaniumImageViewController : TitaniumContentViewController<UIScrollViewDelegate,TitaniumImageViewDelegate> {
	TitaniumImageView * imageView;
	UIScrollView * scrollView;

	TitaniumBlobWrapper * singleImageBlob;

	CGSize imageSize;
	BOOL scrollEnabled;
	BOOL dirtyImage;
//	NSArray * animatedImageUrls;
}
@property(nonatomic,readwrite,retain)	TitaniumBlobWrapper * singleImageBlob;
- (void) setUrl: (NSURL *) newUrl;
- (UIImage *) singleImage;

@end
