/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import "MediaModule.h"
#import "TiUtils.h"
#import "TiBlob.h"
#import "TiFile.h"
#import "TiApp.h"
#import "Mimetypes.h"
#import "TiViewProxy.h"
#import "Ti2DMatrix.h"
#import "SCListener.h"
#import "TiMediaAudioSession.h"
#import "TiMediaMusicPlayer.h"
#import "TiMediaItem.h"

#import <AudioToolbox/AudioToolbox.h>
#import <AVFoundation/AVAudioPlayer.h>
#import <AVFoundation/AVAudioSession.h>
#import <MediaPlayer/MediaPlayer.h>
#import <MobileCoreServices/UTCoreTypes.h>
#import <QuartzCore/QuartzCore.h>

// by default, we want to make the camera fullscreen and 
// these transform values will scale it when we have our own overlay
#define CAMERA_TRANSFORM_X 1
#define CAMERA_TRANSFORM_Y 1.12412

enum  
{
	MediaModuleErrorUnknown,
	MediaModuleErrorBusy,
	MediaModuleErrorNoCamera,
	MediaModuleErrorNoVideo,
	MediaModuleErrorNoMusicPlayer
};

@implementation MediaModule

#pragma mark Internal

-(void)destroyPicker
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	RELEASE_TO_NIL(popover);
#endif
	RELEASE_TO_NIL(musicPicker);
	RELEASE_TO_NIL(picker);
	RELEASE_TO_NIL(pickerSuccessCallback);
	RELEASE_TO_NIL(pickerErrorCallback);
	RELEASE_TO_NIL(pickerCancelCallback);
}

-(void)dealloc
{
	[self destroyPicker];
	RELEASE_TO_NIL(systemMusicPlayer);
	RELEASE_TO_NIL(appMusicPlayer);
	[super dealloc];
}

-(void)dispatchCallback:(NSArray*)args
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	NSString *type = [args objectAtIndex:0];
	id object = [args objectAtIndex:1];
	id listener = [args objectAtIndex:2];
	// we have to give our modal picker view time to 
	// dismiss with animation or if you do anything in a callback that 
	// attempt to also touch a modal controller, you'll get into deep doodoo
	// wait for the picker to dismiss with animation
	[NSThread sleepForTimeInterval:0.5];
	[self _fireEventToListener:type withObject:object listener:listener thisObject:nil];
	[pool release];
}

-(void)sendPickerError:(int)code
{
	id listener = [[pickerErrorCallback retain] autorelease];
	[self destroyPicker];
	if (listener!=nil)
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(false),@"success",NUMINT(code),@"code",nil];
		[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"error",event,listener,nil]];
	}
}

-(void)sendPickerCancel
{
	id listener = [[pickerCancelCallback retain] autorelease];
	[self destroyPicker];
	if (listener!=nil)
	{
		[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"cancel",[NSDictionary dictionary],listener,nil]];
	}
}

-(void)sendPickerSuccess:(id)event
{
	id listener = [[pickerSuccessCallback retain] autorelease];
	if (autoHidePicker)
	{
		[self destroyPicker];
	}
	if (listener!=nil)
	{
		[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"success",event,listener,nil]];
	}
}

-(void)commonPickerSetup:(NSDictionary*)args
{
	if (args!=nil) {
		pickerSuccessCallback = [args objectForKey:@"success"];
		ENSURE_TYPE_OR_NIL(pickerSuccessCallback,KrollCallback);
		[pickerSuccessCallback retain];
		
		pickerErrorCallback = [args objectForKey:@"error"];
		ENSURE_TYPE_OR_NIL(pickerErrorCallback,KrollCallback);
		[pickerErrorCallback retain];
		
		pickerCancelCallback = [args objectForKey:@"cancel"];
		ENSURE_TYPE_OR_NIL(pickerCancelCallback,KrollCallback);
		[pickerCancelCallback retain];
		
		// we use this to determine if we should hide the camera after taking 
		// a picture/video -- you can programmatically take multiple pictures
		// and use your own controls so this allows you to control that
		// (similarly for ipod library picking)
		autoHidePicker = [TiUtils boolValue:@"autohide" properties:args def:YES];
		
		animatedPicker = [TiUtils boolValue:@"animated" properties:args def:YES];
	}
}

-(void)displayModalPicker:(UIViewController*)picker_ settings:(NSDictionary*)args
{
	TiApp * tiApp = [TiApp app];
	if ([TiUtils isIPad]==NO)
	{
		[[tiApp controller] manuallyRotateToOrientation:UIInterfaceOrientationPortrait];
		[tiApp showModalController:picker_ animated:animatedPicker];
	}
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	else
	{
		RELEASE_TO_NIL(popover);
		UIView *poView = [tiApp controller].view;
		TiViewProxy* popoverViewProxy = [args objectForKey:@"popoverView"];
		if (popoverViewProxy!=nil)
		{
			poView = [popoverViewProxy view];
		}
		UIPopoverArrowDirection arrow = [TiUtils intValue:@"arrowDirection" properties:args def:UIPopoverArrowDirectionAny];
		popover = [[UIPopoverController alloc] initWithContentViewController:picker_];
		[popover presentPopoverFromRect:poView.frame inView:poView permittedArrowDirections:arrow animated:animatedPicker];
	}
#endif
}

