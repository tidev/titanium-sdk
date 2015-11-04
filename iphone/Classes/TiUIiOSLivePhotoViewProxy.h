/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiViewProxy.h"
#import "TiUIiOSLivePhoto.h"
#import "TiUIiOSLivePhotoView.h"
#import <PhotosUI/PhotosUI.h>

@interface TiUIiOSLivePhotoViewProxy : TiViewProxy {}

-(void)startPlaybackWithStyle:(id)style;
-(void)stopPlayback;

@end
