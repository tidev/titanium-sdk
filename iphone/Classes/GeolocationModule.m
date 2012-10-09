/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_GEOLOCATION

#import "GeolocationModule.h"
#import "ASIFormDataRequest.h"
#import "TiApp.h"
#import "TiEvaluator.h"
#import "SBJSON.h"
#import <sys/utsname.h>
#import "NSData+Additions.h"

extern NSString * const TI_APPLICATION_GUID;
extern BOOL const TI_APPLICATION_ANALYTICS;

@interface GeolocationCallback : NSObject
{
	id<TiEvaluator> context;
	KrollCallback *callback;
}
-(id)initWithCallback:(KrollCallback*)callback context:(id<TiEvaluator>)context;
@end

@implementation GeolocationCallback

-(id)initWithCallback:(KrollCallback*)callback_ context:(id<TiEvaluator>)context_
{
	if (self = [super init])
	{
		callback = [callback_ retain];
		context = [context_ retain];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(callback);
	RELEASE_TO_NIL(context);
	[super dealloc];
}

-(void)start:(NSDictionary*)params
{
	// http://api.appcelerator.net/p/v1/geo
	NSString *kGeolocationURL = stringWithHexString(@"687474703a2f2f6170692e61707063656c657261746f722e6e65742f702f76312f67656f");
	
	NSMutableString *url = [[[NSMutableString alloc] init] autorelease];
	[url appendString:kGeolocationURL];
	[url appendString:@"?"];
	for (id key in params)
	{
		NSString *value = [TiUtils stringValue:[params objectForKey:key]];
		[url appendFormat:@"%@=%@&",key,[value stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
	}
	ASIFormDataRequest *request = [ASIFormDataRequest requestWithURL:[NSURL URLWithString:url]];	
	[request setDelegate:self];
	[request addRequestHeader:@"User-Agent" value:[[TiApp app] userAgent]];
	[request setRequestMethod:@"GET"];
	[request setDefaultResponseEncoding:NSUTF8StringEncoding];
	[request setAllowCompressedResponse:YES];
	[request startAsynchronous];
}

-(void)requestSuccess:(NSString*)data
{
}

-(void)requestError:(NSString*)error
{
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO),@"success",error,@"error",nil];
	[context fireEvent:callback withObject:event remove:NO thisObject:nil];
}

-(void)requestFinished:(ASIHTTPRequest *)request
{
	[[TiApp app] stopNetwork];

	if (request!=nil && [request error]==nil)
	{
		NSString *data = [request responseString];
		[self requestSuccess:data];
	}
	else 
	{
		[self requestError:[[request error] description]];
	}
	
	[self autorelease];
}

-(void)requestFailed:(ASIHTTPRequest *)request
{
	[[TiApp app] stopNetwork];
	[self requestError:[[request error] description]];
	[self autorelease];
}

@end


@interface ForwardGeoCallback : GeolocationCallback
@end

@interface ReverseGeoCallback : GeolocationCallback
@end

@implementation ForwardGeoCallback

-(void)requestSuccess:(NSString*)locationString
{
	NSDictionary *event = nil;
	
	NSArray *listItems = [locationString componentsSeparatedByString:@","];
	if([listItems count] == 4 && [[listItems objectAtIndex:0] isEqualToString:@"200"]) 
	{
		id accuracy = [listItems objectAtIndex:1];
		id latitude = [listItems objectAtIndex:2];
		id longitude = [listItems objectAtIndex:3];
		event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES),@"success",accuracy,@"accuracy",latitude,@"latitude",longitude,@"longitude",nil];
	}
	else 
	{
		//TODO: better error handling
		event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO),@"success",@"error obtaining geolocation",@"error",nil];
	}	
	
	[context fireEvent:callback withObject:event remove:NO thisObject:nil];
}

@end

@implementation ReverseGeoCallback

-(void)requestSuccess:(NSString*)locationString
{
	SBJSON *json = [[SBJSON alloc] init];
	NSError * error = nil;
	id event = [json fragmentWithString:locationString error:&error];
	[json release];
	if (error != nil) {
		[self requestError:[error localizedDescription]];
	}
	else {
		[context fireEvent:callback withObject:event remove:NO thisObject:nil];
	}
}

