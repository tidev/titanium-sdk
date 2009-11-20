/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_MEDIA

#import "MediaModule.h"
#import <AudioToolbox/AudioToolbox.h>
#import <AVFoundation/AVAudioPlayer.h>
#import <MediaPlayer/MediaPlayer.h>
#import <MobileCoreServices/UTCoreTypes.h>
#import "TitaniumBlobWrapper.h"
#import "Logging.h"

NSString * const iPhoneSoundGeneratorFunction = @"function(token){"
	"var result={"
		"_TOKEN:token, _PATH:'Media._MEDIA.'+token,"
		"_EVT:{complete:[],error:[]},addEventListener:Titanium._ADDEVT,removeEventListener:Ti._REMEVT,"
		"onComplete:Ti._ONEVT,"
		"play:function(){return Ti._TICMD(this._PATH,'play',arguments);},"
		"getVolume:function(){return Ti._TICMD(this._PATH,'getVolume',arguments);},"
		"isLooping:function(){return Ti._TICMD(this._PATH,'isLooping',arguments);},"
		"isPaused:function(){return Ti._TICMD(this._PATH,'isPaused',arguments);},"
		"isPlaying:function(){return Ti._TICMD(this._PATH,'isPlaying',arguments);},"
		"pause:function(){return Ti._TICMD(this._PATH,'pause',arguments);},"
		"reset:function(){return Ti._TICMD(this._PATH,'reset',arguments);},"
		"stop:function(){return Ti._TICMD(this._PATH,'stop',arguments);},"
		"setLooping:function(){return Ti._TICMD(this._PATH,'setLooping',arguments);},"
		"setVolume:function(){return Ti._TICMD(this._PATH,'setVolume',arguments);},"
		"release:function(){return Ti.Media._REL(this._TOKEN);},"
	"};"
	"Ti.Media._MEDIA[token]=result;"
	"return result;"
"}";

@interface SoundWrapper : TitaniumProxyObject<AVAudioPlayerDelegate>
{
//Connections to the native side
	AVAudioPlayer * nativePlayer;
	NSURL * soundUrl;
	NSData * soundData;
	NSURLConnection * soundConnection;
	
	NSTimeInterval resumeTime;
	CGFloat volume;
	BOOL isLooping;
	
}

@property(nonatomic,readonly,retain) AVAudioPlayer * nativePlayer;

@end

@implementation SoundWrapper

- (AVAudioPlayer *) nativePlayer;
{
	if (nativePlayer == nil){
		NSError * resultError = nil;
		nativePlayer = [[AVAudioPlayer alloc] initWithContentsOfURL:soundUrl error:(NSError **)&resultError];
		[nativePlayer setDelegate:self];
		[nativePlayer prepareToPlay];
		[nativePlayer setVolume:volume];
		[nativePlayer setNumberOfLoops:(isLooping?-1:0)];
		[nativePlayer setCurrentTime:resumeTime];
		if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerCreated:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(nativePlayer),@"player",nil]];
		if (resultError != nil){
			NSLog(@"[ERROR] ERROR MAKING SOUND: %@ (%@)",soundUrl,resultError);
		}
	}
	return nativePlayer;
}


- (id) initWithContentsOfURL:(NSURL *) newSoundURL;
{
	if ((self = [super init])){
		volume = 1.0;
		soundUrl = [newSoundURL retain];
		if ([self nativePlayer] == nil){
			[self release];
			return nil;
		}
	}
	return self;
}

- (void)flushCache;
{
	if ((nativePlayer == nil) || [nativePlayer isPlaying]) return;
	resumeTime = [nativePlayer currentTime];
	volume = [nativePlayer volume];
	isLooping = ([nativePlayer numberOfLoops] < 0);
	[nativePlayer release];
	nativePlayer = nil;
}

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag;
{
	// fire event listener
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerDidFinishPlaying:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(player),@"player",[NSNumber numberWithBool:flag],@"success",nil]];

	NSString * resultString = [NSString stringWithFormat:@"Ti.Media._MEDIA.%@.onComplete('complete',{"
							   "type:'complete',success:%@})",
							   token,(flag ? @"true" : @"false")];
	
	[self sendJavascript:resultString];

}

- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player error:(NSError *)error;
{
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerDecodeErrorDidOccur:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(player),@"player",VAL_OR_NSNULL(error),@"error",nil]];

	NSString * resultString = [NSString stringWithFormat:@"Ti.Media._MEDIA.%@.onComplete('error',{"
							   "type:'error',success:false,message:%@})",
							   token,[error localizedDescription]];
	
	[self sendJavascript:resultString];
}

- (void)audioPlayerBeginInterruption:(AVAudioPlayer *)player;
{
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerBeginInterruption:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(player),@"player",nil]];

	VERBOSE_LOG(@"[DEBUG] SOUND INTERRUPTION STARTED!");
}

