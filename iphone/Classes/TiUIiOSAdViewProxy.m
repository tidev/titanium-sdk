/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIiOSAdViewProxy.h"
#import "TiBase.h"
#import "TiUIiOSAdView.h"
#import "TiUtils.h"

#ifdef USE_TI_UIIOSADVIEW

#import <iAd/iAd.h>

@implementation TiUIiOSAdViewProxy

+ (NSString *)portraitSize
{
  DebugLog(@"[WARN] Property portraitSize has been deprecated since 3.4.2 and no longer represents a valid value.");
  if ([TiUtils isIPad]) {
    return NSStringFromCGSize(CGSizeMake(768, 66));
  } else {
    return NSStringFromCGSize(CGSizeMake(320, 50));
  }
}

+ (NSString *)landscapeSize
{
  DebugLog(@"[WARN] Property landscapeSize has been deprecated since 3.4.2 and no longer represents a valid value.");
  if ([TiUtils isIPad]) {
    return NSStringFromCGSize(CGSizeMake(1024, 66));
  } else {
    return NSStringFromCGSize(CGSizeMake(480, 32));
  }
}

- (NSString *)apiName
{
  return @"Ti.UI.iOS.AdView";
}

#ifndef TI_USE_AUTOLAYOUT
- (TiDimension)defaultAutoWidthBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
- (TiDimension)defaultAutoHeightBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
#endif
- (CGFloat)verifyWidth:(CGFloat)suggestedWidth
{
  int width = MAX(suggestedWidth, [(TiUIiOSAdView *)[self view] contentWidthForWidth:suggestedWidth]);
  return width;
}

- (CGFloat)verifyHeight:(CGFloat)suggestedHeight
{
  int height = MAX(suggestedHeight, [(TiUIiOSAdView *)[self view] contentHeightForWidth:suggestedHeight]);
  return height;
}

USE_VIEW_FOR_CONTENT_HEIGHT
USE_VIEW_FOR_CONTENT_WIDTH

- (void)cancelAction:(id)args
{
  [self makeViewPerformSelector:@selector(cancelAction:) withObject:args createIfNeeded:YES waitUntilDone:NO];
}

- (NSString *)adSize
{
  DebugLog(@"[WARN] Property adSize has been deprecated since 3.4.2 and no longer represents a constant value.");
  __block NSString *adSize;

  TiThreadPerformOnMainThread(^{
    CGRect bounds = [[(TiUIiOSAdView *)[self view] adview] bounds];
    adSize = [NSStringFromCGSize(bounds.size) retain];
  },
      YES);

  return [adSize autorelease];
}

- (void)setAdSize:(id)arg
{
  DebugLog(@"[WARN] Property adSize has been deprecated since 3.4.2 and no longer represents a valid value.");
}

- (void)fireLoad:(id)unused
{
  if ([self _hasListeners:@"load" checkParent:NO]) {
    NSMutableDictionary *event = [NSMutableDictionary dictionary];
    [self fireEvent:@"load" withObject:event withSource:self propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }

  [self contentsWillChange];
}

@end

#endif