-(void)closeModalPicker:(UIViewController*)picker_
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	if ([TiUtils isIPad]==YES)
	{
		[(UIPopoverController*)popover dismissPopoverAnimated:animatedPicker];
	}
	else
	{
#endif
		[[TiApp app] hideModalController:picker_ animated:animatedPicker];
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	}
#endif	
}

-(void)showPicker:(NSDictionary*)args isCamera:(BOOL)isCamera
{
	if (picker!=nil)
	{
		[self sendPickerError:MediaModuleErrorBusy];
		return;
	}
	
	picker = [[UIImagePickerController alloc] init];
	[picker setDelegate:self];
	
	animatedPicker = YES;
	saveToRoll = NO;
	
	if (args!=nil)
	{
		[self commonPickerSetup:args];
		
		NSNumber * imageEditingObject = [args objectForKey:@"allowImageEditing"];  //backwards compatible
		saveToRoll = [TiUtils boolValue:@"saveToPhotoGallery" properties:args def:NO];
		
		if (imageEditingObject==nil)
		{
			imageEditingObject = [args objectForKey:@"allowEditing"];
		}
		
		// introduced in 3.1
		[picker setAllowsEditing:[TiUtils boolValue:imageEditingObject]];
		
		NSArray *sourceTypes = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
		id types = [args objectForKey:@"mediaTypes"];
		
		BOOL movieRequired = NO;
		BOOL imageRequired = NO;
		
		if ([types isKindOfClass:[NSArray class]])
		{
			for (int c=0;c<[types count];c++)
			{
				if ([[types objectAtIndex:c] isEqualToString:(NSString*)kUTTypeMovie])
				{
					movieRequired = YES;
				}
				else if ([[types objectAtIndex:c] isEqualToString:(NSString*)kUTTypeImage])
				{
					imageRequired = YES;
				}
			}
			picker.mediaTypes = [NSArray arrayWithArray:types];
		}
		else if ([types isKindOfClass:[NSString class]])
		{
			if ([types isEqualToString:(NSString*)kUTTypeMovie] && ![sourceTypes containsObject:(NSString *)kUTTypeMovie])
			{
				// no movie type supported...
				[self sendPickerError:MediaModuleErrorNoVideo];
				return;
			}
			picker.mediaTypes = [NSArray arrayWithObject:types];
		}
		
		
		// if we require movie but not image and we don't support movie, bail...
		if (movieRequired == YES && imageRequired == NO && ![sourceTypes containsObject:(NSString *)kUTTypeMovie])
		{
			// no movie type supported...
			[self sendPickerError:MediaModuleErrorNoCamera];
			return ;
		}
		
		// introduced in 3.1
		id videoMaximumDuration = [args objectForKey:@"videoMaximumDuration"];
		if ([videoMaximumDuration respondsToSelector:@selector(doubleValue)] && [picker respondsToSelector:@selector(setVideoMaximumDuration:)])
		{
			[picker setVideoMaximumDuration:[videoMaximumDuration doubleValue]/1000];
		}
		id videoQuality = [args objectForKey:@"videoQuality"];
		if ([videoQuality respondsToSelector:@selector(doubleValue)] && [picker respondsToSelector:@selector(setVideoQuality:)])
		{
			[picker setVideoQuality:[videoQuality doubleValue]];
		}
	}
	
	// do this afterwards above so we can first check for video support
	
	UIImagePickerControllerSourceType ourSource = (isCamera ? UIImagePickerControllerSourceTypeCamera : UIImagePickerControllerSourceTypePhotoLibrary);
	if (![UIImagePickerController isSourceTypeAvailable:ourSource])
	{
		[self sendPickerError:MediaModuleErrorNoCamera];
		return;
	}
	[picker setSourceType:ourSource];

	// this must be done after we set the source type or you'll get an exception
	if (isCamera && ourSource == UIImagePickerControllerSourceTypeCamera)
	{
		// turn on/off camera controls - nice to turn off when you want to have your own UI
		[picker setShowsCameraControls:[TiUtils boolValue:@"showControls" properties:args def:YES]];
		
		// allow an overlay view
		TiViewProxy *cameraView = [args objectForKey:@"overlay"]; 
		if (cameraView!=nil)
		{
			ENSURE_TYPE(cameraView,TiViewProxy);
			UIView *view = [cameraView view];
			[TiUtils setView:view positionRect:[picker view].bounds];
			[cameraView layoutChildren:NO];
			[picker setCameraOverlayView:view];
			[picker setWantsFullScreenLayout:YES];
		}
		
		// allow a transform on the preview image
		id transform = [args objectForKey:@"transform"];
		if (transform!=nil)
		{
			ENSURE_TYPE(transform,Ti2DMatrix);
			[picker setCameraViewTransform:[transform matrix]];
		}
		else
		{
			// we use our own fullscreen transform if the developer didn't supply one
			picker.cameraViewTransform = CGAffineTransformScale(picker.cameraViewTransform, CAMERA_TRANSFORM_X, CAMERA_TRANSFORM_Y);
		}
	}
	
	[self displayModalPicker:picker settings:args];
}

