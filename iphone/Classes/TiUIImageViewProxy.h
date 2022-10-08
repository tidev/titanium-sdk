/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIMAGEVIEW

#import <TitaniumKit/ImageLoader.h>
#import <TitaniumKit/TiViewProxy.h>

@interface TiUIImageViewProxy : TiViewProxy <ImageLoaderDelegate> {
  ImageLoaderRequest *urlRequest;
  NSURL *imageURL;
}

@property (nonatomic, retain) NSURL *imageURL;

- (void)cancelPendingImageLoads;
- (void)startImageLoad:(NSURL *)url;
- (void)propagateLoadEvent:(NSString *)stateString;

@end

#endif
