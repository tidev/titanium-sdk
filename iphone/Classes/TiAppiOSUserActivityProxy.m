/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSUserActivityProxy.h"
#import "TiAppiOSSearchableItemAttributeSetProxy.h"
#import <TitaniumKit/TiUtils.h>

#ifdef USE_TI_APPIOSUSERACTIVITY

@implementation TiAppiOSUserActivityProxy

#pragma mark Titanium Proxy components

- (NSString *)apiName
{
  return @"Ti.App.iOS.UserActivity";
}

- (id)initWithOptions:(NSDictionary *)props
{
  if (self = [super init]) {
    _supported = [self determineMinRequirements:props];
    if (_supported) {
      [self buildInitialActivity:props];
    }
  }
  return self;
}

- (void)dealloc
{
  if (_supported) {
    [self clean];
  }
  RELEASE_TO_NIL(_userActivity);
  [super dealloc];
}

#pragma mark internal helpers

- (BOOL)activityTypeValid:(NSString *)activityType
{
  NSArray *supportedActivityTypes = [[NSBundle mainBundle]
      objectForInfoDictionaryKey:@"NSUserActivityTypes"];

  return [supportedActivityTypes containsObject:activityType];
}

- (id)isSupported:(id)unused
{
  return NUMBOOL(_supported);
}

- (BOOL)determineMinRequirements:(NSDictionary *)props
{
  _isValid = NO;
  if ([props objectForKey:@"activityType"]) {
    if (![self activityTypeValid:[TiUtils stringValue:@"activityType" properties:props]]) {
      DebugLog(@"[ERROR] activityType provided is not defined in your projects tiapp.xml file");
      return NO;
    } else {
      _isValid = YES;
      return YES;
    }
  }

  DebugLog(@"[ERROR] activityType property is required on creation");

  return NO;
}

- (void)buildInitialActivity:(NSDictionary *)props
{
  NSString *activityType = [TiUtils stringValue:@"activityType" properties:props];

  [self instanceMake:activityType];

  if ([props objectForKey:@"title"]) {
    [_userActivity setTitle:[TiUtils stringValue:@"title" properties:props]];
  }

  if ([props objectForKey:@"userInfo"]) {
    [_userActivity addUserInfoEntriesFromDictionary:[props objectForKey:@"userInfo"]];
  }

  if ([props objectForKey:@"webpageURL"]) {
    NSString *webpageURLProxyString = [TiUtils stringValue:@"webpageURL" properties:props];
    NSString *webpageURLString = [webpageURLProxyString stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLHostAllowedCharacterSet]];

    [_userActivity setWebpageURL:[NSURL URLWithString:webpageURLString]];
  }

  if ([props objectForKey:@"needsSave"]) {
    [_userActivity setNeedsSave:[TiUtils boolValue:@"needsSave" properties:props]];
  }

  if ([props objectForKey:@"eligibleForPublicIndexing"]) {
    [_userActivity setEligibleForPublicIndexing:[TiUtils boolValue:@"eligibleForPublicIndexing" properties:props]];
  }

  if ([props objectForKey:@"eligibleForSearch"]) {
    [_userActivity setEligibleForSearch:[TiUtils boolValue:@"eligibleForSearch" properties:props]];
  }

  if ([props objectForKey:@"eligibleForHandoff"]) {
    [_userActivity setEligibleForHandoff:[TiUtils boolValue:@"eligibleForHandoff" properties:props]];
  }

  if ([props objectForKey:@"expirationDate"]) {
    [_userActivity setExpirationDate:[TiUtils dateForUTCDate:
                                                  [TiUtils stringValue:@"expirationDate"
                                                            properties:props]]];
  }

  if ([props objectForKey:@"keywords"]) {
    [_userActivity setKeywords:[NSSet setWithArray:[props objectForKey:@"keywords"]]];
  }

  if ([props objectForKey:@"requiredUserInfoKeys"]) {
    [_userActivity setRequiredUserInfoKeys:[NSSet setWithArray:[props objectForKey:@"requiredUserInfoKeys"]]];
  }

#if IS_SDK_IOS_12
  if ([TiUtils isIOSVersionOrGreater:@"12.0"]) {
    if ([props objectForKey:@"eligibleForPrediction"]) {
      [_userActivity setEligibleForPrediction:[TiUtils boolValue:@"eligibleForPrediction" properties:props]];
    }

    if ([props objectForKey:@"persistentIdentifier"]) {
      [_userActivity setPersistentIdentifier:[TiUtils stringValue:@"persistentIdentifier"
                                                       properties:props]];
    }
  }
#endif

  _userActivity.delegate = self;
}