@end



@implementation GeolocationModule

#pragma mark Internal

// TODO: Do we need to force this onto the main thread?
-(void)shutdownLocationManager
{
	[lock lock];
	if (locationManager == nil) {
		[lock unlock];
		return;
	}
	
	if (trackingHeading) {
		[locationManager stopUpdatingHeading];
	}
    
	if (trackingLocation) {
        if (trackSignificantLocationChange) {
            [locationManager stopMonitoringSignificantLocationChanges];
        }
        else{
            [locationManager stopUpdatingLocation];
        }
	}
	RELEASE_TO_NIL_AUTORELEASE(locationManager);
	[lock unlock];
}

-(void)_destroy
{
	[self shutdownLocationManager];
	RELEASE_TO_NIL(tempManager);
	RELEASE_TO_NIL(singleHeading);
	RELEASE_TO_NIL(singleLocation);
	RELEASE_TO_NIL(purpose);
	RELEASE_TO_NIL(lock);
	[super _destroy];
}

-(void)contextWasShutdown:(KrollBridge*)bridge
{
	if (singleHeading!=nil)
	{
		for (KrollCallback *callback in [NSArray arrayWithArray:singleHeading])
		{
			KrollContext *ctx = (KrollContext*)[callback context];
			if ([bridge krollContext] == ctx)
			{
				[singleHeading removeObject:callback];
			}
		}
		if ([singleHeading count]==0)
		{
			RELEASE_TO_NIL(singleHeading);
			[locationManager stopUpdatingHeading];
		}
	}
	if (singleLocation!=nil)
	{
		for (KrollCallback *callback in [NSArray arrayWithArray:singleLocation])
		{
			KrollContext *ctx = (KrollContext*)[callback context];
			if ([bridge krollContext] == ctx)
			{
				[singleLocation removeObject:callback];
			}
		}
		if ([singleLocation count]==0)
		{
			RELEASE_TO_NIL(singleLocation);
			[locationManager stopUpdatingLocation];
		}
	}
}

-(void)_configure
{
	// reasonable defaults:
	
	// accuracy by default
	accuracy = kCLLocationAccuracyThreeKilometers;
	
	// distance filter by default is notify of all movements
	distance = kCLDistanceFilterNone;
	
	// minimum heading filter by default
	heading = kCLHeadingFilterNone;
	
	// should we show heading calibration dialog? defaults to YES
	calibration = YES;
    
    // track all location changes by default 
	trackSignificantLocationChange = NO;
    
	lock = [[NSRecursiveLock alloc] init];
	
	[super _configure]; 
}

-(CLLocationManager*)locationManager
{
	[lock lock];
	if (locationManager==nil)
	{
		RELEASE_TO_NIL(tempManager);
		locationManager = [[CLLocationManager alloc] init];
		locationManager.delegate = self;
		if (!trackSignificantLocationChange) {
            if (accuracy!=-1)
            {
                locationManager.desiredAccuracy = accuracy;
            }
            else
            {
                locationManager.desiredAccuracy = kCLLocationAccuracyThreeKilometers;
            }
            locationManager.distanceFilter = distance;
        }
		locationManager.headingFilter = heading;
		if (purpose==nil)
		{ 
			DebugLog(@"[WARN] The Ti.Geolocation.purpose property must be set.");
		}
		else
		{
			[locationManager setPurpose:purpose];
		}

		if ([CLLocationManager locationServicesEnabled]== NO) 
		{
			//NOTE: this is from Apple example from LocateMe and it works well. the developer can still check for the
			//property and do this message themselves before calling geo. But if they don't, we at least do it for them.
			NSString *title = NSLocalizedString(@"Location Services Disabled",@"Location Services Disabled Alert Title");
			NSString *msg = NSLocalizedString(@"You currently have all location services for this device disabled. If you proceed, you will be asked to confirm whether location services should be reenabled.",@"Location Services Disabled Alert Message");
			NSString *ok = NSLocalizedString(@"OK",@"Location Services Disabled Alert OK Button");
			UIAlertView *servicesDisabledAlert = [[UIAlertView alloc] initWithTitle:title message:msg delegate:nil cancelButtonTitle:ok otherButtonTitles:nil];
			[servicesDisabledAlert show];
			[servicesDisabledAlert release];
		}
	}
	[lock unlock];
	return locationManager;
}

