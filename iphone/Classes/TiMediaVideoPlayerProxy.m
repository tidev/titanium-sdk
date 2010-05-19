/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA


#import <AudioToolbox/AudioToolbox.h>
#import <QuartzCore/QuartzCore.h>

#import "TiMediaVideoPlayerProxy.h"
#import "TiMediaVideoPlayer.h"
#import "TiUtils.h"
#import "Webcolor.h"
#import "TiFile.h"
#import "TiViewProxy.h"
#import "TiBlob.h"
#import "TiMediaAudioSession.h"


/** 
 * Design Notes:
 *
 * Normally we'd use a ViewProxy/View pattern here ...but...
 *
 * Before 3.2, the player was always fullscreen and we were just a Proxy
 *
 * In 3.2, the player went to a different API with iPad where you could now
 * embedded the video in any view
 *
 * So, this class reflects the ability to work with both the older release
 * for older devices/apps and the newer style
 *
 */


@implementation TiMediaVideoPlayerProxy

#pragma mark Internal


-(void)_initWithProperties:(NSDictionary *)properties
{	
	NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
	
	[nc addObserver:self selector:@selector(handlePlayerNotification:) 
			   name:MPMoviePlayerPlaybackDidFinishNotification
			 object:nil];
	
	if ([TiUtils isDevice_Pre_3_2])
	{
		[nc addObserver:self selector:@selector(handleKeyWindowChanged:) 
				   name:UIWindowDidBecomeKeyNotification
				 object:nil];
	}
	else 
	{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
		[nc addObserver:self selector:@selector(handleThumbnailImageRequestFinishNotification:) 
				   name:MPMoviePlayerThumbnailImageRequestDidFinishNotification
				 object:nil];
		
		[nc addObserver:self selector:@selector(handleFullscreenEnterNotification:) 
				   name:MPMoviePlayerWillEnterFullscreenNotification
				 object:nil];
		
		[nc addObserver:self selector:@selector(handleFullscreenExitNotification:)
				   name:MPMoviePlayerWillExitFullscreenNotification
				 object:nil];
		
		[nc addObserver:self selector:@selector(handleSourceTypeNotification:) 
				   name:MPMovieSourceTypeAvailableNotification
				 object:nil];
		
		[nc addObserver:self selector:@selector(handleDurationAvailableNotification:) 
				   name:MPMovieDurationAvailableNotification 
				 object:nil];
		
		[nc addObserver:self selector:@selector(handleMediaTypesNotification:) 
				   name:MPMovieMediaTypesAvailableNotification 
				 object:nil];
		
		[nc addObserver:self selector:@selector(handleNaturalSizeAvailableNotification:)
				   name:MPMovieNaturalSizeAvailableNotification 
				 object:nil];
		
		[nc addObserver:self selector:@selector(handleLoadStateChangeNotification:)
				   name:MPMoviePlayerLoadStateDidChangeNotification 
				 object:nil];
		
		[nc addObserver:self selector:@selector(handleNowPlayingNotification:)
				   name:MPMoviePlayerNowPlayingMovieDidChangeNotification 
				 object:nil];
		
		[nc addObserver:self selector:@selector(handlePlaybackStateChangeNotification:)
				   name:MPMoviePlayerPlaybackStateDidChangeNotification 
				 object:nil];
		
		//FIXME add to replace preload for 3.2
		//MPMediaPlaybackIsPreparedToPlayDidChangeNotification
#endif
	}
	[super _initWithProperties:properties];
}

-(void)_destroy
{
	playing = NO;
	[movie stop];
	
	NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
	[nc removeObserver:self name:MPMoviePlayerPlaybackDidFinishNotification object:nil];

	if ([TiUtils isDevice_Pre_3_2])
	{
		[nc removeObserver:self name:UIWindowDidBecomeKeyNotification object:nil];
	}
	else 
	{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
		[nc removeObserver:self name:MPMoviePlayerThumbnailImageRequestDidFinishNotification object:nil];
		[nc removeObserver:self name:MPMoviePlayerPlaybackStateDidChangeNotification object:nil];
		[nc removeObserver:self name:MPMoviePlayerNowPlayingMovieDidChangeNotification object:nil];
		[nc removeObserver:self name:MPMoviePlayerLoadStateDidChangeNotification object:nil];
		[nc removeObserver:self name:MPMovieNaturalSizeAvailableNotification object:nil];
		[nc removeObserver:self name:MPMovieMediaTypesAvailableNotification object:nil];
		[nc removeObserver:self name:MPMovieDurationAvailableNotification object:nil];
		[nc removeObserver:self name:MPMovieSourceTypeAvailableNotification object:nil];
		[nc removeObserver:self name:MPMoviePlayerWillExitFullscreenNotification object:nil];
		[nc removeObserver:self name:MPMoviePlayerWillEnterFullscreenNotification object:nil];
#endif
	}

	RELEASE_TO_NIL(thumbnailCallback);
	RELEASE_TO_NIL(tempFile);
	RELEASE_TO_NIL(movie);
	RELEASE_TO_NIL(url);
	[super _destroy];
}

