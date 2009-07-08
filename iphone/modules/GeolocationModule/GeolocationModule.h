/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_GEOLOCATION

#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>

#import "TitaniumModule.h"

@interface GeolocationModule : NSObject<TitaniumModule,CLLocationManagerDelegate> {
	NSMutableDictionary * proxyDictionary;
	CLLocationManager * locationManager;
	int	watchEventsFired;
	NSDate *lastEvent;
	NSLock *proxyLock;
//	NSMutableDictionary * listeningPageTokens;
//	id	previousDelegate;
}

-(void)transmitGeoEvent:(CLLocation*)location fromLocation:(CLLocation*)fromLocation;

@end

/**
 * @tiapi(method=True,name=Geolocation.getCurrentPosition,since=0.4) query the Geolocation services to obtain a location once
 * @tiarg(for=Geolocation.getCurrentPosition,name=success,type=function) success function callback
 * @tiarg(for=Geolocation.getCurrentPosition,name=failure,type=function) failure function callback
 * @tiarg(for=Geolocation.getCurrentPosition,name=options,type=object) geolocation options
 * @tiresult(for=Geolocation.getCurrentPosition,type=object) returns a token object
 *
 * @tiapi(method=True,name=Geolocation.watchPosition,since=0.4) continously query the Geolocation services for location updates
 * @tiarg(for=Geolocation.watchPosition,name=success,type=function) success function callback
 * @tiarg(for=Geolocation.watchPosition,name=failure,type=function) failure function callback
 * @tiarg(for=Geolocation.watchPosition,name=options,type=object) geolocation options
 * @tiresult(for=Geolocation.watchPosition,type=object) returns a token object
 *
 * @tiapi(method=True,name=Geolocation.clearWatch,since=0.4) stops querying the Geolocation services
 * @tiarg(for=Geolocation.clearWatch,name=token,type=object) the token created by Geolocation.getCurrentPosition or Geolocation.watchPosition
 *
 * NOTE: See http://www.w3.org/TR/2008/WD-geolocation-API-20081222/ for details
 */ 

#endif
