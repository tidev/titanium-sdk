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

#import <UIKit/UIPopoverController.h>
// by default, we want to make the camera fullscreen and 
// these transform values will scale it when we have our own overlay

#define CAMERA_TRANSFORM_Y 1.23
#define CAMERA_TRANSFORM_X 1

enum  
{
	MediaModuleErrorUnknown,
	MediaModuleErrorBusy,
	MediaModuleErrorNoCamera,
	MediaModuleErrorNoVideo,
	MediaModuleErrorNoMusicPlayer
};

// Have to distinguish between filterable and nonfilterable properties
static NSDictionary* TI_itemProperties;
static NSDictionary* TI_filterableItemProperties;

@implementation MediaModule
@synthesize popoverView;

#pragma mark Internal

+(NSDictionary*)filterableItemProperties
{
    if (TI_filterableItemProperties == nil) {
        TI_filterableItemProperties = [[NSDictionary alloc] initWithObjectsAndKeys:MPMediaItemPropertyMediaType, @"mediaType", // Filterable
                                                                                   MPMediaItemPropertyTitle, @"title", // Filterable
                                                                                   MPMediaItemPropertyAlbumTitle, @"albumTitle", // Filterable
                                                                                   MPMediaItemPropertyArtist, @"artist", // Filterable
                                                                                   MPMediaItemPropertyAlbumArtist, @"albumArtist", //Filterable
                                                                                   MPMediaItemPropertyGenre, @"genre", // Filterable
                                                                                   MPMediaItemPropertyComposer, @"composer", // Filterable
                                                                                   MPMediaItemPropertyIsCompilation, @"isCompilation", // Filterable
                                                                                   nil];
    }
    return TI_filterableItemProperties;
}

+(NSDictionary*)itemProperties
{
	if (TI_itemProperties == nil) {
		TI_itemProperties = [[NSDictionary alloc] initWithObjectsAndKeys:MPMediaItemPropertyPlaybackDuration, @"playbackDuration",
                                                                         MPMediaItemPropertyAlbumTrackNumber, @"albumTrackNumber",
                                                                         MPMediaItemPropertyAlbumTrackCount, @"albumTrackCount",
                                                                         MPMediaItemPropertyDiscNumber, @"discNumber",
                                                                         MPMediaItemPropertyDiscCount, @"discCount",
                                                                         MPMediaItemPropertyLyrics, @"lyrics",
                                                                         MPMediaItemPropertyPodcastTitle, @"podcastTitle",
                                                                         MPMediaItemPropertyPlayCount, @"playCount",
                                                                         MPMediaItemPropertySkipCount, @"skipCount",
                                                                         MPMediaItemPropertyRating, @"rating",
                                                                         nil	];		
	}
	return TI_itemProperties;
}

-(void)destroyPickerCallbacks
{
	RELEASE_TO_NIL(editorSuccessCallback);
	RELEASE_TO_NIL(editorErrorCallback);
	RELEASE_TO_NIL(editorCancelCallback);
	RELEASE_TO_NIL(pickerSuccessCallback);
	RELEASE_TO_NIL(pickerErrorCallback);
	RELEASE_TO_NIL(pickerCancelCallback);
}

-(void)destroyPicker
{
	RELEASE_TO_NIL(popover);
    RELEASE_TO_NIL(cameraView);
	RELEASE_TO_NIL(editor);
	RELEASE_TO_NIL(editorSuccessCallback);
	RELEASE_TO_NIL(editorErrorCallback);
	RELEASE_TO_NIL(editorCancelCallback);
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
	RELEASE_TO_NIL(popoverView);
	[[NSNotificationCenter defaultCenter] removeObserver:self];
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

-(void)displayCamera:(UIViewController*)picker_
{
	TiApp * tiApp = [TiApp app];
	if ([TiUtils isIPad]==NO)
	{
		[[tiApp controller] manuallyRotateToOrientation:UIInterfaceOrientationPortrait duration:[[tiApp controller] suggestedRotationDuration]];
	}
	[tiApp showModalController:picker_ animated:animatedPicker];
}

-(void)displayModalPicker:(UIViewController*)picker_ settings:(NSDictionary*)args
{
	TiApp * tiApp = [TiApp app];
	if ([TiUtils isIPad]==NO)
	{
		[[tiApp controller] manuallyRotateToOrientation:UIInterfaceOrientationPortrait duration:[[tiApp controller] suggestedRotationDuration]];
		[tiApp showModalController:picker_ animated:animatedPicker];
	}
	else
	{
		RELEASE_TO_NIL(popover);
		UIView *poView = [tiApp controller].view;
		CGRect poFrame;
		TiViewProxy* popoverViewProxy = [args objectForKey:@"popoverView"];
		UIPopoverArrowDirection arrow = [TiUtils intValue:@"arrowDirection" properties:args def:UIPopoverArrowDirectionAny];

		if (popoverViewProxy!=nil)
		{
			poView = [popoverViewProxy view];
			poFrame = [poView bounds];
		}
		else
		{
			arrow = UIPopoverArrowDirectionAny;
			poFrame = [poView bounds];
			poFrame.size.height = 50;
		}

		//FROM APPLE DOCS
		//If you presented the popover from a target rectangle in a view, the popover controller does not attempt to reposition the popover. 
		//In thosecases, you must manually hide the popover or present it again from an appropriate new position.
		//We will register for interface change notification for this purpose
		
		//This registration tells us when the rotation begins.
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(manageRotation:) name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
		
		//This registration lets us sync with the TiRootViewController's orientation notification (didOrientNotify method)
		//No need to begin generating these events since the TiRootViewController already does that
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updatePopover:) name:UIDeviceOrientationDidChangeNotification object:nil];
		arrowDirection = arrow;
		popoverView = poView;
		popover = [[UIPopoverController alloc] initWithContentViewController:picker_];
		[popover setDelegate:self];
		[popover presentPopoverFromRect:poFrame inView:poView permittedArrowDirections:arrow animated:animatedPicker];
	}
}