- (void)audioPlayerEndInterruption:(AVAudioPlayer *)player;
{
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerEndInterruption:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(player),@"player",nil]];

	VERBOSE_LOG(@"[DEBUG] SOUND INTERRUPTION FINISHED!");
}


- (void) dealloc
{
	[nativePlayer stop];
	[nativePlayer release];
	[soundUrl release];
	[super dealloc];
}
- (id) runFunctionNamed: (NSString *) functionName withObject: (id) objectValue error: (NSError **) error;
{
	if ([functionName isEqualToString:@"play"]){ //Resume is mapped to play.
		[nativePlayer play];
		if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerPlay:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL([self nativePlayer]),@"player",nil]];
	} else if ([functionName isEqualToString:@"pause"]) {
		[nativePlayer pause];
		if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerPause:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL([self nativePlayer]),@"player",nil]];
	} else if ([functionName isEqualToString:@"reset"]) {
		[nativePlayer setCurrentTime:0];
		if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerReset:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL([self nativePlayer]),@"player",nil]];
		resumeTime = 0;
	} else if ([functionName isEqualToString:@"stop"]) {
		if (nativePlayer != nil){
			[nativePlayer stop];
			[nativePlayer setCurrentTime:0];
			if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerStop:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL([self nativePlayer]),@"player",nil]];
		}
		resumeTime = 0;

	} else if ([functionName isEqualToString:@"getVolume"]) {
		return [NSNumber numberWithFloat:volume]; //We keep this current.

	} else if ([functionName isEqualToString:@"isLooping"]) {
		if (nativePlayer != nil){
			return [NSNumber numberWithBool:([nativePlayer numberOfLoops] != 0)];			
		}
		return [NSNumber numberWithBool:(isLooping != 0)];

	} else if ([functionName isEqualToString:@"isPaused"]) {
		if (nativePlayer != nil){
			return [NSNumber numberWithBool:![nativePlayer isPlaying] && ([nativePlayer currentTime] != 0)];
		}
		return [NSNumber numberWithBool:resumeTime != 0];

	} else if ([functionName isEqualToString:@"isPlaying"]) {
		return [NSNumber numberWithBool:[nativePlayer isPlaying]];

	} else if ([functionName isEqualToString:@"setLooping"]) {
		id boolObject = nil;
		if ([objectValue isKindOfClass:[NSArray class]] && [objectValue count]>0) boolObject = [objectValue objectAtIndex:0];
		if ([boolObject respondsToSelector:@selector(boolValue)]) {
			isLooping = [boolObject boolValue];
			[nativePlayer setNumberOfLoops:(isLooping?-1:0)];
			if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerSetLooping:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL([self nativePlayer]),@"player",[NSNumber numberWithBool:isLooping],@"isLooping",nil]];
		}
	} else if ([functionName isEqualToString:@"setVolume"]) {
		id floatObject = nil;
		if ([objectValue isKindOfClass:[NSArray class]] && [objectValue count]>0) floatObject = [objectValue objectAtIndex:0];
		if ([floatObject respondsToSelector:@selector(floatValue)]) {
			volume = [floatObject floatValue];
			[nativePlayer setVolume:volume];
			if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventAudioPlayerSetVolume:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL([self nativePlayer]),@"player",[NSNumber numberWithFloat:volume],"volume",nil]];
		}
	}
	return nil;
}
@end


@interface MovieWrapper : TitaniumProxyObject
{
	//Connections to the native side
	NSURL *contentURL;
	UIColor *backgroundColor;
	MPMovieScalingMode scalingMode;
	MPMovieControlMode movieControlMode;
	NSTimeInterval initialPlaybackTime;
	MediaModule * module;
}

@property(nonatomic, readwrite, retain) NSURL *contentURL;
@property(nonatomic, retain) UIColor *backgroundColor;
@property(nonatomic) MPMovieScalingMode scalingMode;
@property(nonatomic) MPMovieControlMode movieControlMode;
@property(nonatomic) NSTimeInterval initialPlaybackTime;

@end

@implementation MovieWrapper
@synthesize contentURL, backgroundColor, scalingMode, movieControlMode, initialPlaybackTime;

- (MPMoviePlayerController *) newMoviePlayerController;
{
	MPMoviePlayerController * result = [[MPMoviePlayerController alloc] initWithContentURL:contentURL];
	[result setScalingMode:scalingMode];
	[result setMovieControlMode:movieControlMode];
	[result setBackgroundColor:backgroundColor];
	if([result respondsToSelector:@selector(setInitialPlaybackTime:)])[result setInitialPlaybackTime:initialPlaybackTime];
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventMoviePlayerCreated:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(result),@"player",nil]];
	return result;
}