- (NSDictionary *)copyActivity
{
  NSMutableDictionary *dict = [[NSMutableDictionary alloc]
      initWithObjectsAndKeys:[_userActivity activityType], @"activityType",
      nil];

  if ([_userActivity title] != nil) {
    [dict setObject:[_userActivity title] forKey:@"title"];
  }

  if ([_userActivity webpageURL] != nil) {
    [dict setObject:[[_userActivity webpageURL] absoluteString] forKey:@"webpageURL"];
  }

  if ([_userActivity userInfo] != nil) {
    [dict setObject:[_userActivity userInfo] forKey:@"userInfo"];
  }

  return dict;
}

#pragma mark Properties used for housekeeping

- (void)clean
{
  if (_userActivity != nil) {
    _userActivity.delegate = nil;
    RELEASE_TO_NIL(_userActivity);
  }
}

- (void)instanceMake:(NSString *)activityType
{
  if (_userActivity != nil) {
    [_userActivity invalidate];
  }

  [self clean];

  _userActivity = [[NSUserActivity alloc]
      initWithActivityType:activityType];
  _userActivity.delegate = self;
}

- (NSNumber *)isValid
{
  return NUMBOOL(_isValid);
}

- (NSNumber *)supported
{
  DEPRECATED_REPLACED(@"App.iOS.UserActivity.getSupported()", @"5.1.0", @"App.iOS.UserActivity.isSupported()")
  return NUMBOOL(_supported);
}

#pragma mark Delegate methods used to raise events

/* The user activity will be saved (to be continued or persisted). The receiver should update the activity with current activity state.
 */
- (void)userActivityWillSave:(NSUserActivity *)userActivity
{
  if ([self _hasListeners:@"useractivitywillsave"]) {
    DebugLog(@"[WARN] Titanium.App.iOS.UserActivity.useractivitywillsave event is deprecated. Update user activity and then set Titanium.App.iOS.UserActivity.needsSave property to true if you need it to be saved before handing it off to another device.");
    [self fireEvent:@"useractivitywillsave" withObject:[[self copyActivity] autorelease]];
  }
}

/* The user activity was continued on another device.
 */
- (void)userActivityWasContinued:(NSUserActivity *)userActivity
{
  if ([self _hasListeners:@"useractivitywascontinued"]) {
    [self fireEvent:@"useractivitywascontinued" withObject:[[self copyActivity] autorelease]];
  }
}

#pragma mark iOS 8 UserActivity Methods

- (NSString *)activityType
{
  return [_userActivity activityType];
}

- (void)setActivityType:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setActivityType, value);

  if (![self activityTypeValid:value]) {
    DebugLog(@"[ERROR] activityType provided is not defined in your projects tiapp.xml file");
    return;
  }

  if (_userActivity.activityType != value) {
    [self instanceMake:value];
  }
}

- (NSString *)title
{
  return [_userActivity title];
}

- (void)setTitle:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setTitle, value);

  [_userActivity setTitle:value];
}

- (NSDictionary *)userInfo
{
  return [_userActivity userInfo];
}

- (void)setUserInfo:(id)info
{
  ENSURE_SINGLE_ARG(info, NSDictionary);
  ENSURE_UI_THREAD(setUserInfo, info);

  [_userActivity setUserInfo:info];
}

- (NSString *)webpageURL
{
  return [[_userActivity webpageURL] absoluteString];
}

- (void)setWebpageURL:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setWebpageURL, value);

  NSURL *webpageURL = [NSURL URLWithString:[value stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLHostAllowedCharacterSet]]];
  [_userActivity setWebpageURL:webpageURL];
}

- (NSNumber *)needsSave
{
  return NUMBOOL([_userActivity needsSave]);
}

- (void)setNeedsSave:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setNeedsSave, value);

  [_userActivity setNeedsSave:[TiUtils boolValue:value]];
}

- (void)becomeCurrent:(id)unused
{
  ENSURE_UI_THREAD(becomeCurrent, unused);
  [_userActivity becomeCurrent];
}

- (void)invalidate:(id)unused
{
  ENSURE_UI_THREAD(invalidate, unused);
  [_userActivity invalidate];
}

#pragma mark Add ContentAttributeSet
- (void)addContentAttributeSet:(id)contentAttributeSet
{
#if defined(USE_TI_APPIOSSEARCHABLEITEMATTRIBUTESET)
  ENSURE_SINGLE_ARG(contentAttributeSet, TiAppiOSSearchableItemAttributeSetProxy);
  ENSURE_UI_THREAD(addContentAttributeSet, contentAttributeSet);
  _userActivity.contentAttributeSet = ((TiAppiOSSearchableItemAttributeSetProxy *)contentAttributeSet).attributes;
#endif
}

