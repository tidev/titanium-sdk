/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_GEOLOCATION

#import <CoreLocation/CoreLocation.h>

@interface GeolocationModule : TiModule<CLLocationManagerDelegate> {
	CLLocationManager *locationManager;
	CLLocationManager *tempManager; // Our 'fakey' manager for handling certain <=3.2 requests
	
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
	
	NSRecursiveLock* lock;
}

@property(nonatomic,readonly,getter=hasCompass) NSNumber *compass;
@property(nonatomic,readwrite,assign) NSNumber *accuracy;
@property(nonatomic,readwrite,assign) NSNumber *highAccuracy;
@property(nonatomic,readwrite,assign) NSNumber *showCalibration;
@property(nonatomic,readwrite,assign) NSNumber *distanceFilter;
@property(nonatomic,readwrite,assign) NSNumber *headingFilter;
@property(nonatomic,readonly) NSNumber *locationServicesEnabled;
@property(nonatomic,readonly) NSNumber* locationServicesAuthorization;

// Error codes
@property(nonatomic, readonly) NSNumber* ERROR_LOCATION_UNKNOWN;
@property(nonatomic, readonly) NSNumber* ERROR_DENIED;
@property(nonatomic, readonly) NSNumber* ERROR_NETWORK;
@property(nonatomic, readonly) NSNumber* ERROR_HEADING_FAILURE;

@property(nonatomic, readonly) NSNumber* ERROR_REGION_MONITORING_DENIED;
@property(nonatomic, readonly) NSNumber* ERROR_REGION_MONITORING_FAILURE;
@property(nonatomic, readonly) NSNumber* ERROR_REGION_MONITORING_DELAYED;

// the reason for using Location services - now required in 3.2+
@property(nonatomic,readwrite,assign) NSString *purpose;

@property(nonatomic,readonly) NSNumber *ACCURACY_BEST;
@property(nonatomic,readonly) NSNumber *ACCURACY_HIGH;
@property(nonatomic,readonly) NSNumber *ACCURACY_NEAREST_TEN_METERS;
@property(nonatomic,readonly) NSNumber *ACCURACY_HUNDRED_METERS;
@property(nonatomic,readonly) NSNumber *ACCURACY_KILOMETER;
@property(nonatomic,readonly) NSNumber *ACCURACY_LOW;
@property(nonatomic,readonly) NSNumber *ACCURACY_THREE_KILOMETERS;

// Authorization to use location, 4.2+ only
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_2
@property(nonatomic,readonly) NSNumber* AUTHORIZATION_AUTHORIZED;
@property(nonatomic,readonly) NSNumber* AUTHORIZATION_DENIED;
@property(nonatomic,readonly) NSNumber* AUTHORIZATION_RESTRICTED;
#endif
@property(nonatomic,readonly) NSNumber* AUTHORIZATION_UNKNOWN; // We still need the 'authorization unknown' constant, though.

@end

#endif