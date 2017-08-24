/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSAdView.h"
#import "APSAnalytics.h"
#import "TiUtils.h"

#ifdef USE_TI_UIIOSADVIEW

extern BOOL const TI_APPLICATION_ANALYTICS;

@implementation TiUIiOSAdView

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoSize];
  [self setDefaultWidth:TiDimensionAutoFill];
}
#endif

- (void)dealloc
{
  RELEASE_TO_NIL(adview);
  [super dealloc];
}

- (ADBannerView *)adview
{
  if (adview == nil) {
    adview = [[ADBannerView alloc] initWithAdType:ADAdTypeBanner];
    adview.delegate = self;
    [self addSubview:adview];
  }
  return adview;
}

- (id)accessibilityElement
{
  return [self adview];
}

- (CGFloat)contentHeightForWidth:(CGFloat)value
{
  ADBannerView *view = [self adview];
  CGSize refSize = [[UIScreen mainScreen] bounds].size;
  CGSize size = [view sizeThatFits:refSize];
  return size.height;
}

- (CGFloat)contentWidthForWidth:(CGFloat)value
{
  ADBannerView *view = [self adview];
  CGSize refSize = [[UIScreen mainScreen] bounds].size;
  CGSize size = [view sizeThatFits:refSize];
  return size.width;
}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  if (!CGRectIsEmpty(bounds)) {
    [TiUtils setView:[self adview] positionRect:bounds];
  }
  [super frameSizeChanged:frame bounds:bounds];
}

#pragma mark Public APIs

- (void)cancelAction:(id)args
{
  if (adview != nil) {
    [adview cancelBannerViewAction];
  }
}

#pragma mark Delegates

- (void)bannerViewDidLoadAd:(ADBannerView *)banner
{
  [self.proxy replaceValue:NUMBOOL(YES) forKey:@"visible" notification:YES];
  if (TI_APPLICATION_ANALYTICS) {
    NSDictionary *data = [NSDictionary dictionaryWithObjectsAndKeys:NSStringFromCGSize(banner.bounds.size), @"size", nil];
    APSAnalytics *sharedAnalytics = [APSAnalytics sharedInstance];
    SEL aSelector = NSSelectorFromString(@"sendCustomEvent:withEventType:payload:");
    if ([sharedAnalytics respondsToSelector:aSelector]) {
      NSInvocation *inv = [NSInvocation invocationWithMethodSignature:[sharedAnalytics methodSignatureForSelector:aSelector]];
      [inv setSelector:aSelector];
      [inv setTarget:sharedAnalytics];
      NSString *val = @"ti.iad.load";
      [inv setArgument:&val atIndex:2]; //arguments 0 and 1 are self and _cmd respectively, automatically set by NSInvocation
      [inv setArgument:&val atIndex:3]; //arguments 0 and 1 are self and _cmd respectively, automatically set by NSInvocation
      [inv setArgument:&(data)atIndex:4];
      [inv invoke];
    }
  }
  [(TiUIiOSAdViewProxy *)self.proxy fireLoad:nil];
}

- (void)bannerViewActionDidFinish:(ADBannerView *)banner
{
  if (TI_APPLICATION_ANALYTICS) {
    NSDictionary *data = [NSDictionary dictionaryWithObjectsAndKeys:NSStringFromCGSize(banner.bounds.size), @"size", nil];
    APSAnalytics *sharedAnalytics = [APSAnalytics sharedInstance];
    SEL aSelector = NSSelectorFromString(@"sendCustomEvent:withEventType:payload:");
    if ([sharedAnalytics respondsToSelector:aSelector]) {
      NSInvocation *inv = [NSInvocation invocationWithMethodSignature:[sharedAnalytics methodSignatureForSelector:aSelector]];
      [inv setSelector:aSelector];
      [inv setTarget:sharedAnalytics];
      NSString *val = @"ti.iad.action";
      [inv setArgument:&val atIndex:2]; //arguments 0 and 1 are self and _cmd respectively, automatically set by NSInvocation
      [inv setArgument:&val atIndex:3]; //arguments 0 and 1 are self and _cmd respectively, automatically set by NSInvocation
      [inv setArgument:&(data)atIndex:4];
      [inv invoke];
    }
  }
  if ([(TiViewProxy *)self.proxy _hasListeners:@"action" checkParent:NO]) {
    NSMutableDictionary *event = [NSMutableDictionary dictionary];
    [self.proxy fireEvent:@"action" withObject:event withSource:self propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}

- (BOOL)bannerViewActionShouldBegin:(ADBannerView *)banner willLeaveApplication:(BOOL)willLeave
{
  return YES;
}

- (void)bannerView:(ADBannerView *)banner didFailToReceiveAdWithError:(NSError *)error
{
  TiViewProxy *selfProxy = (TiViewProxy *)[self proxy];
  // per Apple, we must hide the banner view if there's no ad
  [selfProxy replaceValue:NUMBOOL(NO) forKey:@"visible" notification:YES];

  if ([selfProxy _hasListeners:@"error" checkParent:NO]) {
    NSString *message = [TiUtils messageFromError:error];
    NSDictionary *event = [NSDictionary dictionaryWithObject:message forKey:@"message"];
    [selfProxy fireEvent:@"error" withObject:event propagate:NO reportSuccess:YES errorCode:[error code] message:message];
  }
}

@end

#endif
