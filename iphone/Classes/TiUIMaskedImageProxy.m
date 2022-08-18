/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIMASKEDIMAGE

#import "TiUIMaskedImageProxy.h"
#import "TiUIMaskedImage.h"

#import <TitaniumKit/TiUtils.h>

@implementation TiUIMaskedImageProxy

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self replaceValue:NUMINT(kCGBlendModeSourceIn) forKey:@"mode" notification:NO];
  [super _initWithProperties:properties];
}

- (NSString *)apiName
{
  return @"Ti.UI.MaskedImage";
}

@end

#endif
