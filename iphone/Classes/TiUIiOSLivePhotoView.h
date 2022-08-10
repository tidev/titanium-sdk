/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSLIVEPHOTOVIEW
#import "TiUIiOSLivePhoto.h"
#import <PhotosUI/PhotosUI.h>
#import <TitaniumKit/TiUIView.h>

@interface TiUIiOSLivePhotoView : TiUIView <PHLivePhotoViewDelegate> {
  TiDimension width;
  TiDimension height;
  CGFloat autoHeight;
  CGFloat autoWidth;
}

@property (nonatomic, retain) PHLivePhotoView *livePhotoView;

@end
#endif