- (id) initWithDict: (NSDictionary *) arguments module:(MediaModule*)module_
{
	self = [super init];
	if (self == nil) return nil;
	
	NSString * movieUrlString = [arguments objectForKey:@"contentURL"];	
	NSURL * ourUrl = [[TitaniumHost sharedHost] resolveUrlFromString:movieUrlString useFilePath:YES];
	if (ourUrl == nil) {
		[self release]; return nil;
	}
	
	module = [module_ retain];
	
	contentURL = [ourUrl retain];
	
	NSNumber * initialPlaybackTimeObject = [arguments objectForKey:@"initialPlaybackTime"];
	if ([initialPlaybackTimeObject respondsToSelector:@selector(floatValue)]) initialPlaybackTime =[initialPlaybackTimeObject floatValue]/1000.0;
	
	NSNumber * movieControlModeObject = [arguments objectForKey:@"movieControlMode"];
	if ([movieControlModeObject respondsToSelector:@selector(intValue)]) movieControlMode =[movieControlModeObject intValue];
	else movieControlMode = MPMovieControlModeDefault;

	NSNumber * scalingModeObject = [arguments objectForKey:@"scalingMode"];
	if ([scalingModeObject respondsToSelector:@selector(intValue)]) scalingMode =[scalingModeObject intValue];
	else scalingMode=MPMovieScalingModeAspectFit;
	
	NSString * colorObject = [arguments objectForKey:@"backgroundColor"];
	backgroundColor =[UIColorWebColorNamed(colorObject) retain];

	return self;
}

- (void) handlePlayerFinished: (NSDictionary *) userInfo;
{
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventMoviePlayerFinished:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(userInfo),@"userInfo",nil]];
	[module moviePlayerCallback:YES];
	NSString * commandString = [[NSString alloc] initWithFormat:@"Ti.Media._MEDIA.%@.doEvent('complete',{type:'complete'})",token];
	[self sendJavascript:commandString];
	[commandString release];
	[module moviePlayerCallback:YES];
}

- (void) dealloc
{
	[contentURL release]; 
	[backgroundColor release];
	[module release];
	[super dealloc];
}

@end




@implementation MediaModule
@synthesize imagePickerCallbackParentPageString, currentMovieToken, currentMovieWrapper;

#pragma mark Simple soundthings

- (void) beep;
{
	AudioServicesPlayAlertSound(kSystemSoundID_Vibrate);
	//TODO: Use a Titanium-supplied sound.
}