#pragma mark iOS 9 UserActivity Methods

- (NSNumber *)eligibleForPublicIndexing
{
  return NUMBOOL(_userActivity.eligibleForPublicIndexing);
}

- (void)setEligibleForPublicIndexing:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setEligibleForPublicIndexing, value);

  [_userActivity setEligibleForPublicIndexing:[TiUtils boolValue:value]];
}

- (NSNumber *)eligibleForSearch
{
  return NUMBOOL(_userActivity.eligibleForSearch);
}

- (void)setEligibleForSearch:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setEligibleForSearch, value);

  [_userActivity setEligibleForSearch:[TiUtils boolValue:value]];
}

- (NSNumber *)eligibleForHandoff
{
  return NUMBOOL(_userActivity.eligibleForHandoff);
}

- (void)setEligibleForHandoff:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setEligibleForHandoff, value);

  [_userActivity setEligibleForHandoff:[TiUtils boolValue:value]];
}

- (NSString *)expirationDate
{
  if (_userActivity.expirationDate == nil) {
    return nil;
  }

  return [TiUtils UTCDateForDate:_userActivity.expirationDate];
}

- (void)setExpirationDate:(id)UTCDateFormat
{
  ENSURE_SINGLE_ARG(UTCDateFormat, NSString);
  ENSURE_UI_THREAD(setExpirationDate, UTCDateFormat);

  [_userActivity setExpirationDate:[TiUtils dateForUTCDate:UTCDateFormat]];
}

- (NSArray *)requiredUserInfoKeys
{
  return [[_userActivity requiredUserInfoKeys] allObjects];
}

- (void)setRequiredUserInfoKeys:(id)keys
{
  ENSURE_ARRAY(keys);
  ENSURE_UI_THREAD(setRequiredUserInfoKeys, keys);

  [_userActivity setRequiredUserInfoKeys:[NSSet setWithArray:keys]];
}

- (NSArray *)keywords
{
  return [[_userActivity keywords] allObjects];
}

- (void)setKeywords:(id)keys
{
  ENSURE_ARRAY(keys);
  ENSURE_UI_THREAD(setKeywords, keys);

  [_userActivity setKeywords:[NSSet setWithArray:keys]];
}

- (void)resignCurrent:(id)unused
{
  ENSURE_UI_THREAD(resignCurrent, unused);

  [_userActivity resignCurrent];
}

#if IS_SDK_IOS_12
- (NSNumber *)eligibleForPrediction
{
  if ([TiUtils isIOSVersionLower:@"12.0"]) {
    return NUMBOOL(NO);
  }

  return @(_userActivity.isEligibleForPrediction);
}

- (void)setEligibleForPrediction:(NSNumber *)value
{
  ENSURE_UI_THREAD(setEligibleForSearch, value);
  ENSURE_TYPE(value, NSNumber);
  if ([TiUtils isIOSVersionLower:@"12.0"]) {
    return;
  }
  [_userActivity setEligibleForPrediction:[TiUtils boolValue:value]];
}

- (NSString *)persistentIdentifier
{
  if ([TiUtils isIOSVersionLower:@"12.0"]) {
    return nil;
  }

  return _userActivity.persistentIdentifier;
}

- (void)setPersistentIdentifier:(NSString *)value
{
  ENSURE_TYPE(value, NSString);
  if ([TiUtils isIOSVersionLower:@"12.0"]) {
    return;
  }
  [_userActivity setPersistentIdentifier:[TiUtils stringValue:value]];
}

- (void)deleteSavedUserActivitiesForPersistentIdentifiers:(id)persistentIdentifiers
{
  ENSURE_SINGLE_ARG(persistentIdentifiers, NSArray);

  for (id object in persistentIdentifiers) {
    ENSURE_TYPE(object, NSString);
  }

  if ([TiUtils isIOSVersionLower:@"12.0"]) {
    return;
  }
  [NSUserActivity deleteSavedUserActivitiesWithPersistentIdentifiers:persistentIdentifiers
                                                   completionHandler:^{
                                                     if ([self _hasListeners:@"useractivitydeleted"]) {
                                                       [self fireEvent:@"useractivitydeleted" withObject:nil];
                                                     }
                                                   }];
}

- (void)deleteAllSavedUserActivities:(id)unused
{
  if ([TiUtils isIOSVersionLower:@"12.0"]) {
    return;
  }
  [NSUserActivity deleteAllSavedUserActivitiesWithCompletionHandler:^{
    if ([self _hasListeners:@"useractivitydeleted"]) {
      [self fireEvent:@"useractivitydeleted" withObject:nil];
    }
  }];
}
#endif

@end

#endif