#pragma mark Public APIs

MAKE_SYSTEM_PROP(UNKNOWN_ERROR,MediaModuleErrorUnknown);
MAKE_SYSTEM_PROP(DEVICE_BUSY,MediaModuleErrorBusy);
MAKE_SYSTEM_PROP(NO_CAMERA,MediaModuleErrorNoCamera);
MAKE_SYSTEM_PROP(NO_VIDEO,MediaModuleErrorNoVideo);
MAKE_SYSTEM_PROP(NO_MUSIC_PLAYER,MediaModuleErrorNoMusicPlayer);


// >=3.2 dependent value; this one isn't deprecated
-(NSNumber*)VIDEO_CONTROL_DEFAULT
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	if ([TiUtils isiPhoneOS3_2OrGreater]) {
		return NUMINT(MPMovieControlStyleDefault);
	}
	else {
#endif
		return NUMINT(MPMovieControlModeDefault);
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	}
#endif
}

// these have been deprecated in 3.2 but we need them for older devices
MAKE_SYSTEM_PROP(VIDEO_CONTROL_VOLUME_ONLY,MPMovieControlModeVolumeOnly);
MAKE_SYSTEM_PROP(VIDEO_CONTROL_HIDDEN,MPMovieControlModeHidden);

MAKE_SYSTEM_PROP(VIDEO_SCALING_NONE,MPMovieScalingModeNone);
MAKE_SYSTEM_PROP(VIDEO_SCALING_ASPECT_FIT,MPMovieScalingModeAspectFit);
MAKE_SYSTEM_PROP(VIDEO_SCALING_ASPECT_FILL,MPMovieScalingModeAspectFill);
MAKE_SYSTEM_PROP(VIDEO_SCALING_MODE_FILL,MPMovieScalingModeFill);

MAKE_SYSTEM_STR(MEDIA_TYPE_VIDEO,kUTTypeMovie);
MAKE_SYSTEM_STR(MEDIA_TYPE_PHOTO,kUTTypeImage);

MAKE_SYSTEM_PROP(QUALITY_HIGH,UIImagePickerControllerQualityTypeHigh);
MAKE_SYSTEM_PROP(QUALITY_MEDIUM,UIImagePickerControllerQualityTypeMedium);
MAKE_SYSTEM_PROP(QUALITY_LOW,UIImagePickerControllerQualityTypeLow);

MAKE_SYSTEM_PROP(AUDIO_HEADPHONES,TiMediaAudioSessionInputHeadphones);
MAKE_SYSTEM_PROP(AUDIO_HEADSET_INOUT,TiMediaAudioSessionInputHeadsetInOut);
MAKE_SYSTEM_PROP(AUDIO_RECEIVER_AND_MIC,TiMediaAudioSessionInputReceiverAndMicrophone);
MAKE_SYSTEM_PROP(AUDIO_HEADPHONES_AND_MIC,TiMediaAudioSessionInputHeadphonesAndMicrophone);
MAKE_SYSTEM_PROP(AUDIO_LINEOUT,TiMediaAudioSessionInputLineOut);
MAKE_SYSTEM_PROP(AUDIO_SPEAKER,TiMediaAudioSessionInputSpeaker);
MAKE_SYSTEM_PROP(AUDIO_MICROPHONE,TiMediaAudioSessionInputMicrophoneBuiltin);
MAKE_SYSTEM_PROP(AUDIO_MUTED,TiMediaAudioSessionInputMuted);
MAKE_SYSTEM_PROP(AUDIO_UNAVAILABLE,TiMediaAudioSessionInputUnavailable);
MAKE_SYSTEM_PROP(AUDIO_UNKNOWN,TiMediaAudioSessionInputUnknown);