- (void) vibe;
{
	AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

#pragma mark Create Sound/Video player

- (void)releaseToken:(NSString *) token;
{
	if (![token isKindOfClass:[NSString class]]) return;
	[self stopMovie:token]; //If a movie, this will stop it.
	[mediaDictionary removeObjectForKey:token]; //If a sound, deallocing will stop it.
}

- (void) moviePlayerCallback: (BOOL)yn
{
	isMediaCallback = yn;
}

- (TitaniumJSCode *) createSound: (id) soundResource;
{
	NSString * path = nil;
	SoundWrapper * nativeResult = nil;
	
	if ([soundResource isKindOfClass:[NSString class]]){
		path = soundResource;
	} else if ([soundResource isKindOfClass:[NSDictionary class]]) {
		path = [soundResource objectForKey:@"path"];
		if (![path isKindOfClass:[NSString class]]) return nil;
	}
	
	NSURL * fileUrl = [[TitaniumHost sharedHost] resolveUrlFromString:path useFilePath:YES];
	
	nativeResult = [[SoundWrapper alloc] initWithContentsOfURL:fileUrl];
	
	if(nativeResult==nil){
		return nil;
	}
	
	NSString * soundToken = [NSString stringWithFormat:@"SND%X",nextMediaToken++];
	[nativeResult setToken:soundToken];

	[mediaDictionary setObject:nativeResult forKey:soundToken];
	[nativeResult release];
	
	NSString * result = [NSString stringWithFormat:@"Titanium.Media._SNDGEN('%@')",soundToken];
	return [TitaniumJSCode codeWithString:result];
}

- (NSString *) createMovieProxy: (id) arguments;
{
	if (![arguments isKindOfClass:[NSDictionary class]])return nil;

	NSString * movieUrlString = [arguments objectForKey:@"contentURL"];
	
	[movieURL release];
	//TODO:dealloc
	movieURL = [movieUrlString retain];
	
	if (![movieUrlString isKindOfClass:[NSString class]]) return nil;

//	MovieWrapper * result = [[MovieWrapper alloc] initWithDict:arguments module:self];
	NSString * videoToken = [NSString stringWithFormat:@"MOV%X",nextMediaToken++];
//	[result setToken:videoToken];
	
//	[mediaDictionary setObject:result forKey:videoToken];
//	[result release];
	[self passivelyPreloadMovie:videoToken];
	
	return videoToken;
}

#pragma mark Movie nannying

- (void) passivelyPreloadMovie: (NSString *) token;
{
	if (currentMovie != nil) return;
	if (![NSThread isMainThread]){
		[self performSelectorOnMainThread:@selector(passivelyPreloadMovie:) withObject:token waitUntilDone:NO];
		return;
	}
	
	[self setCurrentMovieToken:token];
	

	/*
	 [self setCurrentMovieWrapper:[mediaDictionary objectForKey:token]];
	currentMovie = [currentMovieWrapper newMoviePlayerController];
	if (currentMovie == nil) return;
	
	[self setCurrentMovieToken:token];
	if (currentMovieIsPlaying) [currentMovie play];
	 */
}

- (void)backgroundPlayMovie
{
	if (![NSThread isMainThread])
	{
		sleep(2);
		[self performSelectorOnMainThread:@selector(backgroundPlayMovie) withObject:nil waitUntilDone:NO];
		return;
	}
	
	NSURL * contentURL = [[TitaniumHost sharedHost] resolveUrlFromString:movieURL useFilePath:YES]; //FIXME
	MPMoviePlayerController * result = [[MPMoviePlayerController alloc] initWithContentURL:contentURL];
	[result play];
}

- (void) playMovie: (NSString *) token;
{
	NSLog(@"in callback = %d", isMediaCallback);
	
	if (![token isKindOfClass:[NSString class]]) return;
	if (![NSThread isMainThread]){
		[self performSelectorOnMainThread:@selector(playMovie:) withObject:token waitUntilDone:NO];
		return;
	}
	

	if (![token isEqualToString:currentMovieToken] || currentMovieIsPlaying){ //We're not preloaded.
		//Kill the old movie, and install a new regieme.
		
		[currentMovie stop];[currentMovie release];
		
		currentMovieIsPlaying = NO;
		[self setCurrentMovieWrapper:[mediaDictionary objectForKey:token]];
		currentMovie = [currentMovieWrapper newMoviePlayerController];
		if (currentMovie == nil) return;
		[self setCurrentMovieToken:token];
	}
	
	
	currentMovieIsPlaying = YES;
	
	[NSThread detachNewThreadSelector:@selector(backgroundPlayMovie) toTarget:self withObject:nil];
}

- (void) stopMovie: (NSString *) token;
{
	if (![token isKindOfClass:[NSString class]]) return;
	if (![token isEqualToString:currentMovieToken]) return;
	if (![NSThread isMainThread]){
		[currentMovie performSelectorOnMainThread:@selector(stop) withObject:nil waitUntilDone:NO];
		return;
	}
	[currentMovie stop];
}

- (void) handlePlayerNotification: (NSNotification *) theNotification;
{
	if ([theNotification object] != currentMovie) return;
	NSString * notificationType = [theNotification name];
	
//	VERBOSE_LOG(@"[DEBUG] HandlePlayer: %@ = %@",theNotification,[theNotification userInfo]);
	NSLog(@"[DEBUG] HandlePlayer: %@ = %@",theNotification,[theNotification userInfo]);
	
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventMoviePlayerNotification:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(theNotification),@"notification",VAL_OR_NSNULL(mediaDictionary),"dictionary",nil]];

	if ([notificationType isEqualToString:MPMoviePlayerPlaybackDidFinishNotification]){
		MovieWrapper * cmw = [mediaDictionary objectForKey:currentMovieToken];
		[cmw handlePlayerFinished:[theNotification userInfo]];
		[currentMovie release]; currentMovie = nil;
		[currentMovieToken release]; currentMovieToken = nil;
		[cmw release]; currentMovieWrapper = nil;
		currentMovieIsPlaying = NO;
	}
	//	MP_EXTERN NSString *const MPMoviePlayerContentPreloadDidFinishNotification; // userInfo contains NSError for @"error" key if preloading fails
	//	MP_EXTERN NSString *const MPMoviePlayerScalingModeDidChangeNotification;
	//	MP_EXTERN NSString *const MPMoviePlayerPlaybackDidFinishNotification;
	
	//	[[TitaniumHost sharedHost] sendJavascript:resultString toPageWithToken:parentPageToken];
}


#pragma mark Image picker

