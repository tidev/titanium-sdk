/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_GEOLOCATION

#import <CoreLocation/CoreLocation.h>
#import <TitaniumKit/APSHTTPClient.h>
#import <TitaniumKit/TiModule.h>

NSString *const kTiGeolocationUsageDescriptionWhenInUse = @"NSLocationWhenInUseUsageDescription";
NSString *const kTiGeolocationUsageDescriptionAlways = @"NSLocationAlwaysUsageDescription";
NSString *const kTiGeolocationUsageDescriptionAlwaysAndWhenInUse = @"NSLocationAlwaysAndWhenInUseUsageDescription";

@interface GeolocationModule : TiModule <CLLocationManagerDelegate> {
  CLLocationManager *locationManager;
  CLLocationManager *tempManager; // Our 'fakey' manager for handling certain <=3.2 requests
  CLLocationManager *locationPermissionManager; // used for just permissions requests

  CLLocationAccuracy accuracy;
  CLLocationDistance distance;
  CLLocationDegrees heading;
  BOOL calibration;
  NSMutableArray *singleHeading;
  NSMutableArray *singleLocation;
  NSString *purpose;
  BOOL trackingHeading;
  BOOL trackingLocation;
  BOOL trackSignificantLocationChange;
  BOOL allowsBackgroundLocationUpdates;
  BOOL showBackgroundLocationIndicator;
  KrollCallback *authorizationCallback;
  CLAuthorizationStatus requestedAuthorizationStatus;

  CLActivityType activityType;
  BOOL pauseLocationUpdateAutomatically;
  NSDictionary *lastLocationDict;
  NSRecursiveLock *lock;
}

@property (nonatomic, readonly, getter=hasCompass) NSNumber *compass;
@property (nonatomic, readwrite, assign) NSNumber *accuracy;
@property (nonatomic, readwrite, assign) NSNumber *highAccuracy;
@property (nonatomic, readwrite, assign) NSNumber *showCalibration;
@property (nonatomic, readwrite, assign) NSNumber *showBackgroundLocationIndicator;
@property (nonatomic, readwrite, assign) NSNumber *distanceFilter;
@property (nonatomic, readwrite, assign) NSNumber *headingFilter;
@property (nonatomic, readonly) NSNumber *locationServicesEnabled;
@property (nonatomic, readonly) NSNumber *locationServicesAuthorization;

@property (nonatomic, readwrite, assign) NSNumber *activityType;

// Error codes
@property (nonatomic, readonly) NSNumber *ERROR_LOCATION_UNKNOWN;
@property (nonatomic, readonly) NSNumber *ERROR_DENIED;
@property (nonatomic, readonly) NSNumber *ERROR_NETWORK;
@property (nonatomic, readonly) NSNumber *ERROR_HEADING_FAILURE;

@property (nonatomic, readonly) NSNumber *ERROR_REGION_MONITORING_DENIED;
@property (nonatomic, readonly) NSNumber *ERROR_REGION_MONITORING_FAILURE;
@property (nonatomic, readonly) NSNumber *ERROR_REGION_MONITORING_DELAYED;

// the reason for using Location services
@property (nonatomic, readwrite, assign) NSString *purpose;

@property (nonatomic, readonly) NSNumber *ACCURACY_BEST;
@property (nonatomic, readonly) NSNumber *ACCURACY_HIGH;
@property (nonatomic, readonly) NSNumber *ACCURACY_NEAREST_TEN_METERS;
@property (nonatomic, readonly) NSNumber *ACCURACY_HUNDRED_METERS;
@property (nonatomic, readonly) NSNumber *ACCURACY_KILOMETER;
@property (nonatomic, readonly) NSNumber *ACCURACY_LOW;
@property (nonatomic, readonly) NSNumber *ACCURACY_THREE_KILOMETERS;
@property (nonatomic, readonly) NSNumber *ACCURACY_BEST_FOR_NAVIGATION;

// Authorization to use location
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_UNKNOWN;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_AUTHORIZED;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_WHEN_IN_USE;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_ALWAYS;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_DENIED;
@property (nonatomic, readonly) NSNumber *AUTHORIZATION_RESTRICTED;

// To specify the geolocation activity type
@property (nonatomic, readonly) NSNumber *ACTIVITYTYPE_OTHER; // default
@property (nonatomic, readonly) NSNumber *ACTIVITYTYPE_AUTOMOTIVE_NAVIGATION; // for automotive navigation
@property (nonatomic, readonly) NSNumber *ACTIVITYTYPE_FITNESS; // includes any pedestrian activities
@property (nonatomic, readonly) NSNumber *ACTIVITYTYPE_OTHER_NAVIGATION; // for other navigation cases (excluding pedestrian navigation), e.g. navigation for boats, trains or planes.

@end

#endif