-(void)manageRotation:(NSNotification *)notification
{
	//Capture the old orientation
	oldOrientation = [[UIApplication sharedApplication]statusBarOrientation];
	//Capture the new orientation
	newOrientation = [[notification.userInfo valueForKey:UIApplicationStatusBarOrientationUserInfoKey] integerValue];
}
-(void)updatePopover:(NSNotification *)notification
{
	if (isPresenting) {
		return;
	}
	//Set up the right delay
	NSTimeInterval delay = [[UIApplication sharedApplication] statusBarOrientationAnimationDuration];
	if ( (oldOrientation == UIInterfaceOrientationPortrait) && (newOrientation == UIInterfaceOrientationPortraitUpsideDown) ){	
		delay*=2.0;
	}
	else if ( (oldOrientation == UIInterfaceOrientationLandscapeLeft) && (newOrientation == UIInterfaceOrientationLandscapeRight) ){
		delay *=2.0;
	}
	
	//Allow the root view controller to relayout all child view controllers so that we get the correct frame size when we re-present
	[self performSelector:@selector(updatePopoverNow) withObject:nil afterDelay:delay inModes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
}

-(void)updatePopoverNow
{
	isPresenting = YES;
	if (popover) {
		//GO AHEAD AND RE-PRESENT THE POPOVER NOW 
		CGRect popOverRect = [popoverView bounds];
		if (popoverView == [[TiApp app] controller].view) {
			popOverRect.size.height = 50;
		}
		[popover presentPopoverFromRect:popOverRect inView:popoverView permittedArrowDirections:arrowDirection animated:NO];
	}
	isPresenting = NO;
}

-(void)closeModalPicker:(UIViewController*)picker_
{
    if (cameraView != nil) {
        [cameraView windowWillClose];
    }
	if (popover)
	{
		[(UIPopoverController*)popover dismissPopoverAnimated:animatedPicker];
		RELEASE_TO_NIL(popover);
	}
	else
	{
		[[TiApp app] hideModalController:picker_ animated:animatedPicker];
	}
    if (cameraView != nil) {
        [cameraView windowDidClose];
        RELEASE_TO_NIL(cameraView);
    }
}

- (void)popoverControllerDidDismissPopover:(UIPopoverController *)popoverController
{
	if([popoverController contentViewController] == musicPicker) {
		RELEASE_TO_NIL(musicPicker);
	}
	
	RELEASE_TO_NIL(popover);
	[self sendPickerCancel];
	//Unregister for interface change notification 
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
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
	BOOL editable = NO;
	UIImagePickerControllerSourceType ourSource = (isCamera ? UIImagePickerControllerSourceTypeCamera : UIImagePickerControllerSourceTypePhotoLibrary);
	
	if (args!=nil)
	{
		[self commonPickerSetup:args];
		
		NSNumber * imageEditingObject = [args objectForKey:@"allowImageEditing"];  //backwards compatible
		saveToRoll = [TiUtils boolValue:@"saveToPhotoGallery" properties:args def:NO];
		
		if (imageEditingObject==nil)
		{
			imageEditingObject = [args objectForKey:@"allowEditing"];
			editable = [TiUtils boolValue:imageEditingObject];
		}
		
		// introduced in 3.1
		[picker setAllowsEditing:editable];
		
		NSArray *sourceTypes = [UIImagePickerController availableMediaTypesForSourceType:ourSource];
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
		TiViewProxy *cameraViewProxy = [args objectForKey:@"overlay"];
		if (cameraViewProxy!=nil)
		{
			ENSURE_TYPE(cameraViewProxy,TiViewProxy);
            cameraView = [cameraViewProxy retain];
			UIView *view = [cameraView view];
			if (editable)
			{
				// turn off touch enablement if image editing is enabled since it will
				// interfere with editing
				[view performSelector:@selector(setTouchEnabled_:) withObject:NUMBOOL(NO)];
			}
			[TiUtils setView:view positionRect:[picker view].bounds];
            [cameraView windowWillOpen];
			[picker setCameraOverlayView:view];
            [cameraView windowDidOpen];
            [cameraView layoutChildren:NO];
			[picker setWantsFullScreenLayout:YES];
		}
		
		// allow a transform on the preview image
		id transform = [args objectForKey:@"transform"];
		if (transform!=nil)
		{
			ENSURE_TYPE(transform,Ti2DMatrix);
			[picker setCameraViewTransform:[transform matrix]];
		}
		else if (cameraView!=nil)
		{
			// we use our own fullscreen transform if the developer didn't supply one
			picker.cameraViewTransform = CGAffineTransformScale(picker.cameraViewTransform, CAMERA_TRANSFORM_X, CAMERA_TRANSFORM_Y);
		}
	}
	
	if (isCamera) {
		BOOL inPopOver = [TiUtils boolValue:@"inPopOver" properties:args def:NO];
		if (inPopOver) {
			[self displayModalPicker:picker settings:args];
		}
		else {
			[self displayCamera:picker];
		}
	} else {
		[self displayModalPicker:picker settings:args];
	}
}

-(void)saveCompletedForImage:(UIImage*)image error:(NSError*)error contextInfo:(void*)contextInfo
{
	NSDictionary* saveCallbacks = (NSDictionary*)contextInfo;
	TiBlob* blob = [[[TiBlob alloc] initWithImage:image] autorelease];
	
	if (error != nil) {
		KrollCallback* errorCallback = [saveCallbacks objectForKey:@"error"];
		if (errorCallback != nil) {
			NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:[error localizedDescription],@"error",blob,@"image",nil];
			[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"error",event,errorCallback,nil]];
		}
		return;
	}

	KrollCallback* successCallback = [saveCallbacks objectForKey:@"success"];
	if (successCallback != nil) {
		NSDictionary* event = [NSDictionary dictionaryWithObject:blob forKey:@"image"];
		[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"success",event,successCallback,nil]];
	}
}

