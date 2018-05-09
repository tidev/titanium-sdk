/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_APPIOSUSERACTIVITY

@interface TiAppiOSUserActivityProxy : TiProxy <NSUserActivityDelegate> {
  @private
  BOOL _isValid;
  BOOL _supported;
}
- (id)initWithOptions:(NSDictionary *)props;
@property (nonatomic, strong) NSUserActivity *userActivity;

@end

#endif