/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiModule.h"
#import "KrollCallback.h"
#import "TiMediaAudioSession.h"

@interface MediaModule : TiModule<UINavigationControllerDelegate,UIImagePickerControllerDelegate> {
@private
	UIImagePickerController *picker;
	BOOL animatedPicker;
	BOOL saveToRoll;
	BOOL autoHidePicker;
	KrollCallback *pickerSuccessCallback;
	KrollCallback *pickerErrorCallback;
	KrollCallback *pickerCancelCallback;
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	id popover;
#endif
}

@property(nonatomic,readonly) CGFloat volume;
@property(nonatomic,readonly) CGFloat peakMicrophonePower;
@property(nonatomic,readonly) CGFloat averageMicrophonePower;
@property(nonatomic,readonly) NSInteger audioLineType;
@property(nonatomic,readonly) BOOL audioPlaying;


@property(nonatomic,readonly) NSNumber* UNKNOWN_ERROR;
@property(nonatomic,readonly) NSNumber* DEVICE_BUSY;
@property(nonatomic,readonly) NSNumber* NO_CAMERA;
@property(nonatomic,readonly) NSNumber* NO_VIDEO;

// these have been deprecated in 3.2 but we map them to their new values
@property(nonatomic,readonly) NSNumber* VIDEO_CONTROL_DEFAULT;
@property(nonatomic,readonly) NSNumber* VIDEO_CONTROL_VOLUME_ONLY;
@property(nonatomic,readonly) NSNumber* VIDEO_CONTROL_HIDDEN;

@property(nonatomic,readonly) NSNumber* VIDEO_SCALING_NONE;
@property(nonatomic,readonly) NSNumber* VIDEO_SCALING_ASPECT_FIT;
@property(nonatomic,readonly) NSNumber* VIDEO_SCALING_ASPECT_FILL;
@property(nonatomic,readonly) NSNumber* VIDEO_SCALING_MODE_FILL;

@property(nonatomic,readonly) NSNumber* QUALITY_HIGH;
@property(nonatomic,readonly) NSNumber* QUALITY_MEDIUM;
@property(nonatomic,readonly) NSNumber* QUALITY_LOW;

@property(nonatomic,readonly) NSArray* availableCameraMediaTypes;
@property(nonatomic,readonly) NSArray* availablePhotoMediaTypes;
@property(nonatomic,readonly) NSArray* availablePhotoGalleryMediaTypes;

@property(nonatomic,readonly) NSString* MEDIA_TYPE_VIDEO;
@property(nonatomic,readonly) NSString* MEDIA_TYPE_PHOTO;

@property(nonatomic,readonly) NSNumber* AUDIO_HEADSET_INOUT;
@property(nonatomic,readonly) NSNumber* AUDIO_RECEIVER_AND_MIC;
@property(nonatomic,readonly) NSNumber* AUDIO_HEADPHONES_AND_MIC;
@property(nonatomic,readonly) NSNumber* AUDIO_LINEOUT;
@property(nonatomic,readonly) NSNumber* AUDIO_HEADPHONES;
@property(nonatomic,readonly) NSNumber* AUDIO_SPEAKER;
@property(nonatomic,readonly) NSNumber* AUDIO_MICROPHONE;
@property(nonatomic,readonly) NSNumber* AUDIO_MUTED;
@property(nonatomic,readonly) NSNumber* AUDIO_UNAVAILABLE;
@property(nonatomic,readonly) NSNumber* AUDIO_UNKNOWN;

@property(nonatomic,readonly) NSNumber* AUDIO_FORMAT_LINEAR_PCM;
@property(nonatomic,readonly) NSNumber* AUDIO_FORMAT_ULAW;
@property(nonatomic,readonly) NSNumber* AUDIO_FORMAT_ALAW;
@property(nonatomic,readonly) NSNumber* AUDIO_FORMAT_IMA4;
@property(nonatomic,readonly) NSNumber* AUDIO_FORMAT_ILBC;
@property(nonatomic,readonly) NSNumber* AUDIO_FORMAT_APPLE_LOSSLESS;
@property(nonatomic,readonly) NSNumber* AUDIO_FORMAT_AAC;

@property(nonatomic,readonly) NSNumber* AUDIO_FILEFORMAT_WAVE;
@property(nonatomic,readonly) NSNumber* AUDIO_FILEFORMAT_AIFF;
@property(nonatomic,readonly) NSNumber* AUDIO_FILEFORMAT_MP3;
@property(nonatomic,readonly) NSNumber* AUDIO_FILEFORMAT_MP4;
@property(nonatomic,readonly) NSNumber* AUDIO_FILEFORMAT_MP4A;
@property(nonatomic,readonly) NSNumber* AUDIO_FILEFORMAT_CAF;
@property(nonatomic,readonly) NSNumber* AUDIO_FILEFORMAT_3GPP;
@property(nonatomic,readonly) NSNumber* AUDIO_FILEFORMAT_3GP2;
@property(nonatomic,readonly) NSNumber* AUDIO_FILEFORMAT_AMR;

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

// NOTE: these are introduced in 3.2
@property(nonatomic,readonly) NSNumber* VIDEO_CONTROL_NONE;			// No controls
@property(nonatomic,readonly) NSNumber* VIDEO_CONTROL_EMBEDDED;		// Controls for an embedded view
@property(nonatomic,readonly) NSNumber* VIDEO_CONTROL_FULLSCREEN;	// Controls for fullscreen playback

@property(nonatomic,readonly) NSNumber* VIDEO_MEDIA_TYPE_NONE;
@property(nonatomic,readonly) NSNumber* VIDEO_MEDIA_TYPE_VIDEO;
@property(nonatomic,readonly) NSNumber* VIDEO_MEDIA_TYPE_AUDIO;

@property(nonatomic,readonly) NSNumber* VIDEO_SOURCE_TYPE_UNKNOWN;
@property(nonatomic,readonly) NSNumber* VIDEO_SOURCE_TYPE_FILE;
@property(nonatomic,readonly) NSNumber* VIDEO_SOURCE_TYPE_STREAMING;

#endif


@end