- (id) startPicker: (NSNumber *) isCameraObject options: (id) arguments;
{
	if(currentImagePicker != nil) return [TitaniumJSCode codeWithString:@"{code:Ti.Media.DEVICE_BUSY}"];
	if(![isCameraObject respondsToSelector:@selector(boolValue)])return [TitaniumJSCode codeWithString:@"{code:Ti.Media.UNKNOWN_ERROR}"]; //Shouldn't happen.
	BOOL isCamera = [isCameraObject boolValue];
	
	[self setImagePickerCallbackParentPageString:[[[TitaniumHost sharedHost] currentThread] magicToken]];
	currentImagePicker = [[UIImagePickerController alloc] init];
	[currentImagePicker setDelegate:self];

	
	//The promised land! Let's set stuff up!
	isImagePickerAnimated = YES;
	saveMediaToRoll = NO;

	if([arguments isKindOfClass:[NSDictionary class]]){
		NSNumber * animatedObject = [arguments objectForKey:@"animated"];
		NSNumber * imageEditingObject = [arguments objectForKey:@"allowImageEditing"];
		NSNumber * saveToRollObject = [arguments objectForKey:@"saveToPhotoGallery"];

		if([animatedObject respondsToSelector:@selector(boolValue)]){
			isImagePickerAnimated = [animatedObject boolValue];
		}
		
		if([imageEditingObject respondsToSelector:@selector(boolValue)]){
			[currentImagePicker setAllowsImageEditing:[imageEditingObject boolValue]];
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= 310000
			// introduced in 3.1
			[currentImagePicker setAllowsEditing:[imageEditingObject boolValue]];
#endif
		}
		
		if([saveToRollObject respondsToSelector:@selector(boolValue)]){
			saveMediaToRoll = [saveToRollObject boolValue];
		}
				
		NSArray *sourceTypes = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
		id types = [arguments objectForKey:@"mediaTypes"];
		
		NSLog(@"[INFO] types = %@, sourceTypes = %@",types,sourceTypes);
		
		if ([types isKindOfClass:[NSArray class]])
		{
			for (int c=0;c<[types count];c++)
			{
				if ([[types objectAtIndex:c] isEqualToString:(NSString*)kUTTypeMovie])
				{
					if (![sourceTypes containsObject:(NSString *)kUTTypeMovie])
					{
						// no movie type supported...
						[currentImagePicker release];
						currentImagePicker=nil;
						return [TitaniumJSCode codeWithString:@"{code:Ti.Media.NO_VIDEO}"];
					}
				}
			}
			currentImagePicker.mediaTypes = [NSArray arrayWithArray:types];
		}
		else if ([types isKindOfClass:[NSString class]])
		{
			if ([types isEqualToString:(NSString*)kUTTypeMovie] && ![sourceTypes containsObject:(NSString *)kUTTypeMovie])
			{
				// no movie type supported...
				[currentImagePicker release];
				currentImagePicker=nil;
				return [TitaniumJSCode codeWithString:@"{code:Ti.Media.NO_VIDEO}"];
			}
			currentImagePicker.mediaTypes = [NSArray arrayWithObject:types];
		}

		// introduced in 3.1
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= 310000
		id videoMaximumDuration = [arguments objectForKey:@"videoMaximumDuration"];
		if ([videoMaximumDuration respondsToSelector:@selector(doubleValue)])
		{
			[currentImagePicker setVideoMaximumDuration:[videoMaximumDuration doubleValue]];
		}
		id videoQuality = [arguments objectForKey:@"videoQuality"];
		if ([videoQuality respondsToSelector:@selector(doubleValue)])
		{
			[currentImagePicker setVideoQuality:[videoQuality doubleValue]];
		}
#endif
	}
	
	// do this afterwards above so we can first check for video support

	UIImagePickerControllerSourceType ourSource = (isCamera ? UIImagePickerControllerSourceTypeCamera : UIImagePickerControllerSourceTypePhotoLibrary);
	if (![UIImagePickerController isSourceTypeAvailable:ourSource])
	{
		[currentImagePicker release];
		currentImagePicker=nil;
		return [TitaniumJSCode codeWithString:@"{code:Ti.Media.NO_CAMERA}"];
	}
	[currentImagePicker setSourceType:ourSource];
	
	
	TitaniumHost * theHost = [TitaniumHost sharedHost];
	UINavigationController * theNavController = [[theHost currentTitaniumViewController] navigationController];

	[theHost navigationController:theNavController presentModalView:currentImagePicker animated:isImagePickerAnimated];

	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventCameraShown:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(theNavController),@"navController",VAL_OR_NSNULL(currentImagePicker),@"picker",VAL_OR_NSNULL(arguments),@"arguments",nil]];

	return nil;
}

