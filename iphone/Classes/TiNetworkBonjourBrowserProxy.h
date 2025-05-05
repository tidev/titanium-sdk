/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Special thanks to Steve Tramer for implementing this.
 */

#ifdef USE_TI_NETWORK

#import <Foundation/Foundation.h>
#import <Foundation/NSNetServices.h>
#import <TitaniumKit/TiProxy.h>

// NSNetServiceBrowser delegate
@interface TiNetworkBonjourBrowserProxy : TiProxy <NSNetServiceBrowserDelegate> {
  NSNetServiceBrowser *browser;
  NSString *serviceType;
  NSString *domain;

  NSMutableArray *services;

  BOOL searching;
  NSString *error;
  NSCondition *searchCondition;
}

- (void)search:(id)unused;
- (void)stopSearch:(id)unused;

@property (readonly, nonatomic) NSString *serviceType;
@property (readonly, nonatomic) NSString *domain;
@property (readonly, nonatomic, getter=isSearching) NSNumber *searching;

@end

#endif