MAKE_SYSTEM_UINT(AUDIO_FORMAT_LINEAR_PCM,kAudioFormatLinearPCM);
MAKE_SYSTEM_UINT(AUDIO_FORMAT_ULAW,kAudioFormatULaw);
MAKE_SYSTEM_UINT(AUDIO_FORMAT_ALAW,kAudioFormatALaw);
MAKE_SYSTEM_UINT(AUDIO_FORMAT_IMA4,kAudioFormatAppleIMA4);
MAKE_SYSTEM_UINT(AUDIO_FORMAT_ILBC,kAudioFormatiLBC);
MAKE_SYSTEM_UINT(AUDIO_FORMAT_APPLE_LOSSLESS,kAudioFormatAppleLossless);
MAKE_SYSTEM_UINT(AUDIO_FORMAT_AAC,kAudioFormatMPEG4AAC);

MAKE_SYSTEM_UINT(AUDIO_FILEFORMAT_WAVE,kAudioFileWAVEType);
MAKE_SYSTEM_UINT(AUDIO_FILEFORMAT_AIFF,kAudioFileAIFFType);
MAKE_SYSTEM_UINT(AUDIO_FILEFORMAT_MP3,kAudioFileMP3Type);
MAKE_SYSTEM_UINT(AUDIO_FILEFORMAT_MP4,kAudioFileMPEG4Type);
MAKE_SYSTEM_UINT(AUDIO_FILEFORMAT_MP4A,kAudioFileM4AType);
MAKE_SYSTEM_UINT(AUDIO_FILEFORMAT_CAF,kAudioFileCAFType);
MAKE_SYSTEM_UINT(AUDIO_FILEFORMAT_3GPP,kAudioFile3GPType);
MAKE_SYSTEM_UINT(AUDIO_FILEFORMAT_3GP2,kAudioFile3GP2Type);
MAKE_SYSTEM_UINT(AUDIO_FILEFORMAT_AMR,kAudioFileAMRType);

MAKE_SYSTEM_UINT(AUDIO_SESSION_MODE_AMBIENT, kAudioSessionCategory_AmbientSound);
MAKE_SYSTEM_UINT(AUDIO_SESSION_MODE_SOLO_AMBIENT, kAudioSessionCategory_SoloAmbientSound);
MAKE_SYSTEM_UINT(AUDIO_SESSION_MODE_PLAYBACK, kAudioSessionCategory_MediaPlayback);
MAKE_SYSTEM_UINT(AUDIO_SESSION_MODE_RECORD, kAudioSessionCategory_RecordAudio);
MAKE_SYSTEM_UINT(AUDIO_SESSION_MODE_PLAY_AND_RECORD, kAudioSessionCategory_PlayAndRecord);

MAKE_SYSTEM_PROP(MUSIC_MEDIA_TYPE_MUSIC, MPMediaTypeMusic);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_TYPE_PODCAST, MPMediaTypePodcast);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_TYPE_AUDIOBOOK, MPMediaTypeAudioBook);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_TYPE_ANY_AUDIO, MPMediaTypeAnyAudio);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_TYPE_ALL, MPMediaTypeAny);

MAKE_SYSTEM_PROP(MUSIC_PLAYER_STATE_STOPPED, MPMusicPlaybackStateStopped);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_STATE_PLAYING, MPMusicPlaybackStatePlaying);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_STATE_PAUSED, MPMusicPlaybackStatePaused);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_STATE_INTERRUPTED, MPMusicPlaybackStateInterrupted);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_STATE_SKEEK_FORWARD, MPMusicPlaybackStateSeekingForward);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_STATE_SEEK_BACKWARD, MPMusicPlaybackStateSeekingBackward);

MAKE_SYSTEM_PROP(MUSIC_PLAYER_REPEAT_DEFAULT, MPMusicRepeatModeDefault);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_REPEAT_NONE, MPMusicRepeatModeNone);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_REPEAT_ONE, MPMusicRepeatModeOne);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_REPEAT_ALL, MPMusicRepeatModeAll);

MAKE_SYSTEM_PROP(MUSIC_PLAYER_SHUFFLE_DEFAULT, MPMusicShuffleModeDefault);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_SHUFFLE_NONE, MPMusicShuffleModeOff);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_SHUFFLE_SONGS, MPMusicShuffleModeSongs);
MAKE_SYSTEM_PROP(MUSIC_PLAYER_SHUFFLE_ALBUMS, MPMusicShuffleModeAlbums);

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
// these are new in 3.2
MAKE_SYSTEM_PROP(VIDEO_CONTROL_NONE,MPMovieControlStyleNone);
MAKE_SYSTEM_PROP(VIDEO_CONTROL_EMBEDDED,MPMovieControlStyleEmbedded);
MAKE_SYSTEM_PROP(VIDEO_CONTROL_FULLSCREEN,MPMovieControlStyleFullscreen);

MAKE_SYSTEM_PROP(VIDEO_MEDIA_TYPE_NONE,MPMovieMediaTypeMaskNone);
MAKE_SYSTEM_PROP(VIDEO_MEDIA_TYPE_VIDEO,MPMovieMediaTypeMaskVideo);
MAKE_SYSTEM_PROP(VIDEO_MEDIA_TYPE_AUDIO,MPMovieMediaTypeMaskAudio);

