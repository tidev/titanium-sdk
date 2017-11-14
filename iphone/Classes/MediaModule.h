/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import "KrollCallback.h"
#import "MediaPlayer/MediaPlayer.h"
#import "TiMediaAudioSession.h"
#import "TiMediaMusicPlayer.h"
#import "TiModule.h"
#import "TiViewProxy.h"

@interface MediaModule : TiModule <
                             UINavigationControllerDelegate,
#if defined(USE_TI_MEDIASHOWCAMERA) || defined(USE_TI_MEDIAOPENPHOTOGALLERY) || defined(USE_TI_MEDIASTARTVIDEOEDITING)
                             UIImagePickerControllerDelegate,
#endif
#ifdef USE_TI_MEDIAOPENMUSICLIBRARY
                             MPMediaPickerControllerDelegate,
#endif
#if defined(USE_TI_MEDIASHOWCAMERA) || defined(USE_TI_MEDIAOPENPHOTOGALLERY) || defined(USE_TI_MEDIASTARTVIDEOEDITING)
                             UIVideoEditorControllerDelegate,
#endif
                             UIPopoverControllerDelegate,
                             UIPopoverPresentationControllerDelegate> {
  @private
// Camera picker
#if defined(USE_TI_MEDIASHOWCAMERA) || defined(USE_TI_MEDIAOPENPHOTOGALLERY) || defined(USE_TI_MEDIASTARTVIDEOEDITING)
  UIImagePickerController *picker;
#endif
  BOOL autoHidePicker;
  BOOL saveToRoll;

// Music picker
#ifdef USE_TI_MEDIAOPENMUSICLIBRARY
  MPMediaPickerController *musicPicker;
#endif

  // Music players
  TiMediaMusicPlayer *systemMusicPlayer;
  TiMediaMusicPlayer *appMusicPlayer;

  // Shared picker bits; OK, since they're modal (and we can perform sanity checks for the necessary bits)
  BOOL animatedPicker;
  KrollCallback *pickerSuccessCallback;
  KrollCallback *pickerErrorCallback;
  KrollCallback *pickerCancelCallback;

  id popover;
  TiViewProxy *cameraView;

#if defined(USE_TI_MEDIASHOWCAMERA) || defined(USE_TI_MEDIAOPENPHOTOGALLERY) || defined(USE_TI_MEDIASTARTVIDEOEDITING)
  UIVideoEditorController *editor;
#endif
  KrollCallback *editorSuccessCallback;
  KrollCallback *editorErrorCallback;
  KrollCallback *editorCancelCallback;
  UIPopoverArrowDirection arrowDirection;
}

+ (NSDictionary *)itemProperties;
+ (NSDictionary *)filterableItemProperties;

@property (nonatomic, readwrite, retain) id popoverView;
@property (nonatomic, readonly) NSNumber *volume;
@property (nonatomic, readonly) NSNumber *peakMicrophonePower;
@property (nonatomic, readonly) NSNumber *averageMicrophonePower;
@property (nonatomic, readonly) NSDictionary *currentRoute;
@property (nonatomic, readonly) NSNumber *audioPlaying;
@property (nonatomic, readonly) NSNumber *isCameraSupported;
@property (nonatomic, readonly) NSNumber *cameraAuthorizationStatus;
@property (nonatomic, assign) NSNumber *audioSessionMode;
@property (nonatomic, assign) NSString *audioSessionCategory;

@property (nonatomic, readonly) TiMediaMusicPlayer *systemMusicPlayer;
@property (nonatomic, readonly) TiMediaMusicPlayer *appMusicPlayer;

@property (nonatomic, readonly) NSNumber *UNKNOWN_ERROR;
@property (nonatomic, readonly) NSNumber *DEVICE_BUSY;
@property (nonatomic, readonly) NSNumber *NO_CAMERA;
@property (nonatomic, readonly) NSNumber *NO_VIDEO;
@property (nonatomic, readonly) NSNumber *NO_MUSIC_PLAYER;

@property (nonatomic, readonly) NSNumber *VIDEO_CONTROL_DEFAULT;
@property (nonatomic, readonly) NSNumber *VIDEO_CONTROL_HIDDEN;

@property (nonatomic, readonly) NSNumber *VIDEO_SCALING_NONE;
@property (nonatomic, readonly) NSNumber *VIDEO_SCALING_ASPECT_FIT;
@property (nonatomic, readonly) NSNumber *VIDEO_SCALING_ASPECT_FILL;
@property (nonatomic, readonly) NSNumber *VIDEO_SCALING_MODE_FILL;