// this is useful for a few methods below that need to use an instance but we
// don't necessarily want to hold on to this guy
-(CLLocationManager*)tempLocationManager
{
	if (locationManager!=nil)
	{
		// if we have an instance, just use it
		return locationManager;
	}
	
	if (tempManager == nil) {
		tempManager = [[CLLocationManager alloc] init];
	}
	return tempManager;
}

-(void)startStopLocationManagerIfNeeded
{
	BOOL startHeading = NO;
	BOOL startLocation = NO;
	
	if (singleHeading!=nil && [singleHeading count] > 0)
	{
		startHeading = YES;
	}
	if (singleLocation!=nil && [singleLocation count] > 0)
	{
		startLocation = YES;
	}
	if (!startHeading && [self _hasListeners:@"heading"])
	{
		startHeading = YES;
	}
	if (!startLocation && [self _hasListeners:@"location"])
	{
		startLocation = YES;
	}
	
	if (startHeading || startLocation)
	{
		CLLocationManager *lm = [self locationManager];
		if (startHeading && trackingHeading==NO)
		{
			[lm startUpdatingHeading];
			trackingHeading = YES;
		}
		if (startLocation && trackingLocation==NO)
		{
			if (trackSignificantLocationChange) {
                [lm startMonitoringSignificantLocationChanges];
            }
            else{
                [lm startUpdatingLocation];
            }
            trackingLocation = YES;
		}
	}
	else if ((!startHeading || !startLocation) && locationManager!=nil)
	{
		CLLocationManager *lm = [self locationManager];
		if (startHeading==NO && trackingHeading)
		{
			trackingHeading = NO;
			[lm stopUpdatingHeading];
		}
		if (startLocation==NO && trackingLocation)
		{
			trackingLocation = NO;
            if (trackSignificantLocationChange){
                [lm stopMonitoringSignificantLocationChanges];
            }
            else{
                [lm stopUpdatingLocation];
            }
            
        }
		if ((startHeading==NO && startLocation==NO) ||
			(trackingHeading==NO && trackingLocation==NO))
		{
			[self shutdownLocationManager];
			trackingLocation = NO;
            trackingHeading = NO;
		}
	}
}

-(void)_listenerAdded:(NSString *)type count:(int)count
{
	BOOL startStop = NO;
	
	if (count == 1 && [type isEqualToString:@"heading"])
	{
		startStop = YES;
	}
	else if (count == 1 && [type isEqualToString:@"location"])
	{
		startStop = YES;
	}
	
	if (startStop)
	{
		TiThreadPerformOnMainThread(^{[self startStopLocationManagerIfNeeded];}, NO);
	}
}

-(void)_listenerRemoved:(NSString *)type count:(int)count
{
	BOOL check = NO;
	if (count == 0 && [type isEqualToString:@"heading"])
	{
		check = YES;
		if (trackingHeading)
		{
			trackingHeading = NO;
			[locationManager stopUpdatingHeading];
		}
	}
	else if (count == 0 && [type isEqualToString:@"location"])
	{
		check = YES;
		if (trackingLocation)
		{
			trackingLocation = NO;
			[locationManager stopUpdatingLocation];
		}
	}
	
	if (check && ![self _hasListeners:@"heading"] && ![self _hasListeners:@"location"])
	{
		TiThreadPerformOnMainThread(^{[self startStopLocationManagerIfNeeded];}, YES);
		[self shutdownLocationManager];
		trackingLocation = NO;
		trackingHeading = NO;
		RELEASE_TO_NIL(singleHeading);
		RELEASE_TO_NIL(singleLocation);
	}
}

-(BOOL)headingAvailable
{
	return [CLLocationManager headingAvailable];
}

#pragma mark Public APIs