MAKE_SYSTEM_PROP(VIDEO_SOURCE_TYPE_UNKNOWN,MPMovieSourceTypeUnknown);
MAKE_SYSTEM_PROP(VIDEO_SOURCE_TYPE_FILE,MPMovieSourceTypeFile);
MAKE_SYSTEM_PROP(VIDEO_SOURCE_TYPE_STREAMING,MPMovieSourceTypeStreaming);

MAKE_SYSTEM_PROP(VIDEO_PLAYBACK_STATE_STOPPED,MPMoviePlaybackStateStopped);
MAKE_SYSTEM_PROP(VIDEO_PLAYBACK_STATE_PLAYING,MPMoviePlaybackStatePlaying);
MAKE_SYSTEM_PROP(VIDEO_PLAYBACK_STATE_PAUSED,MPMoviePlaybackStatePaused);
MAKE_SYSTEM_PROP(VIDEO_PLAYBACK_STATE_INTERRUPTED,MPMoviePlaybackStateInterrupted);
MAKE_SYSTEM_PROP(VIDEO_PLAYBACK_STATE_SEEKING_FORWARD,MPMoviePlaybackStateSeekingForward);
MAKE_SYSTEM_PROP(VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD,MPMoviePlaybackStateSeekingBackward);

MAKE_SYSTEM_PROP(VIDEO_LOAD_STATE_UNKNOWN,MPMovieLoadStateUnknown);
MAKE_SYSTEM_PROP(VIDEO_LOAD_STATE_PLAYABLE,MPMovieLoadStatePlayable);
MAKE_SYSTEM_PROP(VIDEO_LOAD_STATE_PLAYTHROUGH_OK,MPMovieLoadStatePlaythroughOK);
MAKE_SYSTEM_PROP(VIDEO_LOAD_STATE_STALLED,MPMovieLoadStateStalled);

MAKE_SYSTEM_PROP(VIDEO_REPEAT_MODE_NONE,MPMovieRepeatModeNone);
MAKE_SYSTEM_PROP(VIDEO_REPEAT_MODE_ONE,MPMovieRepeatModeOne);

MAKE_SYSTEM_PROP(VIDEO_TIME_OPTION_NEAREST_KEYFRAME,MPMovieTimeOptionNearestKeyFrame);
MAKE_SYSTEM_PROP(VIDEO_TIME_OPTION_EXACT,MPMovieTimeOptionExact);

MAKE_SYSTEM_PROP(VIDEO_FINISH_REASON_PLAYBACK_ENDED,MPMovieFinishReasonPlaybackEnded);
MAKE_SYSTEM_PROP(VIDEO_FINISH_REASON_PLAYBACK_ERROR,MPMovieFinishReasonPlaybackError);
MAKE_SYSTEM_PROP(VIDEO_FINISH_REASON_USER_EXITED,MPMovieFinishReasonUserExited);

				 
#endif


-(CGFloat)volume
{
	return [[TiMediaAudioSession sharedSession] volume];
}

-(BOOL)audioPlaying
{
	return [[TiMediaAudioSession sharedSession] isAudioPlaying];
}

-(NSInteger)audioLineType
{
	return [[TiMediaAudioSession sharedSession] inputType];
}

-(NSArray*)availableCameraMediaTypes
{
	NSArray* mediaSourceTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypeCamera];
	return mediaSourceTypes==nil ? [NSArray arrayWithObject:(NSString*)kUTTypeImage] : mediaSourceTypes;
}

-(NSArray*)availablePhotoMediaTypes
{
	NSArray* photoSourceTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypePhotoLibrary];
	return photoSourceTypes==nil ? [NSArray arrayWithObject:(NSString*)kUTTypeImage] : photoSourceTypes;
}

-(NSArray*)availablePhotoGalleryMediaTypes
{
	NSArray* albumSourceTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypeSavedPhotosAlbum];
	return albumSourceTypes==nil ? [NSArray arrayWithObject:(NSString*)kUTTypeImage] : albumSourceTypes;
}

-(id)isMediaTypeSupported:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	
	NSString *media = [[TiUtils stringValue:[args objectAtIndex:0]] lowercaseString];
	NSString *type = [[TiUtils stringValue:[args objectAtIndex:1]] lowercaseString];
	
	NSArray *array = nil;
	
	if ([media isEqualToString:@"camera"])
	{
		array = [self availableCameraMediaTypes];
	}
	else if ([media isEqualToString:@"photo"])
	{
		array = [self availablePhotoMediaTypes];
	}
	else if ([media isEqualToString:@"photogallery"])
	{
		array = [self availablePhotoGalleryMediaTypes];
	}
	if (array!=nil)
	{
		for (NSString* atype in array)
		{
			if ([[atype lowercaseString] isEqualToString:type])
			{
				return NUMBOOL(YES);
			}
		}
	}
	return NUMBOOL(NO);
}

