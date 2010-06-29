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
	CLLocationAccuracy accuracy;
	CLLocationDistance distance;
	CLLocationDegrees heading;
	BOOL calibration;
	NSMutableArray *singleHeading;
	NSMutableArray *singleLocation;
	NSString *purpose;
	BOOL trackingHeading;
	BOOL trackingLocation;
}

@property(nonatomic,readonly,getter=hasCompass) NSNumber *compass;
@property(nonatomic,readwrite,assign) NSNumber *accuracy;
@property(nonatomic,readwrite,assign) NSNumber *highAccuracy;
@property(nonatomic,readwrite,assign) NSNumber *showCalibration;
@property(nonatomic,readwrite,assign) NSNumber *distanceFilter;
@property(nonatomic,readwrite,assign) NSNumber *headingFilter;
@property(nonatomic,readonly) NSNumber *locationServicesEnabled;

// the reason for using Location services - now required in 3.2+
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
@property(nonatomic,readwrite,assign) NSString *purpose;
#endif


@property(nonatomic,readonly) NSNumber *ACCURACY_BEST;
@property(nonatomic,readonly) NSNumber *ACCURACY_NEAREST_TEN_METERS;
@property(nonatomic,readonly) NSNumber *ACCURACY_HUNDRED_METERS;
@property(nonatomic,readonly) NSNumber *ACCURACY_KILOMETER;
@property(nonatomic,readonly) NSNumber *ACCURACY_THREE_KILOMETERS;


@end

#endif