-(MPMoviePlayerController*)player
{
	if (movie==nil)
	{
		if (url==nil)
		{
			NSLog(@"[ERROR] Tried to play movie player without a valid url, media, or contentURL property");
			return nil;
		}
		movie = [[MPMoviePlayerController alloc] initWithContentURL:url];
		[movie setScalingMode:scalingMode];
		
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
		if ([movie respondsToSelector:@selector(setControlStyle:)])
		{
			[movie setControlStyle:movieControlStyle];
		}
		else 
		{
#endif			
			// for older devices (non 3.2)
			[movie setMovieControlMode:movieControlMode];
			if (backgroundColor!=nil)
			{
				[movie setBackgroundColor:[backgroundColor _color]];
			}		
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
		}
#endif
		
		if (initialPlaybackTime>0)
		{
			[movie setInitialPlaybackTime:initialPlaybackTime];
		}
		
	}
	return movie;
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
-(TiUIView*)newView
{
	if ([TiUtils isDevice_Pre_3_2]==NO)
	{
		// override since we're constructing ourselfs
		return [[TiMediaVideoPlayer alloc] initWithPlayer:[self player]];
	}
	return nil;
}
#endif

#pragma mark Public APIs

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
-(void)setBackgroundView:(id)proxy
{
	UIView *background = [[self player] backgroundView];
	for (UIView *view in [background subviews])
	{
		[view removeFromSuperview];
	}
	[background addSubview:[proxy view]];
}
#endif

-(void)setInitialPlaybackTime:(id)time
{
	initialPlaybackTime = [TiUtils doubleValue:time];
	if (movie!=nil && initialPlaybackTime>0)
	{
		[movie performSelectorOnMainThread:@selector(setInitialPlaybackTime:) withObject:time waitUntilDone:NO];
	}
}

-(NSNumber*)initialPlaybackTime
{
	return NUMDOUBLE(initialPlaybackTime);
}

-(NSNumber*)playing
{
	return NUMBOOL(playing);
}

-(void)setScalingMode:(NSNumber *)value
{
	scalingMode = [TiUtils intValue:value];
	if (movie!=nil)
	{
		[movie performSelectorOnMainThread:@selector(setScalingMode:) withObject:value waitUntilDone:NO];
	}
}

-(NSNumber*)scalingMode
{
	return NUMINT(scalingMode);
}

-(void)updateControlMode
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_3_2
	[[self player] setMovieControlMode:movieControlMode];
#endif
}

-(void)updateControlStyle
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	[[self player] setControlStyle:movieControlStyle];
#endif
}

-(void)setMovieControlMode:(NSNumber *)value
{
	movieControlMode = [TiUtils intValue:value def:MPMovieControlModeDefault];
	if (movie!=nil)
	{
		[self performSelectorOnMainThread:@selector(updateControlMode) withObject:nil waitUntilDone:NO];
	}
}