-(BOOL)isCameraSupported;
{
	return [UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera];
}

-(void)showCamera:(id)args
{
	ENSURE_UI_THREAD(showCamera,args);
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	[self showPicker:args isCamera:YES];
}

-(void)openPhotoGallery:(id)args
{
	ENSURE_UI_THREAD(openPhotoGallery,args);
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	[self showPicker:args isCamera:NO];
}	

-(void)takeScreenshot:(id)arg
{
	ENSURE_UI_THREAD(takeScreenshot,arg);
	ENSURE_SINGLE_ARG(arg,KrollCallback);
	
	// we take the shot of the whole window, not just the active view
	UIWindow *screenWindow = [[UIApplication sharedApplication] keyWindow];
	UIGraphicsBeginImageContext(screenWindow.bounds.size);
	[screenWindow.layer renderInContext:UIGraphicsGetCurrentContext()];
	UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
	UIGraphicsEndImageContext();
	
	TiBlob *blob = [[[TiBlob alloc] initWithImage:image] autorelease];
	NSDictionary *event = [NSDictionary dictionaryWithObject:blob forKey:@"media"];
	[self _fireEventToListener:@"screenshot" withObject:event listener:arg thisObject:nil];
}

-(void)saveToPhotoGallery:(id)arg
{
	ENSURE_UI_THREAD(saveToPhotoGallery,arg);
	ENSURE_SINGLE_ARG(arg,NSObject);
	if ([arg isKindOfClass:[TiBlob class]])
	{
		TiBlob *blob = (TiBlob*)arg;
		NSString *mime = [blob mimeType];
		
		if (mime==nil || [mime hasPrefix:@"image/"])
		{
			UIImage * savedImage = [blob image];
			if (savedImage == nil) return;
			UIImageWriteToSavedPhotosAlbum(savedImage, nil, nil, NULL);
		}
		else if ([mime hasPrefix:@"video/"])
		{
			NSString * tempFilePath = [blob path];
			if (tempFilePath == nil) return;
			UISaveVideoAtPathToSavedPhotosAlbum(tempFilePath, nil, nil, NULL);
		}
	}
	else if ([arg isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)arg;
		NSString *mime = [Mimetypes mimeTypeForExtension:[file path]];
		if (mime == nil || [mime hasPrefix:@"image/"])
		{
			NSData *data = [NSData dataWithContentsOfFile:[file path]];
			UIImage *image = [[[UIImage alloc] initWithData:data] autorelease];
			UIImageWriteToSavedPhotosAlbum(image, nil, nil, NULL);
		}
		else if ([mime hasPrefix:@"video/"])
		{
			UISaveVideoAtPathToSavedPhotosAlbum([file path], nil, nil, NULL);
		}
	}
	else
	{
		[self throwException:@"invalid media type" subreason:[NSString stringWithFormat:@"expected either TiBlob or TiFile, was: %@",[arg class]] location:CODELOCATION];
	}
}

-(void)beep:(id)args
{
	ENSURE_UI_THREAD(beep,args);
	AudioServicesPlayAlertSound(kSystemSoundID_Vibrate);
}

-(void)vibrate:(id)args
{
	ENSURE_UI_THREAD(beep,args);
	AudioServicesPlayAlertSound(kSystemSoundID_Vibrate);
}

-(void)takePicture:(id)args
{
	// must have a picker, doh
	if (picker==nil)
	{
		[self throwException:@"invalid state" subreason:nil location:CODELOCATION];
	}
	ENSURE_UI_THREAD(takePicture,args);
	[picker takePicture];
}

-(void)hideCamera:(id)args
{
	ENSURE_UI_THREAD(hideCamera,args);
	if (picker!=nil)
	{
		[[TiApp app] hideModalController:picker animated:animatedPicker];
		[self destroyPicker];
	}
}


-(void)openMusicLibrary:(id)args
{	
	ENSURE_UI_THREAD(openMusicLibrary,args);
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);

	if (musicPicker != nil) {
		[self sendPickerError:MediaModuleErrorBusy];
		return;
	}
	
	animatedPicker = YES;
	
	// Have to perform setup & manual check for simulator; otherwise things
	// fail less than gracefully.
	[self commonPickerSetup:args];
	
	// iPod not available on simulator
#if TARGET_IPHONE_SIMULATOR
	[self sendPickerError:MediaModuleErrorNoMusicPlayer];
	return;
