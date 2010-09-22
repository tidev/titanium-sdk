/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIMAGEVIEW

#import "TiViewProxy.h"
#import "ImageLoader.h"

@interface TiUIImageViewProxy : TiViewProxy<ImageLoaderDelegate> {
	ImageLoaderRequest *urlRequest;

}

-(void)cancelPendingImageLoads;
-(void)startImageLoad:(NSURL *)url;

@end

#endif