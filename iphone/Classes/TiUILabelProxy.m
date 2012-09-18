/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILABEL

#import "TiUILabelProxy.h"
#import "TiUILabel.h"
#import "TiUtils.h"

@implementation TiUILabelProxy

USE_VIEW_FOR_CONTENT_WIDTH
USE_VIEW_FOR_CONTENT_HEIGHT

-(void)_initWithProperties:(NSDictionary *)properties
{
    [super _initWithProperties:properties];
}

-(NSArray *)keySequence
{
	static NSArray *labelKeySequence = nil;
	static dispatch_once_t onceToken;
	dispatch_once(&onceToken, ^{
		labelKeySequence = [[NSArray arrayWithObjects:@"font",nil] retain];
	});
	return labelKeySequence;
}

-(NSMutableDictionary*)langConversionTable
{
    return [NSMutableDictionary dictionaryWithObject:@"text" forKey:@"textid"];
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

#endif