-(void)saveCompletedForVideo:(NSString*)path error:(NSError*)error contextInfo:(void*)contextInfo
{
	NSDictionary* saveCallbacks = (NSDictionary*)contextInfo;
	if (error != nil) {
		KrollCallback* errorCallback = [saveCallbacks objectForKey:@"error"];
		if (errorCallback != nil) {
			NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:[error localizedDescription],@"error",path,@"path",nil];
			[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"error",event,errorCallback,nil]];			
		}
		return;
	}
	
	KrollCallback* successCallback = [saveCallbacks objectForKey:@"success"];
	if (successCallback != nil) {
		NSDictionary* event = [NSDictionary dictionaryWithObject:path forKey:@"path"];
		[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"success",event,successCallback,nil]];					
	}
    
    // This object was retained for use in this callback; release it.
    [saveCallbacks release]; 
}

#pragma mark Public APIs

MAKE_SYSTEM_PROP(UNKNOWN_ERROR,MediaModuleErrorUnknown);
MAKE_SYSTEM_PROP(DEVICE_BUSY,MediaModuleErrorBusy);
MAKE_SYSTEM_PROP(NO_CAMERA,MediaModuleErrorNoCamera);
MAKE_SYSTEM_PROP(NO_VIDEO,MediaModuleErrorNoVideo);
MAKE_SYSTEM_PROP(NO_MUSIC_PLAYER,MediaModuleErrorNoMusicPlayer);


// >=3.2 dependent value; this one isn't deprecated
MAKE_SYSTEM_PROP(VIDEO_CONTROL_DEFAULT, MPMovieControlStyleDefault);

// Deprecated old-school video control modes, mapped to the new values
-(NSNumber*)VIDEO_CONTROL_VOLUME_ONLY
{
    DEPRECATED_REPLACED(@"Media.VIDEO_CONTROL_VOLUME_ONLY", @"1.8.0", @"Ti.Media.VIDEO_CONTROL_EMBEDDED");
    return [self VIDEO_CONTROL_EMBEDDED];
}

-(NSNumber*)VIDEO_CONTROL_HIDDEN
{
    // This constant is still available in a non-deprecated manner in Android for 1.8; we should keep it around
    // until there's a parity discussion.
    // TODO: Does this need to be deprecated? For now, return the right value.
    return [self VIDEO_CONTROL_NONE];
}

MAKE_SYSTEM_PROP(VIDEO_SCALING_NONE,MPMovieScalingModeNone);
MAKE_SYSTEM_PROP(VIDEO_SCALING_ASPECT_FIT,MPMovieScalingModeAspectFit);
MAKE_SYSTEM_PROP(VIDEO_SCALING_ASPECT_FILL,MPMovieScalingModeAspectFill);
MAKE_SYSTEM_PROP(VIDEO_SCALING_MODE_FILL,MPMovieScalingModeFill);

MAKE_SYSTEM_STR(MEDIA_TYPE_VIDEO,kUTTypeMovie);
MAKE_SYSTEM_STR(MEDIA_TYPE_PHOTO,kUTTypeImage);

MAKE_SYSTEM_PROP(QUALITY_HIGH,UIImagePickerControllerQualityTypeHigh);
MAKE_SYSTEM_PROP(QUALITY_MEDIUM,UIImagePickerControllerQualityTypeMedium);
MAKE_SYSTEM_PROP(QUALITY_LOW,UIImagePickerControllerQualityTypeLow);

MAKE_SYSTEM_PROP(QUALITY_640x480,UIImagePickerControllerQualityType640x480);

MAKE_SYSTEM_PROP(CAMERA_FRONT,UIImagePickerControllerCameraDeviceFront);
MAKE_SYSTEM_PROP(CAMERA_REAR,UIImagePickerControllerCameraDeviceRear);

MAKE_SYSTEM_PROP(CAMERA_FLASH_OFF,UIImagePickerControllerCameraFlashModeOff);
MAKE_SYSTEM_PROP(CAMERA_FLASH_AUTO,UIImagePickerControllerCameraFlashModeAuto);
MAKE_SYSTEM_PROP(CAMERA_FLASH_ON,UIImagePickerControllerCameraFlashModeOn);

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