@property (nonatomic, readonly) NSNumber *QUALITY_HIGH;
@property (nonatomic, readonly) NSNumber *QUALITY_MEDIUM;
@property (nonatomic, readonly) NSNumber *QUALITY_LOW;
@property (nonatomic, readonly) NSNumber *QUALITY_640x480;
@property (nonatomic, readonly) NSNumber *QUALITY_IFRAME_1280x720;
@property (nonatomic, readonly) NSNumber *QUALITY_IFRAME_960x540;

@property (nonatomic, readonly) NSArray *availableCameraMediaTypes;
@property (nonatomic, readonly) NSArray *availablePhotoMediaTypes;
@property (nonatomic, readonly) NSArray *availablePhotoGalleryMediaTypes;

@property (nonatomic, readonly) NSNumber *CAMERA_FRONT;
@property (nonatomic, readonly) NSNumber *CAMERA_REAR;
@property (nonatomic, readonly) NSArray *availableCameras;

@property (nonatomic, readonly) NSNumber *CAMERA_FLASH_OFF;
@property (nonatomic, readonly) NSNumber *CAMERA_FLASH_AUTO;
@property (nonatomic, readonly) NSNumber *CAMERA_FLASH_ON;

@property (nonatomic, readonly) NSNumber *CAMERA_AUTHORIZATION_AUTHORIZED;
@property (nonatomic, readonly) NSNumber *CAMERA_AUTHORIZATION_DENIED;
@property (nonatomic, readonly) NSNumber *CAMERA_AUTHORIZATION_RESTRICTED;
@property (nonatomic, readonly) NSNumber *CAMERA_AUTHORIZATION_NOT_DETERMINED;

@property (nonatomic, readonly) NSString *MEDIA_TYPE_VIDEO;
@property (nonatomic, readonly) NSString *MEDIA_TYPE_PHOTO;
@property (nonatomic, readonly) NSString *MEDIA_TYPE_LIVEPHOTO;

@property (nonatomic, readonly) NSNumber *AUDIO_FORMAT_LINEAR_PCM;
@property (nonatomic, readonly) NSNumber *AUDIO_FORMAT_ULAW;
@property (nonatomic, readonly) NSNumber *AUDIO_FORMAT_ALAW;
@property (nonatomic, readonly) NSNumber *AUDIO_FORMAT_IMA4;
@property (nonatomic, readonly) NSNumber *AUDIO_FORMAT_ILBC;
@property (nonatomic, readonly) NSNumber *AUDIO_FORMAT_APPLE_LOSSLESS;
@property (nonatomic, readonly) NSNumber *AUDIO_FORMAT_AAC;

@property (nonatomic, readonly) NSNumber *AUDIO_FILEFORMAT_WAVE;
@property (nonatomic, readonly) NSNumber *AUDIO_FILEFORMAT_AIFF;
@property (nonatomic, readonly) NSNumber *AUDIO_FILEFORMAT_MP3;
@property (nonatomic, readonly) NSNumber *AUDIO_FILEFORMAT_MP4;
@property (nonatomic, readonly) NSNumber *AUDIO_FILEFORMAT_MP4A;
@property (nonatomic, readonly) NSNumber *AUDIO_FILEFORMAT_CAF;
@property (nonatomic, readonly) NSNumber *AUDIO_FILEFORMAT_3GPP;
@property (nonatomic, readonly) NSNumber *AUDIO_FILEFORMAT_3GP2;
@property (nonatomic, readonly) NSNumber *AUDIO_FILEFORMAT_AMR;

@property (nonatomic, readonly) NSString *AUDIO_SESSION_CATEGORY_AMBIENT;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_CATEGORY_SOLO_AMBIENT;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_CATEGORY_PLAYBACK;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_CATEGORY_RECORD;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_CATEGORY_PLAY_AND_RECORD;

@property (nonatomic, readonly) NSNumber *AUDIO_SESSION_OVERRIDE_ROUTE_NONE;
@property (nonatomic, readonly) NSNumber *AUDIO_SESSION_OVERRIDE_ROUTE_SPEAKER;

@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_TYPE_MUSIC;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_TYPE_PODCAST;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_TYPE_AUDIOBOOK;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_TYPE_ANY_AUDIO;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_TYPE_ALL;