-(NSNumber*)hasCompass
{
	UIDevice * theDevice = [UIDevice currentDevice];
	NSString* version = [theDevice systemVersion];
	
	BOOL headingAvailableBool = [self headingAvailable];
	if (headingAvailableBool)
	{
		struct utsname u;
		uname(&u);
		if (!strcmp(u.machine, "i386")) 
		{
			// 3.0 simulator headingAvailable will report YES but its not really available except post 3.0
			headingAvailableBool = [version hasPrefix:@"3.0"] ? NO : [CLLocationManager headingAvailable];
		}	
	}
	return NUMBOOL(headingAvailableBool);
}

-(void)performGeo:(NSString*)direction address:(NSString*)address callback:(GeolocationCallback*)callback
{
	[[TiApp app] startNetwork];
	
	id aguid = TI_APPLICATION_GUID;
	id sid = [[TiApp app] sessionId];
	
	NSDictionary *params = [NSDictionary dictionaryWithObjectsAndKeys:
							direction, @"d",
							aguid,@"aguid",
							[TiUtils appIdentifier],@"mid",
							sid,@"sid",
							address,@"q",
							[[NSLocale currentLocale] objectForKey: NSLocaleCountryCode],@"c",
							nil];
	
	[callback start:params];
}

-(void)reverseGeocoder:(id)args
{
	ENSURE_ARG_COUNT(args,3);
	CGFloat lat = [TiUtils floatValue:[args objectAtIndex:0]];
	CGFloat lon = [TiUtils floatValue:[args objectAtIndex:1]];
	KrollCallback *callback = [args objectAtIndex:2];
	ENSURE_TYPE(callback,KrollCallback);
	ReverseGeoCallback *rcb = [[ReverseGeoCallback alloc] initWithCallback:callback context:[self executionContext]];
	[self performGeo:@"r" address:[NSString stringWithFormat:@"%f,%f",lat,lon] callback:rcb];
}

-(void)forwardGeocoder:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	KrollCallback *callback = [args objectAtIndex:1];
	ENSURE_TYPE(callback,KrollCallback);
	ForwardGeoCallback *fcb = [[ForwardGeoCallback alloc] initWithCallback:callback context:[self executionContext]];
	[self performGeo:@"f" address:[TiUtils stringValue:[args objectAtIndex:0]] callback:fcb];
}

-(void)getCurrentHeading:(id)callback 
{
	ENSURE_SINGLE_ARG(callback,KrollCallback);
	ENSURE_UI_THREAD(getCurrentHeading,callback);
	if (singleHeading==nil)
	{
		singleHeading = [[NSMutableArray alloc] initWithCapacity:1];
	}
	[singleHeading addObject:callback];
	[self startStopLocationManagerIfNeeded]; 
}

-(void)getCurrentPosition:(id)callback
{
	ENSURE_SINGLE_ARG(callback,KrollCallback);
	ENSURE_UI_THREAD(getCurrentPosition,callback);
	if (singleLocation==nil)
	{
		singleLocation = [[NSMutableArray alloc] initWithCapacity:1];
	}

    // If the location updates are started, invoke the callback directly.
    if (locationManager!=nil && trackingLocation==YES) {
        CLLocation *currentLocation = locationManager.location;
        NSDictionary *todict = [self locationDictionary:currentLocation];
        NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                               todict,@"coords",
                               NUMBOOL(YES),@"success",
                               nil];
        [self _fireEventToListener:@"location" withObject:event listener:callback thisObject:nil];
    }
    // Otherwise, start the location manager.
    else {
        [singleLocation addObject:callback];
        [self startStopLocationManagerIfNeeded];
    }
}

-(NSNumber*)highAccuracy
{
	return NUMBOOL(accuracy==kCLLocationAccuracyBest);
}

-(void)setHighAccuracy:(NSNumber *)value
{
	ENSURE_UI_THREAD(setHighAccuracy,value);
	accuracy = kCLLocationAccuracyBest;
	// don't prematurely start it
	if (locationManager!=nil)
	{
		[locationManager setDesiredAccuracy:kCLLocationAccuracyBest];
	}
}

-(NSNumber*)accuracy
{
	return NUMDOUBLE(accuracy);
}

