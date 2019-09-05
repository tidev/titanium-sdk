/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiProxy.h>

#ifdef USE_TI_APPIOSUSERACTIVITY

@interface TiAppiOSUserActivityProxy : TiProxy <NSUserActivityDelegate> {
  @private
  BOOL _isValid;
  BOOL _supported;
}
- (id)initWithOptions:(NSDictionary *)props;
@property (nonatomic, strong) NSUserActivity *userActivity;

- (id)isSupported:(id)unused;

- (NSString *)activityType;

- (void)setActivityType:(id)value;

- (NSString *)title;

- (void)setTitle:(id)value;

- (NSDictionary *)userInfo;

- (void)setUserInfo:(id)info;

- (NSString *)webpageURL;

- (void)setWebpageURL:(id)value;

- (NSNumber *)needsSave;

- (void)setNeedsSave:(id)value;

- (void)becomeCurrent:(id)unused;

- (void)invalidate:(id)unused;

- (void)addContentAttributeSet:(id)contentAttributeSet;

- (NSNumber *)eligibleForPublicIndexing;

- (void)setEligibleForPublicIndexing:(id)value;

- (NSNumber *)eligibleForSearch;

- (void)setEligibleForSearch:(id)value;

- (NSNumber *)eligibleForHandoff;

- (void)setEligibleForHandoff:(id)value;

- (NSString *)expirationDate;

- (void)setExpirationDate:(id)UTCDateFormat;

- (NSArray *)requiredUserInfoKeys;

- (void)setRequiredUserInfoKeys:(id)keys;

- (NSArray *)keywords;

- (void)setKeywords:(id)keys;

- (void)resignCurrent:(id)unused;

#if IS_SDK_IOS_12
- (NSString *)persistentIdentifier;

- (void)setPersistentIdentifier:(NSString *)value;

- (NSNumber *)eligibleForPrediction;

- (void)setEligibleForPrediction:(NSNumber *)value;

- (void)deleteSavedUserActivitiesForPersistentIdentifiers:(id)persistentIdentifiers;

- (void)deleteAllSavedUserActivities:(id)unused;
#endif

@end

#endif