MAKE_SYSTEM_PROP(MUSIC_MEDIA_GROUP_TITLE, MPMediaGroupingTitle);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_GROUP_ALBUM, MPMediaGroupingAlbum);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_GROUP_ARTIST, MPMediaGroupingArtist);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_GROUP_ALBUM_ARTIST, MPMediaGroupingAlbumArtist);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_GROUP_COMPOSER, MPMediaGroupingComposer);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_GROUP_GENRE, MPMediaGroupingGenre);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_GROUP_PLAYLIST, MPMediaGroupingPlaylist);
MAKE_SYSTEM_PROP(MUSIC_MEDIA_GROUP_PODCAST_TITLE, MPMediaGroupingPodcastTitle);

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

-(CGFloat)volume
{
	return [[TiMediaAudioSession sharedSession] volume];
}

-(NSNumber*)canRecord
{
	return NUMBOOL([[TiMediaAudioSession sharedSession] hasInput]);
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

-(NSArray*)availableCameras
{	
	NSMutableArray* types = [NSMutableArray arrayWithCapacity:2];
	if ([UIImagePickerController isCameraDeviceAvailable:UIImagePickerControllerCameraDeviceFront])
	{
		[types addObject:NUMINT(UIImagePickerControllerCameraDeviceFront)];
	}
	if ([UIImagePickerController isCameraDeviceAvailable:UIImagePickerControllerCameraDeviceRear])
	{
		[types addObject:NUMINT(UIImagePickerControllerCameraDeviceRear)];
	}
	return types;
}

-(id)camera 
{	
	if (picker!=nil)
	{
		return NUMINT([picker cameraDevice]);
	}
	return NUMINT(UIImagePickerControllerCameraDeviceRear);
}

-(id)cameraFlashMode
{	
	if (picker!=nil)
	{
		return NUMINT([picker cameraFlashMode]);
	}
	return NUMINT(UIImagePickerControllerCameraFlashModeAuto);
}

-(void)setCameraFlashMode:(id)args
{
	// Return nothing	
	ENSURE_SINGLE_ARG(args,NSNumber);
	ENSURE_UI_THREAD(setCameraFlashMode,args);
	
	if (picker!=nil)
	{
		[picker setCameraFlashMode:[TiUtils intValue:args]];
	}
}

-(void)switchCamera:(id)args
{
	ENSURE_SINGLE_ARG(args,NSNumber);
	ENSURE_UI_THREAD(switchCamera,args);
	
	// must have a picker, doh
	if (picker==nil)
	{
		[self throwException:@"invalid state" subreason:nil location:CODELOCATION];
	}
	[picker setCameraDevice:[TiUtils intValue:args]];
}

-(void)startVideoCapture:(id)args
{ 
	// Return nothing	
	ENSURE_UI_THREAD(startVideoCapture,args);
	// must have a picker, doh
	if (picker==nil)
	{
		[self throwException:@"invalid state" subreason:nil location:CODELOCATION];
	}
	[picker startVideoCapture];
}

-(void)stopVideoCapture:(id)args
{	
	ENSURE_UI_THREAD(stopVideoCapture,args);
	// must have a picker, doh
	if (picker!=nil)
	{
		[picker stopVideoCapture];
	}
}

-(void)startVideoEditing:(id)args
{	
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	ENSURE_UI_THREAD(startVideoEditing,args);

	RELEASE_TO_NIL(editor); 
	
	BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
	id media = [args objectForKey:@"media"];
	
	editorSuccessCallback = [args objectForKey:@"success"];
	ENSURE_TYPE_OR_NIL(editorSuccessCallback,KrollCallback);
	[editorSuccessCallback retain];
	
	editorErrorCallback = [args objectForKey:@"error"];
	ENSURE_TYPE_OR_NIL(editorErrorCallback,KrollCallback);
	[editorErrorCallback retain];
	
	editorCancelCallback = [args objectForKey:@"cancel"];
	ENSURE_TYPE_OR_NIL(pickerCancelCallback,KrollCallback);
	[editorCancelCallback retain];

	//TODO: check canEditVideoAtPath
	
	UIViewController *root = [[TiApp app] controller];
	editor = [[UIVideoEditorController alloc] init];
	editor.delegate = self; 
	editor.videoQuality = [TiUtils intValue:@"videoQuality" properties:args def:UIImagePickerControllerQualityTypeMedium];
	editor.videoMaximumDuration = [TiUtils doubleValue:@"videoMaximumDuration" properties:args def:600];
	
	if ([media isKindOfClass:[NSString class]])
	{
		NSURL *url = [TiUtils toURL:media proxy:self];
		editor.videoPath = [url path];
	}
	else if ([media isKindOfClass:[TiBlob class]])
	{
		TiBlob *blob = (TiBlob*)media;
		editor.videoPath = [blob path];
	}
	else if ([media isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)media;
		editor.videoPath = [file path];
	}
	else 
	{
		RELEASE_TO_NIL(editor);
		NSLog(@"[ERROR] Unsupported video media: %@",[media class]);
		return;
	}
	
	TiApp * tiApp = [TiApp app];
	[[tiApp controller] manuallyRotateToOrientation:UIInterfaceOrientationPortrait duration:[[tiApp controller] suggestedRotationDuration]];
	[tiApp showModalController:editor animated:animated];
}

-(void)stopVideoEditing:(id)args
{	
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	ENSURE_UI_THREAD(stopVideoEditing,args);
	
	if (editor!=nil)
	{
		BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
		[[TiApp app] hideModalController:editor animated:animated];
		RELEASE_TO_NIL(editor);
	}
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
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	ENSURE_UI_THREAD(showCamera,args);
	[self showPicker:args isCamera:YES];
}

-(void)openPhotoGallery:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	ENSURE_UI_THREAD(openPhotoGallery,args);
	[self showPicker:args isCamera:NO];
}	

