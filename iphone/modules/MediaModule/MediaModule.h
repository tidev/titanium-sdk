/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_MEDIA


#import <Foundation/Foundation.h>
#import "TitaniumModule.h"

typedef enum {
	MediaModuleErrorNone,
	MediaModuleErrorNoCamera,
	MediaModuleErrorNoVideo,
	MediaModuleErrorImagePickerBusy,
	MediaModuleErrorUnknown,
} MediaModuleError;


@class MPMoviePlayerController,MovieWrapper;
@interface MediaModule : NSObject<TitaniumModule,UIImagePickerControllerDelegate,UINavigationControllerDelegate> {
	NSUInteger nextMediaToken;
	NSMutableDictionary * mediaDictionary;

	UIImagePickerController * currentImagePicker;
	NSString * imagePickerCallbackParentPageString;
	BOOL isImagePickerAnimated;
	BOOL saveMediaToRoll;
	
	MPMoviePlayerController * currentMovie;
	MovieWrapper * currentMovieWrapper; //To avoid releasing while playing causing crashes.
	NSString * currentMovieToken;
	BOOL currentMovieIsPlaying;
	
	NSString * pageToken;
	
	NSString *_contentURL;
}

@property(nonatomic,readwrite,copy)	NSString * imagePickerCallbackParentPageString;
@property(nonatomic,readwrite,copy) NSString * currentMovieToken;
@property(nonatomic,readwrite,retain) MovieWrapper * currentMovieWrapper;

- (void) passivelyPreloadMovie: (NSString *) token;
- (void) stopMovie: (NSString *) token;

@end