#endif
	
	if (args != nil)
	{
		MPMediaType mediaTypes = 0;
		id mediaList = [args objectForKey:@"mediaTypes"];
		
		if (mediaList!=nil) {
			if ([mediaList isKindOfClass:[NSArray class]]) {
				for (NSNumber* type in mediaList) {
					mediaTypes |= [type integerValue];
				}
			}
			else {
				ENSURE_TYPE(mediaList, NSNumber);
				mediaTypes = [mediaList integerValue];
			}
		}
		
		if (mediaTypes == 0) {
			mediaTypes = MPMediaTypeAny;
		}
		
		musicPicker = [[MPMediaPickerController alloc] initWithMediaTypes:mediaTypes];
		musicPicker.allowsPickingMultipleItems = [TiUtils boolValue:[args objectForKey:@"allowMultipleSelections"] def:NO];
	}
	else {
		musicPicker = [[MPMediaPickerController alloc] init];
	}
	[musicPicker setDelegate:self];
	
	[self displayModalPicker:musicPicker settings:args];
}

-(void)hideMusicLibrary:(id)args
{
	ENSURE_UI_THREAD(hideMusicLibrary,args);
	if (musicPicker != nil)
	{
		[[TiApp app] hideModalController:musicPicker animated:animatedPicker];
		[self destroyPicker];
	}
}

-(TiMediaMusicPlayer*)systemMusicPlayer
{
	if (systemMusicPlayer == nil) {
		if (![NSThread isMainThread]) {
			[self performSelectorOnMainThread:@selector(systemMusicPlayer) withObject:nil waitUntilDone:YES];
			return systemMusicPlayer;
		}
		systemMusicPlayer = [[TiMediaMusicPlayer alloc] _initWithPageContext:[self pageContext] player:[MPMusicPlayerController iPodMusicPlayer]];
	}
	return systemMusicPlayer;
}

-(TiMediaMusicPlayer*)appMusicPlayer
{
	if (appMusicPlayer == nil) {
		if (![NSThread isMainThread]) {
			[self performSelectorOnMainThread:@selector(appMusicPlayer) withObject:nil waitUntilDone:YES];
			return appMusicPlayer;
		}
		appMusicPlayer = [[TiMediaMusicPlayer alloc] _initWithPageContext:[self pageContext] player:[MPMusicPlayerController applicationMusicPlayer]];
	}
	return appMusicPlayer;
}

-(void)setDefaultAudioSessionMode:(NSNumber*)mode
{
    [[TiMediaAudioSession sharedSession] setDefaultSessionMode:[mode unsignedIntValue]];
}

-(NSNumber*)defaultAudioSessionMode
{
    return [NSNumber numberWithUnsignedInt:[[TiMediaAudioSession sharedSession] defaultSessionMode]];
}

#pragma mark Delegates