-(void)takeScreenshot:(id)arg
{
	ENSURE_SINGLE_ARG(arg,KrollCallback);
	ENSURE_UI_THREAD(takeScreenshot,arg);

    // Create a graphics context with the target size

 	CGSize imageSize = [[UIScreen mainScreen] bounds].size;
	UIGraphicsBeginImageContextWithOptions(imageSize, NO, 0);

	CGContextRef context = UIGraphicsGetCurrentContext();

    // Iterate over every window from back to front
    for (UIWindow *window in [[UIApplication sharedApplication] windows])
    {
        if (![window respondsToSelector:@selector(screen)] || [window screen] == [UIScreen mainScreen])
        {
            // -renderInContext: renders in the coordinate space of the layer,
            // so we must first apply the layer's geometry to the graphics context
            CGContextSaveGState(context);
            // Center the context around the window's anchor point
            CGContextTranslateCTM(context, [window center].x, [window center].y);
            // Apply the window's transform about the anchor point
            CGContextConcatCTM(context, [window transform]);
            // Offset by the portion of the bounds left of and above the anchor point
            CGContextTranslateCTM(context,
                                  -[window bounds].size.width * [[window layer] anchorPoint].x,
                                  -[window bounds].size.height * [[window layer] anchorPoint].y);

            // Render the layer hierarchy to the current context
            [[window layer] renderInContext:context];

            // Restore the context
            CGContextRestoreGState(context);
        }
    }

    // Retrieve the screenshot image
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();

    UIGraphicsEndImageContext();

	UIInterfaceOrientation windowOrientation = [[TiApp controller] windowOrientation];
	switch (windowOrientation) {
		case UIInterfaceOrientationPortraitUpsideDown:
			image = [UIImage imageWithCGImage:[image CGImage] scale:[image scale] orientation:UIImageOrientationDown];
			break;
		case UIInterfaceOrientationLandscapeLeft:
			image = [UIImage imageWithCGImage:[image CGImage] scale:[image scale] orientation:UIImageOrientationRight];
			break;
		case UIInterfaceOrientationLandscapeRight:
			image = [UIImage imageWithCGImage:[image CGImage] scale:[image scale] orientation:UIImageOrientationLeft];
			break;
		default:
			break;
	}
	
	TiBlob *blob = [[[TiBlob alloc] initWithImage:image] autorelease];
	NSDictionary *event = [NSDictionary dictionaryWithObject:blob forKey:@"media"];
	[self _fireEventToListener:@"screenshot" withObject:event listener:arg thisObject:nil];
}