/**********Media top level events
 * @tiapi(method=True,name=Media.beep,since=0.4) Causes the system to make an alert noise and/or vibrate
 * @tiapi(method=True,name=Media.vibrate,since=0.4) Causes the system to vibrate
 *
 * @tiapi(method=True,name=Media.createSound,since=0.4) Creates a sound object
 * @tiarg(for=Media.createSound,name=path,type=string) relative or absolute url to the sound file
 * @tiresult(for=Media.createSound,type=Media.Sound) a Media.Sound object
 *
 * @tiapi(method=True,name=Media.createVideoPlayer,since=0.4) Creates a video-playing object
 * @tiarg(for=Media.createVideoPlayer,name=settings,type=object) Object specifying videoplayer properties. These include the contentURL (required), scalingMode (optional), backgroundColor (optional), and movieControlMode (optional).
 * @tiresult(for=Media.createVideoPlayer,type=Media.VideoPlayer) a Media.VideoPlayer object
 * 
 * @tiapi(method=True,name=Media.showCamera,since=0.4) Presents the camera interface to the user to let them take a photo
 * @tiarg(for=Media.showCamera,name=settings,type=object) Object specifying camera properties and callbacks. These include the cancel, error, and success callbacks; and animated, allowImageEditing, and saveToPhotoGallery booleans
 * @tiresult(for=Media.showCamera,type=boolean) whether or not the camera dialog was presented
 * 
 * @tiapi(method=True,name=Media.openPhotoGallery,since=0.4) Presents the image picker interface to the user to let them choose an image from their image gallery
 * @tiarg(for=Media.openPhotoGallery,name=settings,type=object) Object specifying camera properties and callbacks. These include the cancel, error, and success callbacks; and animated, allowImageEditing, and saveToPhotoGallery booleans
 * @tiresult(for=Media.openPhotoGallery,type=boolean) whether or not the image picker dialog was presented
 * 
 * @tiapi(method=True,name=Media.saveToPhotoGallery,since=0.4) Saves an image blob to the camera roll. This can be done automatically with showCamera or openPhotoGallery with the saveToPhotoGallery boolean.
 * @tiarg(for=Media.saveToPhotoGallery,name=image,type=object) Image blob to store.
 
 **********Media.Sound functions
 * @tiapi(method=True,name=Media.Sound.play,since=0.4) Plays the file referenced by a Sound object
 * @tiapi(method=True,name=Media.Sound.pause,since=0.4) Pauses a currently playing Sound object
 * @tiapi(method=True,name=Media.Sound.stop,since=0.4) Stops a currently playing Sound object
 * @tiapi(method=True,name=Media.Sound.reset,since=0.4) Moves the starting point to the beginning. If the music was paused, this is the same as pressing stop. If the music was playing, the sound will start playing from the start.
 * @tiapi(method=True,name=Media.Sound.release,since=0.4) Invalidates the sound object and frees associated memory
 *
 * @tiapi(method=True,name=Media.Sound.setVolume,since=0.4) Sets the volume value of a Sound object
 * @tiarg(for=Media.Sound.setVolume,type=double,name=volume) the volume value of the sound, from 0.0 to 1.0
 *
 * @tiapi(method=True,name=Media.Sound.getVolume,since=0.4) Returns the volume value of a Sound object
 * @tiresult(for=Media.Sound.getVolume,type=double) returns the volume of the sound
 *
 * @tiapi(method=True,name=Media.Sound.setLooping,since=0.4) Sets the looping of a Sound object
 * @tiarg(for=Media.Sound.setLooping,name=loop,type=boolean) true to set the Sound object to loop, false to remove looping
 *
 * @tiapi(method=True,name=Media.Sound.isLooping,since=0.4) Checks whether a Sound object is set to loop
 * @tiresult(for=Media.Sound.isLooping,type=boolean) true if the Sound object is set to loop, false if otherwise
 *
 * @tiapi(method=True,name=Media.Sound.isPlaying,since=0.4) Checks whether a Sound object is currently playing
 * @tiresult(for=Media.Sound.isPlaying,type=boolean) returns true if the Sound object is currently playing, false if otherwise
 *
 * @tiapi(method=True,name=Media.Sound.isPaused,since=0.4) Checks whether a Sound object is paused
 * @tiresult(for=Media.Sound.isPaused,type=boolean) returns true if the Sound object is pause, false if otherwise
 *
 * @tiapi(method=True,returns=integer,name=Media.Sound.addEventListener,since=0.4) add an event listener to be called for a Media.Sound event and returns the function to use when removing
 * @tiarg(for=Media.Sound.addEventListener,type=string,name=type) the type of Media.Sound event to listen for. May be either 'complete' or 'error'
 * @tiarg(for=Media.Sound.addEventListener,type=method,name=listener) listener method
 * @tiresult(for=Media.Sound.addEventListener,type=function) return the listener to be used as an id
 *
 * @tiapi(method=True,name=Media.Sound.removeEventListener,since=0.4) removes an event listener from Media.Sound events
 * @tiarg(for=Media.Sound.removeEventListener,type=string,name=type) the type of event to be removed from addEventListener
 * @tiarg(for=Media.Sound.removeEventListener,type=function,name=id) the function to be removed from addEventListener
 * @tiresult(for=Media.Sound.removeEventListener,type=boolean) return true if removed
 
 *************Media.VideoPlayer functions
 * 
 * @tiapi(method=True,name=Media.VideoPlayer.play,since=0.4) Presents the video player and plays the file referenced by a VideoPlayer object
 * @tiapi(method=True,name=Media.VideoPlayer.stop,since=0.4) If this videoPlayer is playing, stops the video player and hides it.
 * @tiapi(method=True,name=Media.VideoPlayer.release,since=0.4) Invalidates the VideoPlayer object and frees associated memory
 *
 * @tiapi(method=True,returns=integer,name=Media.VideoPlayer.addEventListener,since=0.4) add an event listener to be called for a Media.VideoPlayer event and returns the function to use when removing
 * @tiarg(for=Media.VideoPlayer.addEventListener,type=string,name=type) the type of Media.VideoPlayer event to listen for. Currently no events are generated. TODO: define events
 * @tiarg(for=Media.VideoPlayer.addEventListener,type=method,name=listener) listener method
 * @tiresult(for=Media.VideoPlayer.addEventListener,type=function) return the listener to be used as an id
 *
 * @tiapi(method=True,name=Media.VideoPlayer.removeEventListener,since=0.4) removes an event listener from Media.VideoPlayer events
 * @tiarg(for=Media.VideoPlayer.removeEventListener,type=string,name=type) the type of event to be removed from addEventListener
 * @tiarg(for=Media.VideoPlayer.removeEventListener,type=function,name=id) the function to be removed from addEventListener
 * @tiresult(for=Media.VideoPlayer.removeEventListener,type=boolean) return true if removed
 
 * initialPlaybackTime: time in milliseconds that the movie will start from
 * movieControlMode: mode on which controls are visible.
 * scalingMode: scaling mode
 * backgroundColor: color for the areas that aren't covered by the movie

 **********Media top level property/constants

 * @tiapi(property=True,name=Media.UNKNOWN_ERROR,since=0.4,type=int) integer error indicating an unknown error occured with the camera or image picker
 * @tiapi(property=True,name=Media.DEVICE_BUSY,since=0.4,type=int) integer error indicating the camera or image picker is already in use
 * @tiapi(property=True,name=Media.NO_CAMERA,since=0.4,type=int) integer error indicating the camera does not exist on the device
 * @tiapi(property=True,name=Media.NO_VIDEO,since=0.8,type=int) integer error indicating that video recording capabilities does not exist on the device

 * @tiapi(property=True,name=Media.VIDEO_CONTROL_DEFAULT,since=0.4,type=int) movieControlMode that allows showing all controls while playing a movie 
 * @tiapi(property=True,name=Media.VIDEO_CONTROL_VOLUME_ONLY,since=0.4,type=int) movieControlMode that allows showing only volume controls while playing a movie
 * @tiapi(property=True,name=Media.VIDEO_CONTROL_HIDDEN,since=0.4,type=int) movieControlMode that hides all controls while playing a movie
 * @tiapi(property=True,name=Media.VIDEO_SCALING_NONE,since=0.4,type=int) scalingMode that leaves the movie unscaled. If the movie is smaller than the screen, the region between the edge of the movie and the edge of the screen is filled with the background color.
 * @tiapi(property=True,name=Media.VIDEO_SCALING_ASPECT_FIT,since=0.4,type=int) scalingMode to scale the movie until one dimension fits on the screen exactly. In the other dimension, the region between the edge of the movie and the edge of the screen is filled with the background color. The aspect ratio of the movie is preserved.
 * @tiapi(property=True,name=Media.VIDEO_SCALING_ASPECT_FILL,since=0.4,type=int) scalingMode to scale the movie until the movie fills the entire screen. Content at the edges of the larger of the two dimensions is clipped so that the other dimension fits the screen exactly. The aspect ratio of the movie is preserved.
 * @tiapi(property=True,name=Media.VIDEO_SCALING_MODE_FILL,since=0.4,type=int) scalingMode to scale the movie until both dimensions fit the screen exactly. The aspect ratio of the movie is not preserved.
 */

#endif
