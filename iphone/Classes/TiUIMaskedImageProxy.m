/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIMASKEDIMAGE

#import "TiUIMaskedImageProxy.h"
#import "TiUIMaskedImage.h"

#import "TiUtils.h"

@implementation TiUIMaskedImageProxy

-(void)_initWithProperties:(NSDictionary *)properties
{
	[self replaceValue:NUMINT(kCGBlendModeSourceIn) forKey:@"mode" notification:NO];
	[super _initWithProperties:properties];
}


@end

#endif