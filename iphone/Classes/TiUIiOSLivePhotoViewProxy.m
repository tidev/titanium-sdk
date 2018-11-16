/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSLIVEPHOTOVIEW
#import "TiUIiOSLivePhotoViewProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIiOSLivePhotoViewProxy

#pragma mark Proxy lifecycle

- (NSString *)apiName
{
  return @"Ti.UI.iOS.LivePhotoView";
}

- (void)dealloc
{
  [super dealloc];
}

#pragma mark Public APIs

- (TiUIiOSLivePhotoView *)livePhotoView
{
  return (TiUIiOSLivePhotoView *)self.view;
}

- (void)startPlaybackWithStyle:(id)args
{
  ENSURE_UI_THREAD(startPlaybackWithStyle, args);
  ENSURE_TYPE_OR_NIL(args, NSArray);
  id value = [args objectAtIndex:0];
  ENSURE_TYPE_OR_NIL(value, NSNumber);

  [[[self livePhotoView] livePhotoView] startPlaybackWithStyle:[TiUtils intValue:value def:PHLivePhotoViewPlaybackStyleFull]];
}

- (void)stopPlayback:(id)unused
{
  ENSURE_UI_THREAD(stopPlayback, unused);
  [[[self livePhotoView] livePhotoView] stopPlayback];
}

- (void)setMuted:(NSNumber *)value
{
  ENSURE_UI_THREAD(setMuted, value);
  ENSURE_TYPE(value, NSNumber);
  [self replaceValue:value forKey:@"muted" notification:YES];

  [[[self livePhotoView] livePhotoView] setMuted:[TiUtils boolValue:value]];
}

- (NSNumber *)muted
{
  return NUMBOOL([[[self livePhotoView] livePhotoView] isMuted]);
}

#pragma mark Helper

USE_VIEW_FOR_CONTENT_WIDTH

USE_VIEW_FOR_CONTENT_HEIGHT

- (TiDimension)defaultAutoWidthBehavior:(id)unused
{
  return TiDimensionAutoSize;
}

- (TiDimension)defaultAutoHeightBehavior:(id)unused
{
  return TiDimensionAutoSize;
}

@end
#endif
