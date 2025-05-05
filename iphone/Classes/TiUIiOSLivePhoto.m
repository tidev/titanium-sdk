/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSLivePhoto.h"
#import <TitaniumKit/TiBase.h>

@implementation TiUIiOSLivePhoto

- (NSString *)apiName
{
  return @"Ti.UI.iOS.LivePhoto";
}

- (instancetype)initWithLivePhoto:(PHLivePhoto *)livePhoto
{
  if (self = [self init]) {
    [self setLivePhoto:livePhoto];
  }

  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(_livePhoto);
  [super dealloc];
}

@end
