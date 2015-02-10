/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISWITCH

#import "TiUISwitchProxy.h"
#import "TiUISwitch.h"

@implementation TiUISwitchProxy

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~(UIViewAutoresizingFlexibleHeight|UIViewAutoresizingFlexibleWidth);
}

-(NSString*)apiName
{
    return @"Ti.UI.Switch";
}

-(NSNumber*)enabled
{
    NSNumber* enabled = [self valueForUndefinedKey:@"enabled"];
    if(enabled == nil) {
        enabled = NUMBOOL([[(TiUISwitch*)[self view] switchView] isEnabled]);
        [self setValue:enabled forKey:@"enabled"];
    }
    return enabled;
}

USE_VIEW_FOR_VERIFY_HEIGHT
USE_VIEW_FOR_VERIFY_WIDTH

-(TiDimension)defaultAutoWidthBehavior:(id)unused
{
    return TiDimensionAutoSize;
}
-(TiDimension)defaultAutoHeightBehavior:(id)unused
{
    return TiDimensionAutoSize;
}


@end

#endif