-(void)setAccuracy:(NSNumber *)value
{
	ENSURE_UI_THREAD(setAccuracy,value);
	accuracy = [TiUtils doubleValue:value];
	// don't prematurely start it
	if (locationManager!=nil)
	{
		[locationManager setDesiredAccuracy:accuracy];
	}
}

-(NSNumber*)distanceFilter
{
	return NUMDOUBLE(distance);
}

-(void)setDistanceFilter:(NSNumber *)value
{
	ENSURE_UI_THREAD(setDistanceFilter,value);
	distance = [TiUtils doubleValue:value];
	// don't prematurely start it
	if (locationManager!=nil)
	{
		[locationManager setDistanceFilter:distance];
	}
}

-(NSNumber*)headingFilter
{
	return NUMDOUBLE(heading);
}

-(void)setHeadingFilter:(NSNumber *)value
{
	ENSURE_UI_THREAD(setHeadingFilter,value);
	heading = [TiUtils doubleValue:value];
	// don't prematurely start it
	if (locationManager!=nil)
	{
		[locationManager setHeadingFilter:heading];
	}
}

-(NSNumber*)showCalibration
{
	return NUMBOOL(calibration);
}

-(void)setShowCalibration:(NSNumber *)value
{
	calibration = [TiUtils boolValue:value];
}

-(NSNumber*)locationServicesEnabled
{
	return NUMBOOL([CLLocationManager locationServicesEnabled]);
}

-(NSNumber*)locationServicesAuthorization
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_2
	if ([TiUtils isIOS4_2OrGreater]) {
		return NUMINT([CLLocationManager authorizationStatus]);
	}
#endif
	return [self AUTHORIZATION_UNKNOWN];
}

-(NSNumber*)trackSignificantLocationChange
{
    return NUMBOOL(trackSignificantLocationChange);
}

-(void)setTrackSignificantLocationChange:(id)value
{
    if ([CLLocationManager significantLocationChangeMonitoringAvailable]) {
        BOOL newval = [TiUtils boolValue:value def:YES];
        
        if (newval != trackSignificantLocationChange) {
            if ( trackingLocation && locationManager != nil ) {
                [lock lock];
                [self shutdownLocationManager];
                trackingHeading = NO;
                trackingLocation = NO;
                trackSignificantLocationChange = newval;
                [lock unlock];
                TiThreadPerformOnMainThread(^{[self startStopLocationManagerIfNeeded];}, NO);
                return ;
            }
        }
        trackSignificantLocationChange = newval;
    }
    else{
        trackSignificantLocationChange = NO;
        DebugLog(@"[WARN] Ti.Geolocation.setTrackSignificantLocationChange is not supported on this device.");
    }
}

-(void)restart:(id)arg
{
	[lock lock];
	[self shutdownLocationManager];
	trackingHeading = NO;
	trackingLocation = NO;
	[lock unlock];
	// must be on UI thread
	TiThreadPerformOnMainThread(^{[self startStopLocationManagerIfNeeded];}, NO);
}

MAKE_SYSTEM_PROP_DBL(ACCURACY_BEST,kCLLocationAccuracyBest);
MAKE_SYSTEM_PROP_DBL(ACCURACY_HIGH,kCLLocationAccuracyBest);
MAKE_SYSTEM_PROP_DBL(ACCURACY_NEAREST_TEN_METERS,kCLLocationAccuracyNearestTenMeters);
MAKE_SYSTEM_PROP_DBL(ACCURACY_HUNDRED_METERS,kCLLocationAccuracyHundredMeters);
MAKE_SYSTEM_PROP_DBL(ACCURACY_KILOMETER,kCLLocationAccuracyKilometer);
MAKE_SYSTEM_PROP_DBL(ACCURACY_THREE_KILOMETERS,kCLLocationAccuracyThreeKilometers);
MAKE_SYSTEM_PROP_DBL(ACCURACY_LOW, kCLLocationAccuracyThreeKilometers);

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_2
MAKE_SYSTEM_PROP(AUTHORIZATION_UNKNOWN, kCLAuthorizationStatusNotDetermined);
MAKE_SYSTEM_PROP(AUTHORIZATION_AUTHORIZED, kCLAuthorizationStatusAuthorized);
MAKE_SYSTEM_PROP(AUTHORIZATION_DENIED, kCLAuthorizationStatusDenied);
MAKE_SYSTEM_PROP(AUTHORIZATION_RESTRICTED, kCLAuthorizationStatusRestricted);
#else
// We only need auth unknown, because that's all the system will return.
MAKE_SYSTEM_PROP(AUTHORIZATION_UNKNOWN, 0);
#endif

