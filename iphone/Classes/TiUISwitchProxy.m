/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISWITCH

#import "TiUISwitchProxy.h"

@implementation TiUISwitchProxy

-(void)_initWithProperties:(NSDictionary *)properties
{
    [self initializeProperty:@"enabled" defaultValue:NUMBOOL(YES)];
    [super _initWithProperties:properties];
}

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~(UIViewAutoresizingFlexibleHeight|UIViewAutoresizingFlexibleWidth);
}

-(NSString*)apiName
{
    return @"Ti.UI.Switch";
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