-(void)saveToPhotoGallery:(id)arg
{
	ENSURE_UI_THREAD(saveToPhotoGallery,arg);
	NSObject* image = [arg objectAtIndex:0];
	ENSURE_TYPE(image, NSObject)
	
	NSDictionary* saveCallbacks=nil;
	if ([arg count] > 1) {
		saveCallbacks = [arg objectAtIndex:1];
		ENSURE_TYPE(saveCallbacks, NSDictionary);
		KrollCallback* successCallback = [saveCallbacks valueForKey:@"success"];
		ENSURE_TYPE_OR_NIL(successCallback, KrollCallback);
		KrollCallback* errorCallback = [saveCallbacks valueForKey:@"error"];
		ENSURE_TYPE_OR_NIL(errorCallback, KrollCallback);
	}
	
	if ([image isKindOfClass:[TiBlob class]])
	{
		TiBlob *blob = (TiBlob*)image;
		NSString *mime = [blob mimeType];
		
		if (mime==nil || [mime hasPrefix:@"image/"])
		{
			UIImage * savedImage = [blob image];
			if (savedImage == nil) return;
			UIImageWriteToSavedPhotosAlbum(savedImage, self, @selector(saveCompletedForImage:error:contextInfo:), [saveCallbacks retain]);
		}
		else if ([mime hasPrefix:@"video/"])
		{
            NSString* filePath;
            switch ([blob type]) {
                case TiBlobTypeFile: {
                    filePath = [blob path];
                    break;
                }
                case TiBlobTypeData: {
                    // In this case, we need to write the blob data to a /tmp file and then load it.
                    NSArray* typeinfo = [mime componentsSeparatedByString:@"/"];
                    TiFile* tempFile = [TiUtils createTempFile:[typeinfo objectAtIndex:1]];
                    filePath = [tempFile path];
                    
                    NSError* error = nil;
                    [blob writeTo:filePath error:&error];
                    
                    if (error != nil) {
                        NSDictionary* event = [NSDictionary dictionaryWithObject:[NSString stringWithFormat:@"problem writing to temporary file %@: %@", filePath, [error localizedDescription]]
                                                                          forKey:@"error"];
                        [self dispatchCallback:[NSArray arrayWithObjects:@"error",event,[saveCallbacks valueForKey:@"error"],nil]];
                        return;
                    }
                    
                    // Have to keep the temp file from being deleted when we leave scope, so add it to the userinfo so it can be cleaned up there
                    [saveCallbacks setValue:tempFile forKey:@"tempFile"];
                    break;
                }
                default: {
                    NSDictionary* event = [NSDictionary dictionaryWithObject:@"invalid media format: MIME type was video/, but data is image"
                                                                      forKey:@"error"];
                    [self dispatchCallback:[NSArray arrayWithObjects:@"error",event,[saveCallbacks valueForKey:@"error"],nil]];
                    return;
                }
            }
			UISaveVideoAtPathToSavedPhotosAlbum(filePath, self, @selector(saveCompletedForVideo:error:contextInfo:), [saveCallbacks retain]);
		}
	}
	else if ([image isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)image;
		NSString *mime = [Mimetypes mimeTypeForExtension:[file path]];
		if (mime == nil || [mime hasPrefix:@"image/"])
		{
			NSData *data = [NSData dataWithContentsOfFile:[file path]];
			UIImage *image = [[[UIImage alloc] initWithData:data] autorelease];
			UIImageWriteToSavedPhotosAlbum(image, self, @selector(saveCompletedForImage:error:contextInfo:), [saveCallbacks retain]);
		}
		else if ([mime hasPrefix:@"video/"])
		{
			UISaveVideoAtPathToSavedPhotosAlbum([file path], self, @selector(saveCompletedForVideo:error:contextInfo:), [saveCallbacks retain]);
		}
	}
	else
	{
		KrollCallback* errorCallback = [saveCallbacks valueForKey:@"error"];
		if (errorCallback != nil) {
			NSDictionary* event = [NSDictionary dictionaryWithObject:[NSString stringWithFormat:@"invalid media type: Exepcted either TiBlob or TiFile, was: %@",[image class]]
															  forKey:@"error"];
			[self dispatchCallback:[NSArray arrayWithObjects:@"error",event,errorCallback,nil]];
		} else {
			[self throwException:@"invalid media type" 
					   subreason:[NSString stringWithFormat:@"expected either TiBlob or TiFile, was: %@",[image class]] 
						location:CODELOCATION];
		}
	}
}

-(void)beep:(id)args
{
	ENSURE_UI_THREAD(beep,args);
	AudioServicesPlayAlertSound(kSystemSoundID_Vibrate);
}

