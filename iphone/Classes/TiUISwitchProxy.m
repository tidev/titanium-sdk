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

-(NSString*)apiName
{
    return @"Ti.UI.Switch";
}

@end

#endif
