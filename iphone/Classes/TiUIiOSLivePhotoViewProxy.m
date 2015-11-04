/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSLivePhotoViewProxy.h"
#import "TiUtils.h"

@implementation TiUIiOSLivePhotoViewProxy

-(NSString*)apiName
{
    return @"Ti.UI.iOS.LivePhotoView";
}

-(void)dealloc
{
    [super dealloc];
}

- (TiUIiOSLivePhotoView *)livePhotoView
{
    return (TiUIiOSLivePhotoView *)self.view;
}

-(void)startPlaybackWithStyle:(id)style
{
    ENSURE_TYPE_OR_NIL(style, NSNumber);
    [[[self livePhotoView] livePhotoView] startPlaybackWithStyle:[TiUtils intValue:style def:PHLivePhotoViewPlaybackStyleFull]];
}

-(void)stopPlayback
{
    [[[self livePhotoView] livePhotoView] stopPlayback];
}

-(TiDimension)defaultAutoWidthBehavior:(id)unused
{
    return TiDimensionAutoSize;
}

-(TiDimension)defaultAutoHeightBehavior:(id)unused
{
    return TiDimensionAutoSize;
}

@end