-(void)vibrate:(id)args
{
	[self beep:args];
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
	[self destroyPickerCallbacks];
	//Hopefully, if we remove the callbacks before going to the main thread, we may reduce deadlock.
	ENSURE_UI_THREAD(hideCamera,args);
	if (picker!=nil)
	{
        if (cameraView != nil) {
            [cameraView windowWillClose];
        }
		if (popover != nil) {
			[popover dismissPopoverAnimated:animatedPicker];
			RELEASE_TO_NIL(popover);

			//Unregister for interface change notification 
			[[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
			[[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
		}
		else {
			[[TiApp app] hideModalController:picker animated:animatedPicker];
		}
        if (cameraView != nil) {
            [cameraView windowDidClose];
            RELEASE_TO_NIL(cameraView);
        }
		[self destroyPicker];
	}
}


-(void)openMusicLibrary:(id)args
{	
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	ENSURE_UI_THREAD(openMusicLibrary,args);

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
					switch ([type integerValue]) {
						case MPMediaTypeMusic:
						case MPMediaTypeAnyAudio:
						case MPMediaTypeAudioBook:
						case MPMediaTypePodcast:
						case MPMediaTypeAny:
							mediaTypes |= [type integerValue];
					}
				}
			}
			else {
				ENSURE_TYPE(mediaList, NSNumber);
				switch ([mediaList integerValue]) {
					case MPMediaTypeMusic:
					case MPMediaTypeAnyAudio:
					case MPMediaTypeAudioBook:
					case MPMediaTypePodcast:
					case MPMediaTypeAny:
						mediaTypes = [mediaList integerValue];
				}
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

-(NSArray*)queryMusicLibrary:(id)arg
{
    ENSURE_SINGLE_ARG(arg, NSDictionary);
    MPMediaGrouping grouping = [TiUtils intValue:[arg valueForKey:@"grouping"] def:MPMediaGroupingTitle];
    
    NSMutableSet* predicates = [NSMutableSet set];
    for (NSString* prop in [MediaModule filterableItemProperties]) {
        id value = [arg valueForKey:prop];
        if (value != nil) {
            if ([value isKindOfClass:[NSDictionary class]]) {
                id propVal = [value objectForKey:@"value"];
                bool exact = [TiUtils boolValue:[value objectForKey:@"exact"] def:YES];
                MPMediaPredicateComparison comparison = (exact) ? MPMediaPredicateComparisonEqualTo : MPMediaPredicateComparisonContains;
                [predicates addObject:[MPMediaPropertyPredicate predicateWithValue:propVal 
                                                                       forProperty:[[MediaModule filterableItemProperties] valueForKey:prop]
                                                                    comparisonType:comparison]];
            }
            else {
                [predicates addObject:[MPMediaPropertyPredicate predicateWithValue:value
                                                                       forProperty:[[MediaModule filterableItemProperties] valueForKey:prop]]];
            }
        }
    }
    
    MPMediaQuery* query = [[[MPMediaQuery alloc] initWithFilterPredicates:predicates] autorelease];
    NSMutableArray* result = [NSMutableArray arrayWithCapacity:[[query items] count]];
    for (MPMediaItem* item in [query items]) {
        TiMediaItem* newItem = [[[TiMediaItem alloc] _initWithPageContext:[self pageContext] item:item] autorelease];
        [result addObject:newItem];
    }
    return result;
}

-(TiMediaMusicPlayer*)systemMusicPlayer
{
	if (systemMusicPlayer == nil) {
		if (![NSThread isMainThread]) {
			__block id result;
			TiThreadPerformOnMainThread(^{result = [self systemMusicPlayer];}, YES);
			return result;
		}
		systemMusicPlayer = [[TiMediaMusicPlayer alloc] _initWithPageContext:[self pageContext] player:[MPMusicPlayerController iPodMusicPlayer]];
	}
	return systemMusicPlayer;
}

-(TiMediaMusicPlayer*)appMusicPlayer
{
	if (appMusicPlayer == nil) {
		if (![NSThread isMainThread]) {
			__block id result;
			TiThreadPerformOnMainThread(^{result = [self appMusicPlayer];}, YES);
			return appMusicPlayer;
		}
		appMusicPlayer = [[TiMediaMusicPlayer alloc] _initWithPageContext:[self pageContext] player:[MPMusicPlayerController applicationMusicPlayer]];
	} 
	return appMusicPlayer;
}

-(void)setDefaultAudioSessionMode:(NSNumber*)mode
{
	DebugLog(@"[WARN] Deprecated; use 'audioSessionMode'");
    [[TiMediaAudioSession sharedSession] setSessionMode:[mode unsignedIntValue]];
} 

-(NSNumber*)defaultAudioSessionMode
{
	DebugLog(@"[WARN] Deprecated; use 'audioSessionMode'");	
    return [NSNumber numberWithUnsignedInt:[[TiMediaAudioSession sharedSession] sessionMode]];
}

-(void)setAudioSessionMode:(NSNumber*)mode
{
    [[TiMediaAudioSession sharedSession] setSessionMode:[mode unsignedIntValue]];
} 

-(NSNumber*)audioSessionMode
{
    return [NSNumber numberWithUnsignedInt:[[TiMediaAudioSession sharedSession] sessionMode]];
}

#pragma mark Delegates

- (void)imagePickerController:(UIImagePickerController *)picker_ didFinishPickingMediaWithInfo:(NSDictionary *)editingInfo
{
	if (autoHidePicker)
	{
		[self closeModalPicker:picker];
	}
	
	NSString *mediaType = [editingInfo objectForKey:UIImagePickerControllerMediaType];
	if (mediaType==nil)
	{
		mediaType = (NSString*)kUTTypeImage; // default to in case older OS
	}
	NSURL *mediaURL = [editingInfo objectForKey:UIImagePickerControllerMediaURL];
	NSValue * ourRectValue = [editingInfo objectForKey:UIImagePickerControllerCropRect];
	
	BOOL isVideo = [mediaType isEqualToString:(NSString*)kUTTypeMovie];
	NSDictionary *cropRect = nil;
	TiBlob *media = nil;
	TiBlob *thumbnail = nil;

	BOOL imageWrittenToAlbum = NO;
	
	if (isVideo)
	{
		media = [[[TiBlob alloc] initWithFile:[mediaURL path]] autorelease];
		[media setMimeType:@"video/mpeg" type:TiBlobTypeFile];
		if (saveToRoll)
		{
			NSString *tempFilePath = [mediaURL absoluteString];
			UISaveVideoAtPathToSavedPhotosAlbum(tempFilePath, nil, nil, NULL);
		}
		UIImage *thumbnailImage = [editingInfo objectForKey:UIImagePickerControllerOriginalImage];
		thumbnail = [[[TiBlob alloc] initWithImage:thumbnailImage] autorelease];
	}
	else
	{
		UIImage *editedImage = [editingInfo objectForKey:UIImagePickerControllerEditedImage];
		if ((mediaURL!=nil) && (editedImage == nil))
		{
			// this is a video, get the path to the URL
			media = [[[TiBlob alloc] initWithFile:[mediaURL path]] autorelease];
			[media setMimeType:@"image/jpeg" type:TiBlobTypeFile];
			
			if (saveToRoll)
			{
				UIImage *image = [editingInfo objectForKey:UIImagePickerControllerOriginalImage];
				UIImageWriteToSavedPhotosAlbum(image, nil, nil, NULL);
			}
		}
		else
		{
            UIImage *resultImage = nil;
            UIImage *originalImage = [editingInfo objectForKey:UIImagePickerControllerOriginalImage];
            if ( (editedImage != nil) && (ourRectValue != nil) && (originalImage != nil)) {
                
                CGRect ourRect = [ourRectValue CGRectValue];
                
                if ( (ourRect.size.width > editedImage.size.width) || (ourRect.size.height > editedImage.size.height) ){
                    UIGraphicsBeginImageContext(ourRect.size);
                    CGContextRef context = UIGraphicsGetCurrentContext();
                    
                    // translated rectangle for drawing sub image 
                    CGRect drawRect = CGRectMake(-ourRect.origin.x, -ourRect.origin.y, originalImage.size.width, originalImage.size.height);
                    
                    // clip to the bounds of the image context
                    CGContextClipToRect(context, CGRectMake(0, 0, ourRect.size.width, ourRect.size.height));
                    
                    // draw image
                    [originalImage drawInRect:drawRect];
                    
                    // grab image
                    resultImage = UIGraphicsGetImageFromCurrentImageContext();
                    
                    UIGraphicsEndImageContext();
                }
            }
            
            if (resultImage == nil) {
                resultImage = (editedImage != nil) ? editedImage : originalImage;
            }
            
			media = [[[TiBlob alloc] initWithImage:resultImage] autorelease];
			if (saveToRoll)
			{
				UIImageWriteToSavedPhotosAlbum(resultImage, nil, nil, NULL);
			}
		}
	}
	
	if (ourRectValue != nil)
	{
		CGRect ourRect = [ourRectValue CGRectValue];
		cropRect = [NSDictionary dictionaryWithObjectsAndKeys:
							   [NSNumber numberWithFloat:ourRect.origin.x],@"x",
							   [NSNumber numberWithFloat:ourRect.origin.y],@"y",
							   [NSNumber numberWithFloat:ourRect.size.width],@"width",
							   [NSNumber numberWithFloat:ourRect.size.height],@"height",
							   nil];
	}

	NSMutableDictionary *dictionary = [NSMutableDictionary dictionaryWithObjectsAndKeys:
			mediaType,@"mediaType",media,@"media",nil];

	if (thumbnail!=nil)
	{
		[dictionary setObject:thumbnail forKey:@"thumbnail"];
	}

	if (cropRect != nil)
	{
		[dictionary setObject:cropRect forKey:@"cropRect"];
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

-(void)audioInputChanged:(NSNotification*)note
{
	NSDictionary* event = [NSDictionary dictionaryWithObject:[self canRecord] forKey:@"available"];
	[self fireEvent:@"recordinginput" withObject:event];
}

#pragma mark Listener Management

-(void)_listenerAdded:(NSString *)type count:(int)count
{
	if (count == 1 && [type isEqualToString:@"linechange"])
	{
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe
		[[TiMediaAudioSession sharedSession] startAudioSession]; // Have to start a session to get a listener
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(audioRouteChanged:) name:kTiMediaAudioSessionRouteChange object:[TiMediaAudioSession sharedSession]];
	}
	else if (count == 1 && [type isEqualToString:@"volume"])
	{
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[TiMediaAudioSession sharedSession] startAudioSession]; // Have to start a session to get a listener		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(audioVolumeChanged:) name:kTiMediaAudioSessionVolumeChange object:[TiMediaAudioSession sharedSession]];
	}
	else if (count == 1 && [type isEqualToString:@"recordinginput"])
	{
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[TiMediaAudioSession sharedSession] startAudioSession]; // Have to start a session to get a listener		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(audioInputChanged:) name:kTiMediaAudioSessionInputChange object:[TiMediaAudioSession sharedSession]];
	}
}

-(void)_listenerRemoved:(NSString *)type count:(int)count
{
	if (count == 0 && [type isEqualToString:@"linechange"])
	{
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[TiMediaAudioSession sharedSession] stopAudioSession];
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiMediaAudioSessionRouteChange object:[TiMediaAudioSession sharedSession]];
	}
	else if (count == 0 && [type isEqualToString:@"volume"])
	{
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[TiMediaAudioSession sharedSession] stopAudioSession];		
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiMediaAudioSessionVolumeChange object:[TiMediaAudioSession sharedSession]];
	}
	else if (count == 0 && [type isEqualToString:@"recordinginput"]) 
	{
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[TiMediaAudioSession sharedSession] stopAudioSession];		
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiMediaAudioSessionInputChange object:[TiMediaAudioSession sharedSession]];
	}
}

