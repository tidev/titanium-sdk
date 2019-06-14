/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSLIVEPHOTOVIEW
#import "TiUIiOSLivePhoto.h"
#import "TiUIiOSLivePhotoView.h"
#import <PhotosUI/PhotosUI.h>
#import <TitaniumKit/TiViewProxy.h>

@interface TiUIiOSLivePhotoViewProxy : TiViewProxy

/**
 *  Starts the playback of the live photo view.
 */
- (void)startPlaybackWithStyle:(id)args;

/**
 *  Stops the current playback of the live photo view.
 */
- (void)stopPlayback:(id)unused;

/**
 *  Mutes/unmutes the current playback.
 */
- (void)setMuted:(id)value;

/**
 *  Returns wheather or not the current playback is muted.
 */
- (NSNumber *)muted;

@end
#endif
