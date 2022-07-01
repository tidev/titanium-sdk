/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOSSEARCHQUERY
#import <CoreSpotlight/CoreSpotlight.h>
#import <TitaniumKit/TiProxy.h>

@interface TiAppiOSSearchQueryProxy : TiProxy {
  CSSearchQuery *query;
  NSString *queryString;
  NSArray<NSString *> *attributes;
}

- (id)_initWithPageContext:(id<TiEvaluator>)context andArguments:(NSDictionary *)args;

- (CSSearchQuery *)query;

- (void)start:(id)unused;

- (void)cancel:(id)unused;

- (NSNumber *)isCancelled:(id)unused;

@end
#endif
