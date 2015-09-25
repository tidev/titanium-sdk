/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIACTIVITYINDICATOR

#import "TiUIActivityIndicatorProxy.h"
#import "TiUIActivityIndicator.h"

@implementation TiUIActivityIndicatorProxy

-(NSArray *)keySequence
{
    return [NSArray arrayWithObjects:
            @"visible",
            @"font",
            @"message",
            @"color",
            @"style",
            @"indicatorColor",
            nil];
}

-(NSMutableDictionary*)langConversionTable
{
    return [NSMutableDictionary dictionaryWithObject:@"message" forKey:@"messageid"];
}

-(void)_initWithProperties:(NSDictionary*)properties
{
    [self initializeProperty:@"visible" defaultValue:NUMBOOL(NO)];
    [super _initWithProperties:properties];
}


-(NSString*)apiName
{
    return @"Ti.UI.ActivityIndicator";
}

@end

#endif