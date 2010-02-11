/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <AudioToolbox/AudioToolbox.h>
#import <QuartzCore/QuartzCore.h>

#import "TiMediaVideoPlayerProxy.h"
#import "TiUtils.h"
#import "Webcolor.h"
#import "TiFile.h"
#import "TiViewProxy.h"
#import "TiBlob.h"


@implementation TiMediaVideoPlayerProxy

#pragma mark Internal

//TODO: allow setters

-(void)_initWithProperties:(NSDictionary *)properties
{
	if ([properties objectForKey:@"media"])
	{
		[self performSelector:@selector(setMedia:) withObject:[properties objectForKey:@"media"]];
	}
	else
	{
		url = [[TiUtils toURL:[properties objectForKey:@"contentURL"] proxy:self] retain];
	}
	
	id color = [TiUtils stringValue:@"backgroundColor" properties:properties];
	if (color!=nil)
	{
		backgroundColor = [[TiUtils colorValue:color] retain];
	}
	
	scalingMode = [TiUtils intValue:@"scalingMode" properties:properties def:MPMovieScalingModeNone];
	movieControlMode = [TiUtils intValue:@"movieControlMode" properties:properties def:MPMovieControlModeDefault];
	initialPlaybackTime = [TiUtils doubleValue:@"initialPlaybackTime" properties:properties def:0];
	
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handlePlayerNotification:) 
											name:MPMoviePlayerPlaybackDidFinishNotification 
											object:nil];
	
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleKeyWindowChanged:) 
											name:UIWindowDidBecomeKeyNotification 
											object:nil];
}

-(void)_destroy
{
	playing = NO;
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIWindowDidBecomeKeyNotification object:nil];
	[[NSNotificationCenter defaultCenter] removeObserver:self name:MPMoviePlayerPlaybackDidFinishNotification object:nil];
	RELEASE_TO_NIL(tempFile);
	[super _destroy];
}

-(void)dealloc
{
	RELEASE_TO_NIL(movie);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(tempFile);
	[self _destroy];
	[super dealloc];
}

-(MPMoviePlayerController*)player
{
	if (movie==nil)
	{
		movie = [[MPMoviePlayerController alloc] initWithContentURL:url];
		[movie setScalingMode:scalingMode];
		[movie setMovieControlMode:movieControlMode];
		if (backgroundColor!=nil)
		{
			[movie setBackgroundColor:[backgroundColor _color]];
		}		
		if (initialPlaybackTime>0)
		{
			[movie setInitialPlaybackTime:initialPlaybackTime];
		}
	}
	return movie;
}

#pragma mark Public APIs

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

-(void)setMovieControlMode:(NSNumber *)value
{
	movieControlMode = [TiUtils intValue:value];
	if (movie!=nil)
	{
		[movie performSelectorOnMainThread:@selector(setMovieControlMode:) withObject:value waitUntilDone:NO];
	}
}

-(NSNumber*)movieControlMode
{
	return NUMINT(movieControlMode);
}

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
	RELEASE_TO_NIL(url);
	url = [[TiUtils toURL:url_ proxy:self] retain];
	if (movie!=nil)
	{
		BOOL restart = playing;
		[movie stop];
		[movie autorelease];
		[self player];
		if (restart)
		{
			[self performSelectorOnMainThread:@selector(play:) withObject:nil waitUntilDone:NO];
		}
	}
}

-(id)url
{
	return url;
}

-(void)setBackgroundColor:(id)color
{
	RELEASE_TO_NIL(backgroundColor);
	backgroundColor = [[TiUtils colorValue:color] retain];
	if (movie!=nil)
	{
		[movie performSelectorOnMainThread:@selector(setBackgroundColor::) withObject:[backgroundColor _color] waitUntilDone:NO];
	}
}

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
		[movie autorelease]; // release after we return
		movie = nil;
	}
	playing = NO;
}

-(void)play:(id)args
{
	ENSURE_UI_THREAD(play,args);
	
	//NOTE: this code will ensure that the SILENCE switch is respected when movie plays
	UInt32 sessionCategory = kAudioSessionCategory_SoloAmbientSound;
	AudioSessionSetProperty(kAudioSessionProperty_AudioCategory, sizeof(sessionCategory), &sessionCategory);
	
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
	[self _destroy];
}

-(void)add:(id)viewProxy
{
	ENSURE_SINGLE_ARG(viewProxy,TiViewProxy);
	if (views==nil)
	{
		views = TiCreateNonRetainingArray();
	}
	[views addObject:viewProxy];
}

-(void)remove:(id)viewProxy
{
	ENSURE_SINGLE_ARG(viewProxy,TiViewProxy);
	if (views!=nil)
	{
		[views removeObject:viewProxy];
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
			[self fireEvent:@"complete" withObject:nil];
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
			NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:nil,@"message",NUMBOOL(YES),@"success",nil];
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
			// get the window background view and place it on there - it's already rotated
			// and will give us better positioning on the right surface area
			UIView *subview = [[window subviews] objectAtIndex:0];
			for (TiViewProxy *proxy in views)
			{
				TiUIView *view = [proxy view];
				[view insertIntoView:subview bounds:subview.bounds];
				view.transform = CGAffineTransformMakeRotation(M_PI/2.0);
			}
		}
	}
}

@end