MAKE_SYSTEM_PROP(ERROR_LOCATION_UNKNOWN, kCLErrorLocationUnknown);
MAKE_SYSTEM_PROP(ERROR_DENIED, kCLErrorDenied);
MAKE_SYSTEM_PROP(ERROR_NETWORK, kCLErrorNetwork);
MAKE_SYSTEM_PROP(ERROR_HEADING_FAILURE, kCLErrorHeadingFailure);

MAKE_SYSTEM_PROP(ERROR_REGION_MONITORING_DENIED, kCLErrorRegionMonitoringDenied);
MAKE_SYSTEM_PROP(ERROR_REGION_MONITORING_FAILURE, kCLErrorRegionMonitoringFailure);
MAKE_SYSTEM_PROP(ERROR_REGION_MONITORING_DELAYED, kCLErrorRegionMonitoringSetupDelayed);

#pragma mark Internal

-(NSDictionary*)locationDictionary:(CLLocation*)newLocation;
{
	if ([newLocation timestamp] == 0)
	{
		// this happens when the location object is essentially null (as in no location)
		return nil;
	}
	
	CLLocationCoordinate2D latlon = [newLocation coordinate];
	
	
	NSDictionary * data = [NSDictionary dictionaryWithObjectsAndKeys:
						   [NSNumber numberWithFloat:latlon.latitude],@"latitude",
						   [NSNumber numberWithFloat:latlon.longitude],@"longitude",
						   [NSNumber numberWithFloat:[newLocation altitude]],@"altitude",
						   [NSNumber numberWithFloat:[newLocation horizontalAccuracy]],@"accuracy",
						   [NSNumber numberWithFloat:[newLocation verticalAccuracy]],@"altitudeAccuracy",
						   [NSNumber numberWithFloat:[newLocation course]],@"heading",
						   [NSNumber numberWithFloat:[newLocation speed]],@"speed",
						   [NSNumber numberWithLongLong:(long long)([[newLocation timestamp] timeIntervalSince1970] * 1000)],@"timestamp",
						   nil];
	return data;
}

-(NSDictionary*)headingDictionary:(CLHeading*)newHeading
{
	long long ts = (long long)[[newHeading timestamp] timeIntervalSince1970] * 1000;
	
	NSDictionary *data = [NSDictionary dictionaryWithObjectsAndKeys:
						  [NSNumber numberWithDouble:[newHeading magneticHeading]],@"magneticHeading",
						  [NSNumber numberWithDouble:[newHeading trueHeading]],@"trueHeading",
						  [NSNumber numberWithDouble:[newHeading headingAccuracy]],@"accuracy",
						  [NSNumber numberWithLongLong:ts],@"timestamp",
						  [NSNumber numberWithDouble:[newHeading x]],@"x",
						  [NSNumber numberWithDouble:[newHeading y]],@"y",
						  [NSNumber numberWithDouble:[newHeading z]],@"z",
						  nil];
	return data;
}

#pragma mark Single Shot Handling

-(BOOL)fireSingleShotLocationIfNeeded:(NSDictionary*)event stopIfNeeded:(BOOL)stopIfNeeded
{
	// check to see if we have any single shot location callbacks
	if (singleLocation!=nil)
	{
		for (KrollCallback *callback in singleLocation)
		{
			[self _fireEventToListener:@"location" withObject:event listener:callback thisObject:nil];
		}
		
		// after firing, we remove them
		RELEASE_TO_NIL(singleLocation);
		
		// check to make sure we don't need to stop after the single shot
		if (stopIfNeeded)
		{
			[self startStopLocationManagerIfNeeded];
		}
		return YES;
	}
	return NO;
}