-(NSNumber*)movieControlMode
{
	return NUMINT(movieControlMode);
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
-(void)setMovieControlStyle:(NSNumber *)value
{
	movieControlStyle = [TiUtils intValue:value def:MPMovieControlStyleDefault];
	if (movie!=nil)
	{
		[self performSelectorOnMainThread:@selector(updateControlStyle) withObject:nil waitUntilDone:NO];
	}
}

-(NSNumber*)movieControlStyle
{
	return NUMINT(movieControlStyle);
}
#endif

-(void)setMedia:(id)media_
{
	if ([media_ isKindOfClass:[TiFile class]])
	{
		[self setUrl:[media_ path]];
	}
	else if ([media_ isKindOfClass:[TiBlob class]])
	{
		TiBlob *blob = (TiBlob*)media_;
		if ([blob type] == TiBlobTypeFile)
		{
			[self setUrl:[blob path]];
		}
		else if ([blob type] == TiBlobTypeData)
		{
			RELEASE_TO_NIL(tempFile);
			tempFile = [[TiUtils createTempFile:@"mov"] retain];
			[blob writeTo:[tempFile path] error:nil];
			[self setUrl:[NSURL fileURLWithPath:[tempFile path]]];
		}
		else
		{
			NSLog(@"[ERROR] unsupported blob for video player. %@",media_);
		}
	}
	else 
	{
		[self setUrl:media_];
	}
}

-(void)setUrl:(id)url_
{
	ENSURE_UI_THREAD(setUrl,url_);
	RELEASE_TO_NIL(url);
	url = [[TiUtils toURL:url_ proxy:self] retain];
	
	if (movie!=nil)
	{
		BOOL restart = playing;
		if (playing)
		{
			[movie stop];
		}
		[movie autorelease];
		movie = nil;

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
		TiMediaVideoPlayer *video = (TiMediaVideoPlayer*)[self view];
		[video setMovie:[self player]];
		[video frameSizeChanged:[video frame] bounds:[video bounds]];
#endif
		
		if (restart)
		{
			[self performSelectorOnMainThread:@selector(play:) withObject:nil waitUntilDone:NO];
		}
	}
}

-(void)setContentURL:(id)newUrl
{
	[self setUrl:newUrl];
}

-(id)url
{
	return url;
}

-(id)contentURL
{
	return url;
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

-(NSNumber*)autoplay
{
	return NUMBOOL([[self player] shouldAutoplay]);
}

-(void)setAutoplay:(id)value
{
	[[self player] setShouldAutoplay:[TiUtils boolValue:value]];
}

-(NSNumber*)useApplicationAudioSession
{
	return NUMBOOL([[self player] useApplicationAudioSession]);
}

-(void)setUseApplicationAudioSession:(id)value
{
	[[self player] setUseApplicationAudioSession:[TiUtils boolValue:value]];
}

-(void)cancelAllThumbnailImageRequests:(id)value
{
	[[self player] performSelectorOnMainThread:@selector(cancelAllThumbnailImageRequests) withObject:nil waitUntilDone:NO];
}

-(void)requestThumbnailImagesAtTimes:(id)args
{
	ENSURE_UI_THREAD(requestThumbnailImagesAtTimes,args);
	RELEASE_TO_NIL(thumbnailCallback);
	
	NSArray* array = [args objectAtIndex:0];
	NSNumber* option = [args objectAtIndex:1];
	thumbnailCallback = [[args objectAtIndex:2] retain];
	
	[[self player] requestThumbnailImagesAtTimes:array timeOption:[option intValue]];
}

-(void)generateThumbnail:(id)args
{
	NSNumber *time = [args objectAtIndex:0];
	NSNumber *options = [args objectAtIndex:1];
	TiBlob *blob = [args objectAtIndex:2];
	UIImage *image = [[self player] thumbnailImageAtTime:[time doubleValue] timeOption:[options intValue]];
	[blob setImage:image];
}

-(TiBlob*)thumbnailImageAtTime:(id)args
{
	NSMutableArray *array = [NSMutableArray arrayWithArray:args];
	TiBlob *blob = [[[TiBlob alloc] init] autorelease];
	[array addObject:blob];
	[self performSelectorOnMainThread:@selector(generateThumbnail:) withObject:array waitUntilDone:YES];
	return blob;
}
#endif

-(void)setBackgroundColor:(id)color
{
	RELEASE_TO_NIL(backgroundColor);
	backgroundColor = [[TiUtils colorValue:color] retain];
	if (movie!=nil)
	{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
		UIView *background = [[self player] backgroundView];
		[background performSelectorOnMainThread:@selector(setBackgroundColor:) withObject:[backgroundColor _color] waitUntilDone:NO];
#else
#endif
	}
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
-(NSNumber*)playableDuration
{
	return NUMDOUBLE([[self player] playableDuration]);
}

-(NSNumber*)duration
{
	return NUMDOUBLE([[self player] duration]);
}

-(NSNumber*)endPlaybackTime
{
	return NUMDOUBLE([[self player] endPlaybackTime]);
}

-(NSNumber*)fullscreen
{
	return NUMBOOL([[self player] isFullscreen]);
}

-(NSNumber*)loadState
{
	return NUMINT([[self player] loadState]);
}

-(NSNumber*)mediaTypes
{
	return NUMINT([[self player] movieMediaTypes]);
}

-(NSNumber*)sourceType
{
	return NUMINT([[self player] movieSourceType]);
}

-(void)setSourceType:(id)type
{
	ENSURE_SINGLE_ARG(type,NSObject);
	[self player].movieSourceType = [TiUtils intValue:type];
}

-(NSNumber*)playbackState
{
	return NUMINT([[self player] playbackState]);
}

-(NSNumber*)repeatMode
{
	return NUMINT([[self player] repeatMode]);
}

-(id)naturalSize
{
	NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
	CGSize size = [[self player] naturalSize];
	[dictionary setObject:NUMDOUBLE(size.width) forKey:@"width"];
	[dictionary setObject:NUMDOUBLE(size.height) forKey:@"height"];
	return dictionary;
}

-(void)setFullscreen:(id)value
{
	ENSURE_UI_THREAD(setFullscreen,value);
	BOOL fs = [TiUtils boolValue:value];
	[[self player] setFullscreen:fs];
}
#endif

-(TiColor*)backgroundColor
{
	return backgroundColor;
}

-(void)stop:(id)args
{
	ENSURE_UI_THREAD(stop,args);
	if (movie!=nil)
	{
		[movie stop];
	}
	playing = NO;
}

-(void)play:(id)args
{
	ENSURE_UI_THREAD(play,args);
	
	if (url == nil)
	{
		[self throwException:TiExceptionInvalidType
				subreason:@"Tried to play movie player without a valid url, media, or contentURL property"
				location:CODELOCATION];
	}

	
	// indicate we're going to start playing
	//[[TiMediaAudioSession sharedSession] playback];
	
	if (playing)
	{
		[self stop:nil];
	}
	
	playing = YES;
	
	[[self player] play];
}

-(void)release:(id)args
{
	ENSURE_UI_THREAD(release,args);
	[self stop:nil];
	[self detachView];
	[self _destroy];
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
-(void)viewDidAttach
{
	if ([TiUtils isDevice_Pre_3_2]==NO)
	{
		if (views!=nil && [TiUtils isIPad])
		{
			for (TiViewProxy *p in views)
			{
				[[self view] addSubview:[p view]];
			}
		}
	}
}
#endif

-(void)add:(id)viewProxy
{
	ENSURE_SINGLE_ARG(viewProxy,TiViewProxy);
	if (views==nil)
	{
		views = TiCreateNonRetainingArray();
	}
	[views addObject:viewProxy];

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2	
	if ([TiUtils isDevice_Pre_3_2]==NO && [self viewAttached])
	{
		[[self view] addSubview:[viewProxy view]];
	}
#endif
}

-(void)remove:(id)viewProxy
{
	ENSURE_SINGLE_ARG(viewProxy,TiViewProxy);
	if (views!=nil)
	{
		[views removeObject:viewProxy];
		[[viewProxy view] removeFromSuperview];
		[viewProxy detachView];
		
		if ([views count]==0)
		{
			RELEASE_TO_NIL(views);
		}
	}
}

#pragma mark Delegate Callbacks

- (void) handlePlayerNotification: (NSNotification *) notification
{
	if ([notification object] != movie) 
	{
		return;
	}
	
	NSString * name = [notification name];
	
	if ([name isEqualToString:MPMoviePlayerPlaybackDidFinishNotification])
	{
		playing = NO;
		
		if ([self _hasListeners:@"complete"])
		{
			NSMutableDictionary *event = [NSMutableDictionary dictionary];
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
			if ([TiUtils isDevice_Pre_3_2]==NO)
			{
				NSNumber *reason = [[notification userInfo] objectForKey:MPMoviePlayerPlaybackDidFinishReasonUserInfoKey];
				if (reason!=nil)
				{
					[event setObject:reason forKey:@"reason"];
				}
			}
#endif
			[self fireEvent:@"complete" withObject:event];
		}
		// release memory!
		[self stop:nil];
	}
	else if ([name isEqualToString:MPMoviePlayerContentPreloadDidFinishNotification])
	{
		NSError *error = [[notification userInfo] objectForKey:@"error"];
		if (error!=nil && [self _hasListeners:@"error"])
		{
			NSString *message = error!=nil ? [error description] : nil;
			NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:message,@"message",NUMBOOL(error==nil),@"success",nil];
			[self fireEvent:@"error" withObject:event];
		}
		else if ([self _hasListeners:@"preload"])
		{
			NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNull null],@"message",NUMBOOL(YES),@"success",nil];
			[self fireEvent:@"preload" withObject:event];
		}
	}
	else if ([name isEqualToString:MPMoviePlayerScalingModeDidChangeNotification] && [self _hasListeners:@"resize"])
	{
		[self fireEvent:@"resize" withObject:nil];
	}
}

-(void)handleKeyWindowChanged:(NSNotification*)note
{
	if (playing)
	{
		if ([self _hasListeners:@"load"])
		{
			[self fireEvent:@"load" withObject:nil];
		}
		if (views!=nil && [views count]>0)
		{
			UIWindow *window = [note object];
			
			// get the window background views surface and place it on there
			// it's already rotated and will give us better positioning 
			// on the right surface area
			UIView *subview = [[[[window subviews] objectAtIndex:0] subviews] objectAtIndex:0];
			
			CGRect bounds = [subview bounds];
			
			for (TiViewProxy *proxy in views)
			{
				TiUIView *view = [proxy view];
				[view insertIntoView:subview bounds:bounds];
			}
		}
	}
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
-(void)handleThumbnailImageRequestFinishNotification:(NSNotification*)note
{
	if (thumbnailCallback!=nil)
	{
		NSDictionary *userinfo = [note userInfo];
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		NSError* value = [userinfo objectForKey:MPMoviePlayerThumbnailErrorKey];
		if (value!=nil)
		{
			[event setObject:NUMBOOL(NO) forKey:@"success"];
			[event setObject:[value description] forKey:@"error"];
		}
		else 
		{
			[event setObject:NUMBOOL(YES) forKey:@"success"];
			UIImage *image = [userinfo valueForKey:MPMoviePlayerThumbnailImageKey];
			TiBlob *blob = [[[TiBlob alloc] initWithImage:image] autorelease];
			[event setObject:blob forKey:@"image"];
		}
		[event setObject:[userinfo valueForKey:MPMoviePlayerThumbnailTimeKey] forKey:@"time"];
		
		[self _fireEventToListener:@"thumbnail" withObject:event listener:thumbnailCallback thisObject:nil];

		RELEASE_TO_NIL(thumbnailCallback);
	}
}

-(void)handleFullscreenEnterNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"fullscreen"])
	{
		NSDictionary *userinfo = [note userInfo];
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		// using string right now since seems like with b5 symbol isn't there
		[event setObject:[userinfo valueForKey:@"MPMoviePlayerFullscreenAnimationCurveUserInfoKey"] forKey:@"curve"];
		[event setObject:[userinfo valueForKey:MPMoviePlayerFullscreenAnimationDurationUserInfoKey] forKey:@"duration"];
		[event setObject:NUMBOOL(YES) forKey:@"entering"];
		[self fireEvent:@"fullscreen" withObject:event];
	}	
}

