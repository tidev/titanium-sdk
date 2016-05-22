/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSCameraViewProxy.h"
#import "TiUtils.h"

@implementation TiUIiOSCameraViewProxy

-(NSString*)apiName
{
    return @"Ti.UI.iOS.CameraView";
}

-(void)dealloc
{
    [super dealloc];
}

-(TiUIiOSCameraView*)cameraView
{
    return (TiUIiOSCameraView*)[self view];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    [[self cameraView] initializeSession];
    [super _initWithProperties:properties];
}

#pragma mark Helper

USE_VIEW_FOR_CONTENT_WIDTH

USE_VIEW_FOR_CONTENT_HEIGHT

-(TiDimension)defaultAutoWidthBehavior:(id)unused
{
    return TiDimensionAutoSize;
}

-(TiDimension)defaultAutoHeightBehavior:(id)unused
{
    return TiDimensionAutoSize;
}

@end