-(BOOL)fireSingleShotHeadingIfNeeded:(NSDictionary*)event stopIfNeeded:(BOOL)stopIfNeeded
{
	// check to see if we have any single shot heading callbacks
	if (singleHeading!=nil)
	{
		for (KrollCallback *callback in singleHeading)
		{
			[self _fireEventToListener:@"heading" withObject:event listener:callback thisObject:nil];
		}
		
		// after firing, we remove them
		RELEASE_TO_NIL(singleHeading);
		
		// check to make sure we don't need to stop after the single shot
		if (stopIfNeeded)
		{ 
			[self startStopLocationManagerIfNeeded];
		}
		return YES;
	}
	return NO;
} 

-(NSString*)purpose
{
	return purpose;
}

-(void)setPurpose:(NSString *)reason
{
	ENSURE_UI_THREAD(setPurpose,reason);
	RELEASE_TO_NIL(purpose);
	purpose = [reason retain];
	if (locationManager!=nil)
	{
		[locationManager setPurpose:purpose];
	}
	
}

#pragma mark Geolacation Analytics

-(void)fireApplicationAnalyticsIfNeeded:(NSArray *)locations{
    static BOOL analyticsSend = NO;
    if (TI_APPLICATION_ANALYTICS && !analyticsSend)
	{
        analyticsSend = YES;
        NSDictionary *todict = [self locationDictionary:[locations lastObject]];
        NSDictionary *fromdict = [self locationDictionary:[locations objectAtIndex:0]];//This location could be same as todict value.
        
        NSDictionary *data = [NSDictionary dictionaryWithObjectsAndKeys:todict,@"to",fromdict,@"from",nil];
        NSDictionary *geo = [NSDictionary dictionaryWithObjectsAndKeys:data,@"data",@"ti.geo",@"name",@"ti.geo",@"type",nil];
        
        WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
        [[NSNotificationCenter defaultCenter] postNotificationName:kTiAnalyticsNotification object:nil userInfo:geo];
    }
}

#pragma mark Delegates

//Using new delegate instead of the old deprecated method - (void)locationManager:didUpdateToLocation:fromLocation:

-(void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations{
    NSDictionary *todict = [self locationDictionary:[locations lastObject]];
    
    NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
						   todict,@"coords",
						   NUMBOOL(YES),@"success",
						   nil];
    if ([self _hasListeners:@"location"])
	{
		[self fireEvent:@"location" withObject:event];
	}
	
    [self fireApplicationAnalyticsIfNeeded:locations];
	[self fireSingleShotLocationIfNeeded:event stopIfNeeded:YES];
}



- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation
{
    [self locationManager:manager didUpdateLocations:[NSArray arrayWithObjects:oldLocation,newLocation,nil]];
}


- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[error localizedDescription],@"error",
						   NUMINT([error code]), @"code",
						   NUMBOOL(NO),@"success",nil];
	
	if ([self _hasListeners:@"location"])
	{
		[self fireEvent:@"location" withObject:event];
	}
	
	BOOL recheck = [self fireSingleShotLocationIfNeeded:event stopIfNeeded:NO];
	recheck = recheck || [self fireSingleShotHeadingIfNeeded:event stopIfNeeded:NO];

	if (recheck)
	{
		// check to make sure we don't need to stop after the single shot
		[self startStopLocationManagerIfNeeded];
	}
}

- (void)locationManager:(CLLocationManager *)manager didUpdateHeading:(CLHeading *)newHeading
{
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[self headingDictionary:newHeading],
						   @"heading", NUMBOOL(YES), @"success", nil];
	
	[self fireEvent:@"heading" withObject:event];
	
	[self fireSingleShotHeadingIfNeeded:event stopIfNeeded:YES];
}

- (BOOL)locationManagerShouldDisplayHeadingCalibration:(CLLocationManager *)manager
{
	if (calibration)
	{
		// fire an event in case the dev wants to hide it
		if ([self _hasListeners:@"calibration"])
		{
			[self fireEvent:@"calibration" withObject:nil];
		}
	}
	return calibration;
}

- (void)dismissHeadingCalibrationDisplay:(id)args
{
	ENSURE_UI_THREAD(dismissHeadingCalibrationDisplay,args);
	[[self locationManager] dismissHeadingCalibrationDisplay];
}

@end

#endif