- (void)videoEditorController:(UIVideoEditorController *)editor_ didSaveEditedVideoToPath:(NSString *)editedVideoPath
{
	id listener = [[editorSuccessCallback retain] autorelease];
	[self closeModalPicker:editor_];
	[self destroyPicker];

	if (listener!=nil)
	{
		TiBlob *media = [[[TiBlob alloc]initWithFile:editedVideoPath] autorelease];
		[media setMimeType:@"video/mpeg" type:TiBlobTypeFile];
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(true),@"success",media,@"media",NUMBOOL(false),@"cancel",nil];
		[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"error",event,listener,nil]];
	}
}

- (void)videoEditorControllerDidCancel:(UIVideoEditorController *)editor_
{ 
	id listener = [[editorCancelCallback retain] autorelease];
	[self closeModalPicker:editor_];
	[self destroyPicker];

	if (listener!=nil) 
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(false),@"success",NUMBOOL(true),@"cancel",nil];
		[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"error",event,listener,nil]];
	}
}

- (void)videoEditorController:(UIVideoEditorController *)editor_ didFailWithError:(NSError *)error
{
	id listener = [[editorErrorCallback retain] autorelease];
	[self closeModalPicker:editor_];
	[self destroyPicker];

	if (listener!=nil)
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(false),@"success",NUMBOOL(false),@"cancel",[error description],@"error",nil];
		[NSThread detachNewThreadSelector:@selector(dispatchCallback:) toTarget:self withObject:[NSArray arrayWithObjects:@"error",event,listener,nil]];
	}
}

@end

#endif