// NOTE: this method delegate is deprecated in 3.0 but we keep it for 2.2
- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingImage:(UIImage *)image editingInfo:(NSDictionary *)editingInfo;
{
	NSMutableString * resultString = [NSMutableString stringWithString:@"Ti.Media._PIC.success("];
	TitaniumBlobWrapper * ourImageBlob = [[TitaniumHost sharedHost] blobForImage:image];
	if (ourImageBlob != nil) [resultString appendString:[ourImageBlob stringValue]];
	
	if (saveMediaToRoll) 
	{
		UIImageWriteToSavedPhotosAlbum(image, nil, nil, NULL);
	}
	
	if (editingInfo != nil) {
		[resultString appendString:@",{"];
		TitaniumBlobWrapper * oldImageBlob = [[TitaniumHost sharedHost] blobForImage:[editingInfo objectForKey:UIImagePickerControllerOriginalImage]];
		if (oldImageBlob != nil){
			[resultString appendFormat:@"oldImage:%@,",[oldImageBlob stringValue]];
		}
		NSValue * ourRectValue = [editingInfo objectForKey:UIImagePickerControllerCropRect];
		if (ourRectValue != nil){
			CGRect ourRect = [ourRectValue CGRectValue];
			[resultString appendFormat:@"cropRect:{x:%f,y:%f,width:%f,height:%f},",
					ourRect.origin.x, ourRect.origin.y, ourRect.size.width, ourRect.size.height];
		}
		[resultString appendString:@"}"];
	}
	[resultString appendString:@")"];

	[[picker parentViewController] dismissModalViewControllerAnimated:isImagePickerAnimated];

	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventCameraFinished:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(picker),@"picker",VAL_OR_NSNULL(image),@"image",VAL_OR_NSNULL(editingInfo),@"info",VAL_OR_NSNULL(ourImageBlob),@"blob",nil]];

	[currentImagePicker release];
	currentImagePicker = nil;
	[[TitaniumHost sharedHost] sendJavascript:resultString toPageWithToken:imagePickerCallbackParentPageString];
}

- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)editingInfo
{
	
	[[picker parentViewController] dismissModalViewControllerAnimated:isImagePickerAnimated];

	NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
	
	TitaniumBlobWrapper *media = nil;
	
	NSString *mediaType = [editingInfo objectForKey:UIImagePickerControllerMediaType];
	[dictionary setObject:mediaType forKey:@"mediaType"];

	NSURL *mediaURL = [editingInfo objectForKey:UIImagePickerControllerMediaURL];
	if (mediaURL!=nil)
	{
		// this is a video, get the path to the URL
		media = [[TitaniumHost sharedHost] blobForUrl:mediaURL];
		if (saveMediaToRoll)
		{
			NSString *tempFilePath = [mediaURL absoluteString];
			UISaveVideoAtPathToSavedPhotosAlbum(tempFilePath, nil, nil, NULL);
		}
	}
	
	if (media==nil)
	{
		UIImage *image = [editingInfo objectForKey:UIImagePickerControllerEditedImage];
		if (image==nil)
		{
			image = [editingInfo objectForKey:UIImagePickerControllerOriginalImage];
		}
		media = [[TitaniumHost sharedHost] blobForImage:image];
		if (saveMediaToRoll)
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
	
	

	[currentImagePicker release];
	currentImagePicker = nil;

//	NSString * resultString = [NSString stringWithFormat:@"Ti.Media._PIC.success(%@,%@);",[media stringValue],[SBJSON stringify:dictionary]];
	NSString * resultString = [NSString stringWithFormat:@"Ti.Media._PIC.success('%@',%@);",[mediaURL absoluteString],[SBJSON stringify:dictionary]];
	[[TitaniumHost sharedHost] sendJavascript:resultString toPageWithToken:imagePickerCallbackParentPageString];
	
	
	/*
	TitaniumBlobWrapper * ourImageBlob = [[TitaniumHost sharedHost] blobForImage:image];
	if (ourImageBlob != nil) [resultString appendString:[ourImageBlob stringValue]];
	
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= 300000
	NSString *mediaType = [editingInfo objectForKey:UIImagePickerControllerMediaType];
	if ([mediaType isEqualToString:kUTTypeMovie])
	{
		NSString *tempFilePath = [(NSURL *)[info valueForKey:UIImagePickerControllerMediaURL] absoluteString];
		//	// e.g. /private/var/mobile/Applications/D1E784A4-EC1A-402B-81BF-F36D3A08A332/tmp/capture/capturedvideo.MOV
		//tempFilePath = [[tempFilePath substringFromIndex:16] retain];
		UISaveVideoAtPathToSavedPhotosAlbum(tempFilePath, nil, nil, NULL);
	}
	else 
	{
		UIImageWriteToSavedPhotosAlbum(image, nil, nil, NULL);
	}
#else
	UIImageWriteToSavedPhotosAlbum(image, nil, nil, NULL);
#endif
	
	if (editingInfo != nil) {
		[resultString appendString:@",{"];
		TitaniumBlobWrapper * oldImageBlob = [[TitaniumHost sharedHost] blobForImage:[editingInfo objectForKey:UIImagePickerControllerOriginalImage]];
		if (oldImageBlob != nil){
			[resultString appendFormat:@"oldImage:%@,",[oldImageBlob stringValue]];
		}
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= 300000
		[resultString appendFormat:@"mediaType:'%@',",[editingInfo objectForKey:UIImagePickerControllerMediaType]];
#endif
		NSValue * ourRectValue = [editingInfo objectForKey:UIImagePickerControllerCropRect];
		if (ourRectValue != nil){
			CGRect ourRect = [ourRectValue CGRectValue];
			[resultString appendFormat:@"cropRect:{x:%f,y:%f,width:%f,height:%f},",
			 ourRect.origin.x, ourRect.origin.y, ourRect.size.width, ourRect.size.height];
		}
		[resultString appendString:@"}"];
	}*/
	

// EXAMPLE SAVING VIDEO	from http://stackoverflow.com/questions/1259316/iphone-sdk-3-0-video-thumbnail
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker;
{
	[[TitaniumHost sharedHost] sendJavascript:@"Ti.Media._PIC.cancel()" toPageWithToken:imagePickerCallbackParentPageString];
	[[picker parentViewController] dismissModalViewControllerAnimated:isImagePickerAnimated];
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventCameraCancelled:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(picker),@"picker",nil]];
	[currentImagePicker release];
	currentImagePicker = nil;
}