- (void)imagePickerController:(UIImagePickerController *)picker_ didFinishPickingMediaWithInfo:(NSDictionary *)editingInfo
{
	if (autoHidePicker)
	{
		[self closeModalPicker:picker];
	}
	
	NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
	
	TiBlob *media = nil;
	TiBlob *media2 = nil;
	
	NSString *mediaType = [editingInfo objectForKey:UIImagePickerControllerMediaType];
	if (mediaType==nil)
	{
		mediaType = (NSString*)kUTTypeImage; // default to in case older OS
	}
	
	[dictionary setObject:mediaType forKey:@"mediaType"];
	
	BOOL imageWrittenToAlbum = NO;
	BOOL isVideo = [mediaType isEqualToString:(NSString*)kUTTypeMovie];
	
	NSURL *mediaURL = [editingInfo objectForKey:UIImagePickerControllerMediaURL];
	if (mediaURL!=nil)
	{
		// this is a video, get the path to the URL
		media = [[[TiBlob alloc] initWithFile:[mediaURL path]] autorelease];
		
		if (isVideo)
		{
			[media setMimeType:@"video/mpeg" type:TiBlobTypeFile];
		}
		else 
		{
			[media setMimeType:@"image/jpeg" type:TiBlobTypeFile];
		}
		
		if (saveToRoll)
		{
			if (isVideo)
			{
				NSString *tempFilePath = [mediaURL absoluteString];
				UISaveVideoAtPathToSavedPhotosAlbum(tempFilePath, nil, nil, NULL);
			}
			else 
			{
				UIImage *image = [editingInfo objectForKey:UIImagePickerControllerOriginalImage];
				UIImageWriteToSavedPhotosAlbum(image, nil, nil, NULL);
				imageWrittenToAlbum = YES;
			}
			
		}
		
		// this is the thumbnail of the video
		if (isVideo)
		{
			UIImage *image = [editingInfo objectForKey:UIImagePickerControllerOriginalImage];
			media2 = [[[TiBlob alloc] initWithImage:image] autorelease];
		}
	}
	
	if (media==nil)
	{
		UIImage *image = [editingInfo objectForKey:UIImagePickerControllerEditedImage];
		if (image==nil)
		{
			image = [editingInfo objectForKey:UIImagePickerControllerOriginalImage];
		}
		media = [[[TiBlob alloc] initWithImage:image] autorelease];
		if (saveToRoll && imageWrittenToAlbum==NO)
		{
			UIImageWriteToSavedPhotosAlbum(image, nil, nil, NULL);
		}
	}
	
	NSValue * ourRectValue = [editingInfo objectForKey:UIImagePickerControllerCropRect];
	if (ourRectValue != nil)
	{
		CGRect ourRect = [ourRectValue CGRectValue];
		[dictionary setObject:[NSDictionary dictionaryWithObjectsAndKeys:
							   [NSNumber numberWithFloat:ourRect.origin.x],@"x",
							   [NSNumber numberWithFloat:ourRect.origin.y],@"y",
							   [NSNumber numberWithFloat:ourRect.size.width],@"width",
							   [NSNumber numberWithFloat:ourRect.size.height],@"height",
							   nil] forKey:@"cropRect"];
	}
	
	if (media!=nil)
	{
		[dictionary setObject:media forKey:@"media"];
	}
	
	if (media2!=nil)
	{
		[dictionary setObject:media2 forKey:@"thumbnail"];
	}
	
	[self sendPickerSuccess:dictionary];
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker_
{
	[self closeModalPicker:picker];
	[self sendPickerCancel];
}

- (void)mediaPicker:(MPMediaPickerController*)mediaPicker_ didPickMediaItems:(MPMediaItemCollection*)collection
{
	if (autoHidePicker) {
		[self closeModalPicker:musicPicker];
	}
	
	TiMediaItem* representative = [[[TiMediaItem alloc] _initWithPageContext:[self pageContext] item:[collection representativeItem]] autorelease];
	NSNumber* mediaTypes = [NSNumber numberWithUnsignedInteger:[collection mediaTypes]];
	NSMutableArray* items = [NSMutableArray array];
	
	for (MPMediaItem* item in [collection items]) {
		TiMediaItem* newItem = [[[TiMediaItem alloc] _initWithPageContext:[self pageContext] item:item] autorelease];
		[items addObject:newItem];
	}
	
	NSDictionary* picked = [NSDictionary dictionaryWithObjectsAndKeys:representative,@"representative",mediaTypes,@"types",items,@"items",nil];
	
	[self sendPickerSuccess:picked];
}

- (void)mediaPickerDidCancel:(MPMediaPickerController *)mediaPicker_
{
	[self closeModalPicker:musicPicker];
	[self sendPickerCancel];
}

#pragma mark Microphone support

-(void)startMicrophoneMonitor:(id)args
{
	[[SCListener sharedListener] listen];
}

-(void)stopMicrophoneMonitor:(id)args
{
	[[SCListener sharedListener] stop];
}

-(CGFloat)peakMicrophonePower
{
	if ([[SCListener sharedListener] isListening])
	{
		return [[SCListener sharedListener] peakPower];
	}
	return -1;
}

-(CGFloat)averageMicrophonePower
{
	if ([[SCListener sharedListener] isListening])
	{
		return [[SCListener sharedListener] averagePower];
	}
	return -1;
}

#pragma mark Delegates

-(void)audioRouteChanged:(NSNotification*)note
{
	NSDictionary *event = [note userInfo];
	[self fireEvent:@"linechange" withObject:event];
}

-(void)audioVolumeChanged:(NSNotification*)note
{
	NSMutableDictionary *event = [NSMutableDictionary dictionary];
	[event setObject:NUMFLOAT([self volume]) forKey:@"volume"];
	[self fireEvent:@"volume" withObject:event];
}

#pragma mark Listener Management

-(void)_listenerAdded:(NSString *)type count:(int)count
{
	if (count == 1 && [type isEqualToString:@"linechange"])
	{
		[[TiMediaAudioSession sharedSession] startAudioSession];
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(audioRouteChanged:) name:kTiMediaAudioSessionRouteChange object:[TiMediaAudioSession sharedSession]];
	}
	else if (count == 1 && [type isEqualToString:@"volume"])
	{
		[[TiMediaAudioSession sharedSession] startAudioSession];
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(audioVolumeChanged:) name:kTiMediaAudioSessionVolumeChange object:[TiMediaAudioSession sharedSession]];
	}
}

-(void)_listenerRemoved:(NSString *)type count:(int)count
{
	if (count == 0 && [type isEqualToString:@"linechange"])
	{
		[[TiMediaAudioSession sharedSession] stopAudioSession];
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiMediaAudioSessionRouteChange object:[TiMediaAudioSession sharedSession]];
	}
	else if (count == 0 && [type isEqualToString:@"volume"])
	{
		[[TiMediaAudioSession sharedSession] stopAudioSession];
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiMediaAudioSessionVolumeChange object:[TiMediaAudioSession sharedSession]];
	}
}

@end

#endif