-(void)handleFullscreenExitNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"fullscreen"])
	{
		NSDictionary *userinfo = [note userInfo];
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		// using string right now since seems like with b5 symbol isn't there
		[event setObject:[userinfo valueForKey:@"MPMoviePlayerFullscreenAnimationCurveUserInfoKey"] forKey:@"curve"];
		[event setObject:[userinfo valueForKey:MPMoviePlayerFullscreenAnimationDurationUserInfoKey] forKey:@"duration"];
		[event setObject:NUMBOOL(NO) forKey:@"entering"];
		[self fireEvent:@"fullscreen" withObject:event];
	}	
}

-(void)handleSourceTypeNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"sourceChange"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self sourceType] forKey:@"sourceType"];
		[self fireEvent:@"sourceChange" withObject:event];
	}
}

-(void)handleDurationAvailableNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"durationAvailable"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self duration] forKey:@"duration"];
		[self fireEvent:@"durationAvailable" withObject:event];
	}
}

-(void)handleMediaTypesNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"mediaTypesAvailable"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self mediaTypes] forKey:@"mediaTypes"];
		[self fireEvent:@"mediaTypesAvailable" withObject:event];
	}
}

-(void)handleNaturalSizeAvailableNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"naturalSizeAvailable"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self naturalSize] forKey:@"naturalSize"];
		[self fireEvent:@"naturalSizeAvailable" withObject:event];
	}
}

-(void)handleLoadStateChangeNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"loadstate"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self loadState] forKey:@"loadState"];
		[self fireEvent:@"loadstate" withObject:event];
	}
}

-(void)handleNowPlayingNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"playing"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self url] forKey:@"url"];
		[self fireEvent:@"playing" withObject:event];
	}
}

-(void)handlePlaybackStateChangeNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"playbackState"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self playbackState] forKey:@"playbackState"];
		[self fireEvent:@"playbackState" withObject:event];
	}
}
#endif

@end

#endif