#pragma mark Image storing

- (void)saveImageToRoll: (TitaniumBlobWrapper *) savedImageBlob;
{
	if (![savedImageBlob isKindOfClass:[TitaniumBlobWrapper class]])return;
	UIImage * savedImage = [savedImageBlob imageBlob];
	if (savedImage == nil) return;
	
	if ([[TitaniumHost sharedHost] hasListeners]) [[TitaniumHost sharedHost] fireListenerAction:@selector(eventSaveImageToRoll:properties:) source:self properties:[NSDictionary dictionaryWithObjectsAndKeys:VAL_OR_NSNULL(savedImage),@"image",nil]];
	UIImageWriteToSavedPhotosAlbum(savedImage, nil, nil, NULL);
}

- (void)flushCache;
{
	if ((currentMovie != nil) && !currentMovieIsPlaying){
		[currentMovie release];
		currentMovie = nil;
	}
	for(id cacheObject in [mediaDictionary objectEnumerator]){
		if ([cacheObject respondsToSelector:@selector(flushCache)]){
			[cacheObject flushCache];
		}
	}
}


#pragma mark Start Module

- (BOOL) startModule;
{
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];

	[(MediaModule *)invocGen beep];
	NSInvocation * beepInvoc = [invocGen invocation];

	[(MediaModule *)invocGen vibe];
	NSInvocation * vibeInvoc = [invocGen invocation];

	[(MediaModule *)invocGen createSound:nil];
	NSInvocation * newSoundInvoc = [invocGen invocation];

	[(MediaModule *)invocGen createMovieProxy:nil];
	NSInvocation * newMovieInvoc = [invocGen invocation];

	[(MediaModule *)invocGen startPicker:nil options:nil];
	NSInvocation * importImageInvoc = [invocGen invocation];
	
	[(MediaModule *)invocGen playMovie:nil];
	NSInvocation * playMovieInvoc = [invocGen invocation];

	[(MediaModule *)invocGen stopMovie:nil];
	NSInvocation * stopMovieInvoc = [invocGen invocation];
	
	[(MediaModule *)invocGen saveImageToRoll:nil];
	NSInvocation * saveImageInvoc = [invocGen invocation];

	[(MediaModule *)invocGen releaseToken:nil];
	NSInvocation * releaseInvoc = [invocGen invocation];
	

	NSString * showCameraString = @"function(args){if(!args)return false; var err=Ti.Media._NEWPIC(true,args);"
			"if(err!=null){if(typeof(args.error)=='function')args.error(err);return false;}"
			"Ti.Media._PIC=args;return true;}";
	NSString * showPickerString = @"function(args){var err=Ti.Media._NEWPIC(false,args);"
			"if(err!=null){if(typeof(args.error)=='function')args.error(err);return false;}"
			"Ti.Media._PIC=args;return true;}";

	NSString * createVideoString = @"function(args){var tok=Ti.Media._NEWMOV(args);if(tok==null)return null;"
			"var res={_TOKEN:tok,_EVT:{complete:[],error:[],resize:[]},doEvent:Ti._ONEVT,"
				"addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
				"play:function(){return Ti.Media._PLAYMOV(this._TOKEN);},"
				"stop:function(){return Ti.Media._STOPMOV(this._TOKEN);},"
				"release:function(){return Ti.Media._REL(this._TOKEN);},"
			"};Ti.Media._MEDIA[tok]=res;return res;}";


	NSNotificationCenter * theNC = [NSNotificationCenter defaultCenter];
	[theNC addObserver:self selector:@selector(handlePlayerNotification:) name:MPMoviePlayerPlaybackDidFinishNotification object:nil];

	mediaDictionary = [[NSMutableDictionary alloc] init];
	
	id mediaSourceTypes = nil, photoSourceTypes = nil, albumSourceTypes = nil;
	
	// this is a new method in 3.0 - otherwise hardcode
	if ([UIImagePickerController respondsToSelector:@selector(availableMediaTypesForSourceType:)])
	{
		mediaSourceTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypeCamera];
		photoSourceTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypePhotoLibrary];
		albumSourceTypes = [UIImagePickerController availableMediaTypesForSourceType: UIImagePickerControllerSourceTypeSavedPhotosAlbum];
	}
	// pre 3.1 these seem to return nil ... we at least always support images
	if (mediaSourceTypes==nil)
	{
		mediaSourceTypes = [NSArray arrayWithObject:(NSString*)kUTTypeImage];
	}
	if (photoSourceTypes==nil)
	{
		photoSourceTypes = [NSArray arrayWithObject:(NSString*)kUTTypeImage];
	}
	if (albumSourceTypes==nil)
	{
		albumSourceTypes = [NSArray arrayWithObject:(NSString*)kUTTypeImage];
	}
	
	NSString *isMediaTypeAvailableString = @"function(d,t){\
		var s = Ti.Media['available'+d.substring(0,1).toUpperCase()+d.substring(1)+'MediaTypes'];\
		if (s)\
		{\
			for (var c=0;c<s.length;c++)\
			{\
				if (s[c]==t) return true;\
			}\
		}\
		return false;\
	}";
	
	NSDictionary * mediaDict = [NSDictionary dictionaryWithObjectsAndKeys:
			beepInvoc, @"beep",
			vibeInvoc, @"vibrate",
			newSoundInvoc, @"createSound",
			[TitaniumJSCode codeWithString:iPhoneSoundGeneratorFunction],@"_SNDGEN",
			[TitaniumJSCode codeWithString:createVideoString],@"createVideoPlayer",
			mediaDictionary,@"_MEDIA",
			importImageInvoc,@"_NEWPIC",
			saveImageInvoc,@"saveToPhotoGallery",
			
			newMovieInvoc,@"_NEWMOV",
			playMovieInvoc,@"_PLAYMOV",
			stopMovieInvoc,@"_STOPMOV",
			releaseInvoc,@"_REL",
			
			[TitaniumJSCode codeWithString:showCameraString],@"showCamera",
			[TitaniumJSCode codeWithString:showPickerString],@"openPhotoGallery",
			
			
			[NSNumber numberWithInt:MediaModuleErrorUnknown],@"UNKNOWN_ERROR",
			[NSNumber numberWithInt:MediaModuleErrorImagePickerBusy],@"DEVICE_BUSY",
			[NSNumber numberWithInt:MediaModuleErrorNoCamera],@"NO_CAMERA",
			[NSNumber numberWithInt:MediaModuleErrorNoVideo],@"NO_VIDEO",
								
			kUTTypeMovie,@"MEDIA_TYPE_VIDEO",
			kUTTypeImage,@"MEDIA_TYPE_PHOTO",

#if __IPHONE_OS_VERSION_MIN_REQUIRED >= 300000
			[NSNumber numberWithInt:UIImagePickerControllerQualityTypeHigh], @"QUALITY_HIGH",					
			[NSNumber numberWithInt:UIImagePickerControllerQualityTypeMedium], @"QUALITY_MEDIUM",					
			[NSNumber numberWithInt:UIImagePickerControllerQualityTypeLow], @"QUALITY_LOW",					
#endif
								
			mediaSourceTypes,@"availableCameraMediaTypes",					
			photoSourceTypes,@"availablePhotoMediaTypes",					
			albumSourceTypes,@"availablePhotoGalleryMediaTypes",					
			[TitaniumJSCode codeWithString:isMediaTypeAvailableString],@"isMediaTypeSupported",
			[NSNumber numberWithBool:[UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera]],@"isCameraSupported",

								
			[NSNumber numberWithInt:MPMovieControlModeDefault],@"VIDEO_CONTROL_DEFAULT",
			[NSNumber numberWithInt:MPMovieControlModeVolumeOnly],@"VIDEO_CONTROL_VOLUME_ONLY",
			[NSNumber numberWithInt:MPMovieControlModeHidden],@"VIDEO_CONTROL_HIDDEN",
			[NSNumber numberWithInt:MPMovieScalingModeNone],@"VIDEO_SCALING_NONE",
			[NSNumber numberWithInt:MPMovieScalingModeAspectFit],@"VIDEO_SCALING_ASPECT_FIT",
			[NSNumber numberWithInt:MPMovieScalingModeAspectFill],@"VIDEO_SCALING_ASPECT_FILL",
			[NSNumber numberWithInt:MPMovieScalingModeFill],@"VIDEO_SCALING_MODE_FILL",
								
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:mediaDict forKey:@"Media"];
	
	return YES;
}

- (BOOL) endModule;
{
	return YES;
}

- (void) dealloc
{
	[currentMovie stop];
	[currentMovie release];

	[[currentImagePicker parentViewController] dismissModalViewControllerAnimated:NO];
	[currentImagePicker release];

	[imagePickerCallbackParentPageString release];
	[mediaDictionary release];
	[currentMovieToken release];
	
	[super dealloc];
}


@end

#endif