@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_GROUP_TITLE;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_GROUP_ALBUM;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_GROUP_ARTIST;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_GROUP_ALBUM_ARTIST;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_GROUP_COMPOSER;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_GROUP_GENRE;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_GROUP_PLAYLIST;
@property (nonatomic, readonly) NSNumber *MUSIC_MEDIA_GROUP_PODCAST_TITLE;

@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_STATE_STOPPED;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_STATE_PLAYING;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_STATE_PAUSED;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_STATE_INTERRUPTED;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_STATE_SKEEK_FORWARD;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_STATE_SEEK_BACKWARD;

@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_REPEAT_DEFAULT;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_REPEAT_NONE;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_REPEAT_ONE;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_REPEAT_ALL;

@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_SHUFFLE_DEFAULT;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_SHUFFLE_NONE;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_SHUFFLE_SONGS;
@property (nonatomic, readonly) NSNumber *MUSIC_PLAYER_SHUFFLE_ALBUMS;

// NOTE: these are introduced in 3.2
@property (nonatomic, readonly) NSNumber *VIDEO_CONTROL_NONE; // No controls
@property (nonatomic, readonly) NSNumber *VIDEO_CONTROL_EMBEDDED; // Controls for an embedded view
@property (nonatomic, readonly) NSNumber *VIDEO_CONTROL_FULLSCREEN; // Controls for fullscreen playback

@property (nonatomic, readonly) NSNumber *VIDEO_MEDIA_TYPE_NONE;
@property (nonatomic, readonly) NSNumber *VIDEO_MEDIA_TYPE_VIDEO;
@property (nonatomic, readonly) NSNumber *VIDEO_MEDIA_TYPE_AUDIO;

@property (nonatomic, readonly) NSNumber *VIDEO_SOURCE_TYPE_UNKNOWN;
@property (nonatomic, readonly) NSNumber *VIDEO_SOURCE_TYPE_FILE;
@property (nonatomic, readonly) NSNumber *VIDEO_SOURCE_TYPE_STREAMING;

@property (nonatomic, readonly) NSNumber *VIDEO_PLAYBACK_STATE_STOPPED;
@property (nonatomic, readonly) NSNumber *VIDEO_PLAYBACK_STATE_PLAYING;
@property (nonatomic, readonly) NSNumber *VIDEO_PLAYBACK_STATE_PAUSED;
@property (nonatomic, readonly) NSNumber *VIDEO_PLAYBACK_STATE_INTERRUPTED;
@property (nonatomic, readonly) NSNumber *VIDEO_PLAYBACK_STATE_SEEKING_FORWARD;
@property (nonatomic, readonly) NSNumber *VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD;

@property (nonatomic, readonly) NSNumber *VIDEO_LOAD_STATE_UNKNOWN;
@property (nonatomic, readonly) NSNumber *VIDEO_LOAD_STATE_PLAYABLE;
@property (nonatomic, readonly) NSNumber *VIDEO_LOAD_STATE_PLAYTHROUGH_OK;
@property (nonatomic, readonly) NSNumber *VIDEO_LOAD_STATE_STALLED;

@property (nonatomic, readonly) NSNumber *VIDEO_REPEAT_MODE_NONE;
@property (nonatomic, readonly) NSNumber *VIDEO_REPEAT_MODE_ONE;

@property (nonatomic, readonly) NSNumber *VIDEO_TIME_OPTION_NEAREST_KEYFRAME;
@property (nonatomic, readonly) NSNumber *VIDEO_TIME_OPTION_EXACT;

@property (nonatomic, readonly) NSNumber *VIDEO_FINISH_REASON_PLAYBACK_ENDED;
@property (nonatomic, readonly) NSNumber *VIDEO_FINISH_REASON_PLAYBACK_ERROR;
@property (nonatomic, readonly) NSNumber *VIDEO_FINISH_REASON_USER_EXITED;

@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_LINEIN;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_BUILTINMIC;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_HEADSETMIC;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_LINEOUT;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_HEADPHONES;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_BLUETOOTHA2DP;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_BUILTINRECEIVER;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_BUILTINSPEAKER;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_HDMI;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_AIRPLAY;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_BLUETOOTHLE;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_BLUETOOTHHFP;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_USBAUDIO;
@property (nonatomic, readonly) NSString *AUDIO_SESSION_PORT_CARAUDIO;

@end

#endif
