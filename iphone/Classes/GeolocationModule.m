/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_GEOLOCATION

#import "GeolocationModule.h"
#import "APSAnalytics.h"
#import "AnalyticsModule.h"
#import "NSData+Additions.h"
#import "TiApp.h"
#import "TiEvaluator.h"

#import <sys/utsname.h>

extern NSString *const TI_APPLICATION_GUID;
extern BOOL const TI_APPLICATION_ANALYTICS;

@interface GeolocationCallback : NSObject <APSHTTPRequestDelegate> {
  id<TiEvaluator> context;
  KrollCallback *callback;
}
- (id)initWithCallback:(KrollCallback *)callback context:(id<TiEvaluator>)context;
@end

@implementation GeolocationCallback

- (id)initWithCallback:(KrollCallback *)callback_ context:(id<TiEvaluator>)context_
{
  //Ignore analyzer warning here. Delegate will call autorelease onLoad or onError.
  if (self = [super init]) {
    callback = [callback_ retain];
    context = [context_ retain];
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(callback);
  RELEASE_TO_NIL(context);
  [super dealloc];
}

- (void)start:(NSDictionary *)params
{
  // https://api.appcelerator.net/p/v1/geo
  NSString *kGeolocationURL = stringWithHexString(@"68747470733a2f2f6170692e61707063656c657261746f722e6e65742f702f76312f67656f");

  NSMutableString *url = [[[NSMutableString alloc] init] autorelease];
  [url appendString:kGeolocationURL];
  [url appendString:@"?"];
  for (id key in params) {
    NSString *value = [TiUtils stringValue:[params objectForKey:key]];
    [url appendFormat:@"%@=%@&", key, [value stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
  }

  APSHTTPRequest *req = [[APSHTTPRequest alloc] init];
  [req addRequestHeader:@"User-Agent" value:[[TiApp app] systemUserAgent]];
  [req setUrl:[NSURL URLWithString:url]];
  [req setDelegate:self];
  [req setMethod:@"GET"];
  // Place it in the main thread since we're not using a queue and yet we need the
  // delegate methods to be called...
  TiThreadPerformOnMainThread(^{
    [req send];
    [req autorelease];
  },
      NO);
}

- (void)requestSuccess:(NSString *)data
{
}

- (void)requestError:(NSError *)error
{
  NSDictionary *event = [TiUtils dictionaryWithCode:[error code] message:[TiUtils messageFromError:error]];
  [context fireEvent:callback withObject:event remove:NO thisObject:nil];
}

- (void)request:(APSHTTPRequest *)request onLoad:(APSHTTPResponse *)response
{
  [[TiApp app] stopNetwork];

  if (request != nil && [response error] == nil) {
    NSString *data = [response responseString];
    [self requestSuccess:data];
  } else {
    [self requestError:[response error]];
  }

  [self autorelease];
}

- (void)request:(APSHTTPRequest *)request onError:(APSHTTPResponse *)response
{
  [[TiApp app] stopNetwork];
  [self requestError:[response error]];
  [self autorelease];
}

@end

@interface ForwardGeoCallback : GeolocationCallback
@end

@interface ReverseGeoCallback : GeolocationCallback
@end

@implementation ForwardGeoCallback

- (void)requestSuccess:(NSString *)locationString
{
  NSMutableDictionary *event = nil;

  NSArray *listItems = [locationString componentsSeparatedByString:@","];
  if ([listItems count] == 4 && [[listItems objectAtIndex:0] isEqualToString:@"200"]) {
    id accuracy = [listItems objectAtIndex:1];
    id latitude = [listItems objectAtIndex:2];
    id longitude = [listItems objectAtIndex:3];
    event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:accuracy forKey:@"accuracy"];
    [event setObject:latitude forKey:@"latitude"];
    [event setObject:longitude forKey:@"longitude"];
  } else {
    //TODO: better error handling
    event = [TiUtils dictionaryWithCode:-1 message:@"error obtaining geolocation"];
  }

  [context fireEvent:callback withObject:event remove:NO thisObject:nil];
}

@end

@implementation ReverseGeoCallback

- (void)requestSuccess:(NSString *)locationString
{
  NSError *error = nil;
  id event = [TiUtils jsonParse:locationString error:&error];
  if (error != nil) {
    [self requestError:error];
  } else {
    BOOL success = [TiUtils boolValue:@"success" properties:event def:YES];
    NSMutableDictionary *revisedEvent = [TiUtils dictionaryWithCode:success ? 0 : -1 message:success ? nil : @"error reverse geocoding"];
    [revisedEvent setValuesForKeysWithDictionary:event];
    [context fireEvent:callback withObject:revisedEvent remove:NO thisObject:nil];
  }
}

@end

@implementation GeolocationModule

#pragma mark Internal

// TODO: Do we need to force this onto the main thread?
- (void)shutdownLocationManager
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
    } else {
      [locationManager stopUpdatingLocation];
    }
  }
  RELEASE_TO_NIL_AUTORELEASE(locationManager);
  [lock unlock];
}

- (void)_destroy
{
  [self shutdownLocationManager];
  RELEASE_TO_NIL(tempManager);
  RELEASE_TO_NIL(locationPermissionManager);
  RELEASE_TO_NIL(iOS7PermissionManager);
  RELEASE_TO_NIL(singleHeading);
  RELEASE_TO_NIL(singleLocation);
  RELEASE_TO_NIL(purpose);
  RELEASE_TO_NIL(lock);
  RELEASE_TO_NIL(lastLocationDict);
  [super _destroy];
}

- (NSString *)apiName
{
  return @"Ti.Geolocation";
}

- (void)contextWasShutdown:(KrollBridge *)bridge
{
  if (singleHeading != nil) {
    for (KrollCallback *callback in [NSArray arrayWithArray:singleHeading]) {
      KrollContext *ctx = (KrollContext *)[callback context];
      if ([bridge krollContext] == ctx) {
        [singleHeading removeObject:callback];
      }
    }
    if ([singleHeading count] == 0) {
      RELEASE_TO_NIL(singleHeading);
      [locationManager stopUpdatingHeading];
    }
  }
  if (singleLocation != nil) {
    for (KrollCallback *callback in [NSArray arrayWithArray:singleLocation]) {
      KrollContext *ctx = (KrollContext *)[callback context];
      if ([bridge krollContext] == ctx) {
        [singleLocation removeObject:callback];
      }
    }
    if ([singleLocation count] == 0) {
      RELEASE_TO_NIL(singleLocation);
      [locationManager stopUpdatingLocation];
    }
  }
}

- (void)_configure
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

  // activity Type by default
  activityType = CLActivityTypeOther;

  // pauseLocationupdateAutomatically by default NO
  pauseLocationUpdateAutomatically = NO;

  //Set the default based on if the user has defined a background location mode
  NSArray *backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
  allowsBackgroundLocationUpdates = ([backgroundModes containsObject:@"location"]);

  lock = [[NSRecursiveLock alloc] init];

  [super _configure];
}

- (CLLocationManager *)locationManager
{
  [lock lock];
  if (locationManager == nil) {
    RELEASE_TO_NIL(tempManager);
    locationManager = [[CLLocationManager alloc] init];
    locationManager.delegate = self;
    if (!trackSignificantLocationChange) {
      if (accuracy != -1) {
        locationManager.desiredAccuracy = accuracy;
      } else {
        locationManager.desiredAccuracy = kCLLocationAccuracyThreeKilometers;
      }
      locationManager.distanceFilter = distance;
    }
    locationManager.headingFilter = heading;

    if ([TiUtils isIOS8OrGreater]) {
      if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysUsageDescription"]) {
        [locationManager requestAlwaysAuthorization];
      } else if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"]) {
        [locationManager requestWhenInUseAuthorization];
      } else {
        NSLog(@"[ERROR] The keys NSLocationAlwaysUsageDescription or NSLocationWhenInUseUsageDescription are not defined in your tiapp.xml. Starting with iOS8 this is required.");
      }
    } else {
      if (purpose != nil) {
        DebugLog(@"[WARN] The Ti.Geolocation.purpose property is deprecated. On iOS6 and above include the NSLocationUsageDescription key in your Info.plist");
        if ([locationManager respondsToSelector:@selector(setPurpose:)]) {
          [locationManager performSelector:@selector(setPurpose:) withObject:purpose];
        }
      }
    }
    //This is set to NO by default for > iOS9.
    if ([TiUtils isIOS9OrGreater]) {
      locationManager.allowsBackgroundLocationUpdates = allowsBackgroundLocationUpdates;
    }

    locationManager.activityType = activityType;
    locationManager.pausesLocationUpdatesAutomatically = pauseLocationUpdateAutomatically;

    if ([CLLocationManager locationServicesEnabled] == NO) {
      //NOTE: this is from Apple example from LocateMe and it works well. the developer can still check for the
      //property and do this message themselves before calling geo. But if they don't, we at least do it for them.
      NSString *title = NSLocalizedString(@"Location Services Disabled", @"Location Services Disabled Alert Title");
      NSString *msg = NSLocalizedString(@"You currently have all location services for this device disabled. If you proceed, you will be asked to confirm whether location services should be reenabled.", @"Location Services Disabled Alert Message");
      NSString *ok = NSLocalizedString(@"OK", @"Location Services Disabled Alert OK Button");

      UIAlertController *alertController = [UIAlertController alertControllerWithTitle:title message:msg preferredStyle:UIAlertControllerStyleAlert];
      UIAlertAction *action = [UIAlertAction actionWithTitle:ok style:UIAlertActionStyleCancel handler:nil];
      [alertController addAction:action];
      [[TiApp app] showModalController:alertController animated:YES];
    }
  }
  [lock unlock];
  return locationManager;
}

// this is useful for a few methods below that need to use an instance but we
// don't necessarily want to hold on to this guy
- (CLLocationManager *)tempLocationManager
{
  if (locationManager != nil) {
    // if we have an instance, just use it
    return locationManager;
  }

  if (tempManager == nil) {
    tempManager = [[CLLocationManager alloc] init];
  }
  return tempManager;
}

- (void)startStopLocationManagerIfNeeded
{
  BOOL startHeading = NO;
  BOOL startLocation = NO;

  if (singleHeading != nil && [singleHeading count] > 0) {
    startHeading = YES;
  }
  if (singleLocation != nil && [singleLocation count] > 0) {
    startLocation = YES;
  }
  if (!startHeading && [self _hasListeners:@"heading"]) {
    startHeading = YES;
  }
  if (!startLocation && [self _hasListeners:@"location"]) {
    startLocation = YES;
  }

  if (startHeading || startLocation) {
    CLLocationManager *lm = [self locationManager];
    if (startHeading && trackingHeading == NO) {
      [lm startUpdatingHeading];
      trackingHeading = YES;
    }
    if (startLocation && trackingLocation == NO) {
      if (trackSignificantLocationChange) {
        [lm startMonitoringSignificantLocationChanges];
      } else {
        [lm startUpdatingLocation];
      }
      trackingLocation = YES;
    }
  } else if ((!startHeading || !startLocation) && locationManager != nil) {
    CLLocationManager *lm = [self locationManager];
    if (startHeading == NO && trackingHeading) {
      trackingHeading = NO;
      [lm stopUpdatingHeading];
    }
    if (startLocation == NO && trackingLocation) {
      trackingLocation = NO;
      if (trackSignificantLocationChange) {
        [lm stopMonitoringSignificantLocationChanges];
      } else {
        [lm stopUpdatingLocation];
      }
    }
    if ((startHeading == NO && startLocation == NO) || (trackingHeading == NO && trackingLocation == NO)) {
      [self shutdownLocationManager];
      trackingLocation = NO;
      trackingHeading = NO;
    }
  }
}

- (void)_listenerAdded:(NSString *)type count:(int)count
{
  BOOL startStop = NO;

  if (count == 1 && [type isEqualToString:@"heading"]) {
    startStop = YES;
  } else if (count == 1 && [type isEqualToString:@"location"]) {
    startStop = YES;
  }

  if (startStop) {
    TiThreadPerformOnMainThread(^{
      [self startStopLocationManagerIfNeeded];
    },
        NO);
  }
}

- (void)_listenerRemoved:(NSString *)type count:(int)count
{
  BOOL check = NO;
  if (count == 0 && [type isEqualToString:@"heading"]) {
    check = YES;
    if (trackingHeading) {
      trackingHeading = NO;
      [locationManager stopUpdatingHeading];
    }
  } else if (count == 0 && [type isEqualToString:@"location"]) {
    check = YES;
    if (trackingLocation) {
      trackingLocation = NO;
      [locationManager stopUpdatingLocation];
    }
  }

  if (check && ![self _hasListeners:@"heading"] && ![self _hasListeners:@"location"]) {
    TiThreadPerformOnMainThread(^{
      [self startStopLocationManagerIfNeeded];
    },
        YES);
    [self shutdownLocationManager];
    trackingLocation = NO;
    trackingHeading = NO;
    RELEASE_TO_NIL(singleHeading);
    RELEASE_TO_NIL(singleLocation);
  }
}

- (BOOL)headingAvailable
{
  return [CLLocationManager headingAvailable];
}

#pragma mark Public APIs

- (NSNumber *)hasCompass
{
  UIDevice *theDevice = [UIDevice currentDevice];
  NSString *version = [theDevice systemVersion];

  BOOL headingAvailableBool = [self headingAvailable];
  if (headingAvailableBool) {
    struct utsname u;
    uname(&u);
    if (!strcmp(u.machine, "i386")) {
      // 3.0 simulator headingAvailable will report YES but its not really available except post 3.0
      headingAvailableBool = [version hasPrefix:@"3.0"] ? NO : [CLLocationManager headingAvailable];
    }
  }
  return NUMBOOL(headingAvailableBool);
}

- (void)performGeo:(NSString *)direction address:(NSString *)address callback:(GeolocationCallback *)callback
{
  [[TiApp app] startNetwork];

  id aguid = TI_APPLICATION_GUID;
  id sid = [[TiApp app] sessionId];

  NSDictionary *params = [NSDictionary dictionaryWithObjectsAndKeys:
                                           direction, @"d",
                                       aguid, @"aguid",
                                       [TiUtils appIdentifier], @"mid",
                                       sid, @"sid",
                                       address, @"q",
                                       [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode], @"c",
                                       nil];

  [callback start:params];
}

- (void)reverseGeocoder:(id)args
{
  ENSURE_ARG_COUNT(args, 3);
  KrollCallback *callback = [args objectAtIndex:2];
  ENSURE_TYPE(callback, KrollCallback);
#ifndef __clang_analyzer__ // Ignore static analyzer error here, memory will be released. See TIMOB-19444
  CGFloat lat = [TiUtils floatValue:[args objectAtIndex:0]];
  CGFloat lon = [TiUtils floatValue:[args objectAtIndex:1]];
  ReverseGeoCallback *rcb = [[ReverseGeoCallback alloc] initWithCallback:callback context:[self executionContext]];
  [self performGeo:@"r" address:[NSString stringWithFormat:@"%f,%f", lat, lon] callback:rcb];
#endif
}

- (void)forwardGeocoder:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  KrollCallback *callback = [args objectAtIndex:1];
  ENSURE_TYPE(callback, KrollCallback);
#ifndef __clang_analyzer__ // Ignore static analyzer error here, memory will be released. See TIMOB-19444
  ForwardGeoCallback *fcb = [[ForwardGeoCallback alloc] initWithCallback:callback context:[self executionContext]];
  [self performGeo:@"f" address:[TiUtils stringValue:[args objectAtIndex:0]] callback:fcb];
#endif
}

- (void)getCurrentHeading:(id)callback
{
  ENSURE_SINGLE_ARG(callback, KrollCallback);
  ENSURE_UI_THREAD(getCurrentHeading, callback);
  if (singleHeading == nil) {
    singleHeading = [[NSMutableArray alloc] initWithCapacity:1];
  }
  [singleHeading addObject:callback];
  [self startStopLocationManagerIfNeeded];
}

- (void)getCurrentPosition:(id)callback
{
  ENSURE_SINGLE_ARG(callback, KrollCallback);
  ENSURE_UI_THREAD(getCurrentPosition, callback);

  // If the location updates are started, invoke the callback directly.
  if (locationManager != nil && locationManager.location != nil && trackingLocation == YES) {
    CLLocation *currentLocation = locationManager.location;
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:[self locationDictionary:currentLocation] forKey:@"coords"];
    [self _fireEventToListener:@"location" withObject:event listener:callback thisObject:nil];
  }
  // Otherwise, start the location manager.
  else {
    if (singleLocation == nil) {
      singleLocation = [[NSMutableArray alloc] initWithCapacity:1];
    }
    [singleLocation addObject:callback];
    [self startStopLocationManagerIfNeeded];
  }
}

- (NSString *)lastGeolocation
{
  return [TiUtils jsonStringify:lastLocationDict error:nil];
}

- (NSNumber *)highAccuracy
{
  return NUMBOOL(accuracy == kCLLocationAccuracyBest);
}

- (void)setHighAccuracy:(NSNumber *)value
{
  ENSURE_UI_THREAD(setHighAccuracy, value);
  accuracy = kCLLocationAccuracyBest;
  // don't prematurely start it
  if (locationManager != nil) {
    [locationManager setDesiredAccuracy:kCLLocationAccuracyBest];
  }
}

- (NSNumber *)accuracy
{
  return NUMDOUBLE(accuracy);
}

- (void)setAccuracy:(NSNumber *)value
{
  ENSURE_UI_THREAD(setAccuracy, value);
  accuracy = [TiUtils doubleValue:value];
  // don't prematurely start it
  if (locationManager != nil) {
    [locationManager setDesiredAccuracy:accuracy];
  }
}

- (NSNumber *)distanceFilter
{
  return NUMDOUBLE(distance);
}

- (void)setDistanceFilter:(NSNumber *)value
{
  ENSURE_UI_THREAD(setDistanceFilter, value);
  distance = [TiUtils doubleValue:value];
  // don't prematurely start it
  if (locationManager != nil) {
    [locationManager setDistanceFilter:distance];
  }
}

- (NSNumber *)headingFilter
{
  return NUMDOUBLE(heading);
}

- (void)setHeadingFilter:(NSNumber *)value
{
  ENSURE_UI_THREAD(setHeadingFilter, value);
  heading = [TiUtils doubleValue:value];
  // don't prematurely start it
  if (locationManager != nil) {
    [locationManager setHeadingFilter:heading];
  }
}

- (NSNumber *)allowsBackgroundLocationUpdates
{
  return NUMBOOL(allowsBackgroundLocationUpdates);
}

- (void)setAllowsBackgroundLocationUpdates:(NSNumber *)value
{
  allowsBackgroundLocationUpdates = [TiUtils boolValue:value];
}

- (NSNumber *)showCalibration
{
  return NUMBOOL(calibration);
}

- (void)setShowCalibration:(NSNumber *)value
{
  calibration = [TiUtils boolValue:value];
}

- (NSNumber *)locationServicesEnabled
{
  return NUMBOOL([CLLocationManager locationServicesEnabled]);
}

- (NSNumber *)locationServicesAuthorization
{
  return NUMINT([CLLocationManager authorizationStatus]);
}

- (NSNumber *)trackSignificantLocationChange
{
  return NUMBOOL(trackSignificantLocationChange);
}

- (void)setTrackSignificantLocationChange:(id)value
{
  if ([CLLocationManager significantLocationChangeMonitoringAvailable]) {
    BOOL newval = [TiUtils boolValue:value def:YES];

    if (newval != trackSignificantLocationChange) {
      if (trackingLocation && locationManager != nil) {
        [lock lock];
        [self shutdownLocationManager];
        trackingHeading = NO;
        trackingLocation = NO;
        trackSignificantLocationChange = newval;
        [lock unlock];
        TiThreadPerformOnMainThread(^{
          [self startStopLocationManagerIfNeeded];
        },
            NO);
        return;
      }
    }
    trackSignificantLocationChange = newval;
  } else {
    trackSignificantLocationChange = NO;
    DebugLog(@"[WARN] Ti.Geolocation.setTrackSignificantLocationChange is not supported on this device.");
  }
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_6_0
// Activity Type for CLlocationManager.
- (NSNumber *)activityType
{
  return NUMINT(activityType);
}

- (void)setActivityType:(NSNumber *)value
{
  activityType = [TiUtils intValue:value];
  TiThreadPerformOnMainThread(^{
    [locationManager setActivityType:activityType];
  },
      NO);
}

// Flag to decide whether or not the app should continue to send location updates while the app is in background.

- (NSNumber *)pauseLocationUpdateAutomatically
{
  return NUMBOOL(pauseLocationUpdateAutomatically);
}

- (void)setPauseLocationUpdateAutomatically:(id)value
{
  pauseLocationUpdateAutomatically = [TiUtils boolValue:value];
  TiThreadPerformOnMainThread(^{
    [locationManager setPausesLocationUpdatesAutomatically:pauseLocationUpdateAutomatically];
  },
      NO);
}
#endif

- (void)restart:(id)arg
{
  [lock lock];
  [self shutdownLocationManager];
  trackingHeading = NO;
  trackingLocation = NO;
  [lock unlock];
  // must be on UI thread
  TiThreadPerformOnMainThread(^{
    [self startStopLocationManagerIfNeeded];
  },
      NO);
}

MAKE_SYSTEM_PROP_DBL(ACCURACY_BEST, kCLLocationAccuracyBest);
MAKE_SYSTEM_PROP_DBL(ACCURACY_HIGH, kCLLocationAccuracyBest);
MAKE_SYSTEM_PROP_DBL(ACCURACY_NEAREST_TEN_METERS, kCLLocationAccuracyNearestTenMeters);
MAKE_SYSTEM_PROP_DBL(ACCURACY_HUNDRED_METERS, kCLLocationAccuracyHundredMeters);
MAKE_SYSTEM_PROP_DBL(ACCURACY_KILOMETER, kCLLocationAccuracyKilometer);
MAKE_SYSTEM_PROP_DBL(ACCURACY_THREE_KILOMETERS, kCLLocationAccuracyThreeKilometers);
MAKE_SYSTEM_PROP_DBL(ACCURACY_LOW, kCLLocationAccuracyThreeKilometers);
MAKE_SYSTEM_PROP(ACCURACY_BEST_FOR_NAVIGATION, kCLLocationAccuracyBestForNavigation); //Since 2.1.3

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

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_6_0
MAKE_SYSTEM_PROP(ACTIVITYTYPE_OTHER, CLActivityTypeOther);
MAKE_SYSTEM_PROP(ACTIVITYTYPE_AUTOMOTIVE_NAVIGATION, CLActivityTypeAutomotiveNavigation);
MAKE_SYSTEM_PROP(ACTIVITYTYPE_FITNESS, CLActivityTypeFitness);
MAKE_SYSTEM_PROP(ACTIVITYTYPE_OTHER_NAVIGATION, CLActivityTypeOtherNavigation);
#endif

- (NSNumber *)AUTHORIZATION_ALWAYS
{
  if ([TiUtils isIOS8OrGreater]) {
    return NUMINT(kCLAuthorizationStatusAuthorizedAlways);
  }
  return NUMINT(0);
}

- (NSNumber *)AUTHORIZATION_WHEN_IN_USE
{
  if ([TiUtils isIOS8OrGreater]) {
    return NUMINT(kCLAuthorizationStatusAuthorizedWhenInUse);
  }
  return NUMINT(0);
}

- (CLLocationManager *)locationPermissionManager
{
  // if we don't have an instance, create it
  if (locationPermissionManager == nil) {
    locationPermissionManager = [[CLLocationManager alloc] init];
    locationPermissionManager.delegate = self;
  }
  return locationPermissionManager;
}

- (NSNumber *)hasLocationPermissions:(id)args
{
  BOOL locationServicesEnabled = [CLLocationManager locationServicesEnabled];
  CLAuthorizationStatus currentPermissionLevel = [CLLocationManager authorizationStatus];
  if ([TiUtils isIOS8OrGreater]) {
    id value = [args objectAtIndex:0];
    ENSURE_TYPE(value, NSNumber);
    CLAuthorizationStatus requestedPermissionLevel = [TiUtils intValue:value];
    return NUMBOOL(locationServicesEnabled && currentPermissionLevel == requestedPermissionLevel);
  } else {
    return NUMBOOL(locationServicesEnabled && currentPermissionLevel == kCLAuthorizationStatusAuthorized);
  }
}

- (void)requestAuthorization:(id)value
{
  DEPRECATED_REPLACED(@"Geolocation.requestAuthorization()", @"5.1.0", @"Geolocation.requestLocationPermissions()");
  [self requestLocationPermissions:@[ value, [NSNull null] ]];
}

- (void)requestLocationPermissioniOS7:(id)args
{
  // Store the authorization callback for later usage
  if ([args count] == 2) {
    RELEASE_TO_NIL(authorizationCallback);
    ENSURE_TYPE([args objectAtIndex:1], KrollCallback);
    authorizationCallback = [[args objectAtIndex:1] retain];
  }

  if (!iOS7PermissionManager) {
    iOS7PermissionManager = [CLLocationManager new];
    iOS7PermissionManager.desiredAccuracy = kCLLocationAccuracyThreeKilometers;
    iOS7PermissionManager.delegate = self;
  }

  if ([CLLocationManager authorizationStatus] == kCLAuthorizationStatusNotDetermined) {
    // iOS7 shows permission alert only when location update is requested. Here we trick iOS7 to show
    // permission alert so that our API is in parity with iOS8+ behavior.
    [iOS7PermissionManager startUpdatingLocation];
  } else {
    [self locationManager:iOS7PermissionManager didChangeAuthorizationStatus:[CLLocationManager authorizationStatus]];
  }
}

- (void)requestLocationPermissions:(id)args
{
  if (![TiUtils isIOS8OrGreater]) {
    // It is required that delegate is created and permission is presented in main thread.
    TiThreadPerformOnMainThread(^{
      [self requestLocationPermissioniOS7:args];
    },
        NO);
    return;
  }

  id value = [args objectAtIndex:0];
  ENSURE_TYPE(value, NSNumber);

  // Store the authorization callback for later usage
  if ([args count] == 2) {
    RELEASE_TO_NIL(authorizationCallback);
    ENSURE_TYPE([args objectAtIndex:1], KrollCallback);
    authorizationCallback = [[args objectAtIndex:1] retain];
  }

  CLAuthorizationStatus requested = [TiUtils intValue:value];
  CLAuthorizationStatus currentPermissionLevel = [CLLocationManager authorizationStatus];
  BOOL permissionsGranted = (currentPermissionLevel == kCLAuthorizationStatusAuthorizedAlways) || (currentPermissionLevel == kCLAuthorizationStatusAuthorizedWhenInUse);

  if (permissionsGranted) {
    [self executeAndReleaseCallbackWithCode:0 andMessage:nil];
    return;
  } else if (currentPermissionLevel == kCLAuthorizationStatusDenied) {
    NSString *message = @"The user denied access to use location services.";
    [self executeAndReleaseCallbackWithCode:1 andMessage:message];
    return;
  }

  NSString *errorMessage = nil;

  if (requested == kCLAuthorizationStatusAuthorizedWhenInUse) {
    if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"]) {
      if ((currentPermissionLevel == kCLAuthorizationStatusAuthorizedAlways) || (currentPermissionLevel == kCLAuthorizationStatusAuthorized)) {
        errorMessage = @"Cannot change already granted permission from AUTHORIZATION_ALWAYS to AUTHORIZATION_WHEN_IN_USE";
      } else {
        TiThreadPerformOnMainThread(^{
          [[self locationPermissionManager] requestWhenInUseAuthorization];
        },
            NO);
      }
    } else {
      errorMessage = @"The NSLocationWhenInUseUsageDescription key must be defined in your tiapp.xml in order to request this permission";
    }
  }
  if ((requested == kCLAuthorizationStatusAuthorizedAlways) || (requested == kCLAuthorizationStatusAuthorized)) {
    if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationAlwaysUsageDescription"]) {
      if (currentPermissionLevel == kCLAuthorizationStatusAuthorizedWhenInUse) {
        errorMessage = @"Cannot change already granted permission from AUTHORIZATION_WHEN_IN_USE to AUTHORIZATION_ALWAYS";
      } else {
        TiThreadPerformOnMainThread(^{
          [[self locationPermissionManager] requestAlwaysAuthorization];
        },
            NO);
      }
    } else {
      errorMessage = @"The NSLocationAlwaysUsageDescription key must be defined in your tiapp.xml in order to request this permission.";
    }
  }

  if (errorMessage != nil) {
    NSLog(@"[ERROR] %@", errorMessage);
    [self executeAndReleaseCallbackWithCode:(errorMessage == nil) ? 0 : 1 andMessage:errorMessage];
    RELEASE_TO_NIL(errorMessage);
  }
}

#pragma mark Internal

- (void)executeAndReleaseCallbackWithCode:(NSInteger)code andMessage:(NSString *)message
{
  if (authorizationCallback == nil) {
    return;
  }

  NSMutableDictionary *propertiesDict = [TiUtils dictionaryWithCode:code message:message];
  NSArray *invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
  [authorizationCallback call:invocationArray thisObject:self];

  [invocationArray release];
  RELEASE_TO_NIL(message);
  RELEASE_TO_NIL(authorizationCallback);
}

- (NSDictionary *)locationDictionary:(CLLocation *)newLocation;
{
  if ([newLocation timestamp] == 0) {
    // this happens when the location object is essentially null (as in no location)
    return nil;
  }

  CLLocationCoordinate2D latlon = [newLocation coordinate];

  NSMutableDictionary *data = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                                       [NSNumber numberWithFloat:latlon.latitude], @"latitude",
                                                   [NSNumber numberWithFloat:latlon.longitude], @"longitude",
                                                   [NSNumber numberWithFloat:[newLocation altitude]], @"altitude",
                                                   [NSNumber numberWithFloat:[newLocation horizontalAccuracy]], @"accuracy",
                                                   [NSNumber numberWithFloat:[newLocation verticalAccuracy]], @"altitudeAccuracy",
                                                   [NSNumber numberWithFloat:[newLocation course]], @"heading",
                                                   [NSNumber numberWithFloat:[newLocation speed]], @"speed",
                                                   [NSNumber numberWithLongLong:(long long)([[newLocation timestamp] timeIntervalSince1970] * 1000)], @"timestamp",
                                                   nil];

  if ([TiUtils isIOS8OrGreater]) {
    NSDictionary *floor = [NSDictionary dictionaryWithObjectsAndKeys:
                                            [NSNumber numberWithInteger:[[newLocation floor] level]], @"level",
                                        nil];
    [data setObject:floor forKey:@"floor"];
  }

  return data;
}

- (NSDictionary *)headingDictionary:(CLHeading *)newHeading
{
  long long ts = (long long)[[newHeading timestamp] timeIntervalSince1970] * 1000;

  NSDictionary *data = [NSDictionary dictionaryWithObjectsAndKeys:
                                         [NSNumber numberWithDouble:[newHeading magneticHeading]], @"magneticHeading",
                                     [NSNumber numberWithDouble:[newHeading trueHeading]], @"trueHeading",
                                     [NSNumber numberWithDouble:[newHeading headingAccuracy]], @"accuracy",
                                     [NSNumber numberWithLongLong:ts], @"timestamp",
                                     [NSNumber numberWithDouble:[newHeading x]], @"x",
                                     [NSNumber numberWithDouble:[newHeading y]], @"y",
                                     [NSNumber numberWithDouble:[newHeading z]], @"z",
                                     nil];
  return data;
}

#pragma mark Single Shot Handling

- (BOOL)fireSingleShotLocationIfNeeded:(NSDictionary *)event stopIfNeeded:(BOOL)stopIfNeeded
{
  // check to see if we have any single shot location callbacks
  if (singleLocation != nil) {
    for (KrollCallback *callback in singleLocation) {
      [self _fireEventToListener:@"location" withObject:event listener:callback thisObject:nil];
    }

    // after firing, we remove them
    RELEASE_TO_NIL(singleLocation);

    // check to make sure we don't need to stop after the single shot
    if (stopIfNeeded) {
      [self startStopLocationManagerIfNeeded];
    }
    return YES;
  }
  return NO;
}

- (BOOL)fireSingleShotHeadingIfNeeded:(NSDictionary *)event stopIfNeeded:(BOOL)stopIfNeeded
{
  // check to see if we have any single shot heading callbacks
  if (singleHeading != nil) {
    for (KrollCallback *callback in singleHeading) {
      [self _fireEventToListener:@"heading" withObject:event listener:callback thisObject:nil];
    }

    // after firing, we remove them
    RELEASE_TO_NIL(singleHeading);

    // check to make sure we don't need to stop after the single shot
    if (stopIfNeeded) {
      [self startStopLocationManagerIfNeeded];
    }
    return YES;
  }
  return NO;
}

- (NSString *)purpose
{
  return purpose;
}

- (void)setPurpose:(NSString *)reason
{
  ENSURE_UI_THREAD(setPurpose, reason);
  RELEASE_TO_NIL(purpose);
  purpose = [reason retain];
  DebugLog(@"[WARN] The Ti.Geolocation.purpose property is deprecated. On iOS6 and above include the NSLocationUsageDescription key in your Info.plist");

  if (locationManager != nil) {
    if ([locationManager respondsToSelector:@selector(setPurpose:)]) {
      [locationManager performSelector:@selector(setPurpose:) withObject:purpose];
    }
  }
}

#pragma mark Geolacation Analytics

- (void)fireApplicationAnalyticsIfNeeded:(NSArray *)locations
{
  if ([AnalyticsModule isEventFiltered:@"ti.geo"]) {
    return;
  }
  static BOOL analyticsSend = NO;
  [lastLocationDict release];
  lastLocationDict = [[self locationDictionary:[locations lastObject]] copy];
  if (TI_APPLICATION_ANALYTICS && !analyticsSend) {
    analyticsSend = YES;
    [[APSAnalytics sharedInstance] sendAppGeoEvent:[locations lastObject]];
  }
}

#pragma mark Delegates

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_6_0

- (void)locationManagerDidPauseLocationUpdates:(CLLocationManager *)manager
{
  if ([self _hasListeners:@"locationupdatepaused"]) {
    [self fireEvent:@"locationupdatepaused" withObject:nil];
  }
}

- (void)locationManagerDidResumeLocationUpdates:(CLLocationManager *)manager
{
  if ([self _hasListeners:@"locationupdateresumed"]) {
    [self fireEvent:@"locationupdateresumed" withObject:nil];
  }
}

#endif

- (void)locationManager:(CLLocationManager *)manager didChangeAuthorizationStatus:(CLAuthorizationStatus)status
{
  NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                                          NUMINT([CLLocationManager authorizationStatus]), @"authorizationStatus", nil];

  if ([manager isEqual:iOS7PermissionManager] && (status != kCLAuthorizationStatusNotDetermined)) {
    [manager stopUpdatingLocation];
  }

  // Still using this event for changes being made outside the app (e.g. disable all location services on the device).
  if ([self _hasListeners:@"authorization"]) {
    [self fireEvent:@"authorization" withObject:event];
  }

  // The new callback for android parity used inside Ti.Geolocation.requestLocationPermissions()
  if (authorizationCallback != nil && status != kCLAuthorizationStatusNotDetermined) {

    int code = 0;
    NSString *errorStr = nil;

    switch (status) {
    case kCLAuthorizationStatusAuthorizedAlways:
    case kCLAuthorizationStatusAuthorizedWhenInUse:
      break;
    default:
      code = 1;
      errorStr = @"The user denied access to use location services.";
    }

    TiThreadPerformOnMainThread(^{
      NSMutableDictionary *propertiesDict = [TiUtils dictionaryWithCode:code message:errorStr];
      [propertiesDict setObject:NUMINT([CLLocationManager authorizationStatus]) forKey:@"authorizationStatus"];
      KrollEvent *invocationEvent = [[KrollEvent alloc] initWithCallback:authorizationCallback eventObject:propertiesDict thisObject:self];
      [[authorizationCallback context] enqueue:invocationEvent];
      RELEASE_TO_NIL(invocationEvent);
    },
        YES);
    RELEASE_TO_NIL(authorizationCallback);
    RELEASE_TO_NIL(errorStr);
  }
}

//Using new delegate instead of the old deprecated method - (void)locationManager:didUpdateToLocation:fromLocation:

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations
{
  if ([manager isEqual:iOS7PermissionManager]) {
    // Used only to simulate permission alert. So ignore this update.
    return;
  }

  NSDictionary *todict = [self locationDictionary:[locations lastObject]];

  //Must use dictionary because of singleshot.
  NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
  [event setObject:todict forKey:@"coords"];
  if ([self _hasListeners:@"location"]) {
    [self fireEvent:@"location" withObject:event];
  }

  [self fireApplicationAnalyticsIfNeeded:locations];
  [self fireSingleShotLocationIfNeeded:event stopIfNeeded:YES];
}

- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation
{
  if (newLocation != nil) {
    if (oldLocation == nil) {
      [self locationManager:manager didUpdateLocations:[NSArray arrayWithObject:newLocation]];
    } else {
      [self locationManager:manager didUpdateLocations:[NSArray arrayWithObjects:oldLocation, newLocation, nil]];
    }
  }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  if ([self _hasListeners:@"location"]) {
    [self fireEvent:@"location" withObject:nil errorCode:[error code] message:[TiUtils messageFromError:error]];
  }

  NSMutableDictionary *event = [TiUtils dictionaryWithCode:[error code] message:[TiUtils messageFromError:error]];
  BOOL recheck = [self fireSingleShotLocationIfNeeded:event stopIfNeeded:NO];
  recheck = recheck || [self fireSingleShotHeadingIfNeeded:event stopIfNeeded:NO];

  if (recheck) {
    // check to make sure we don't need to stop after the single shot
    [self startStopLocationManagerIfNeeded];
  }
}

- (void)locationManager:(CLLocationManager *)manager didUpdateHeading:(CLHeading *)newHeading
{
  //Unfortunately, because of the single shot overloaded here, we can't use the faster eventing.
  NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
  [event setObject:[self headingDictionary:newHeading] forKey:@"heading"];

  [self fireEvent:@"heading" withObject:event];

  [self fireSingleShotHeadingIfNeeded:event stopIfNeeded:YES];
}

- (BOOL)locationManagerShouldDisplayHeadingCalibration:(CLLocationManager *)manager
{
  if (calibration) {
    // fire an event in case the dev wants to hide it
    if ([self _hasListeners:@"calibration"]) {
      [self fireEvent:@"calibration" withObject:nil];
    }
  }
  return calibration;
}

- (void)dismissHeadingCalibrationDisplay:(id)args
{
  ENSURE_UI_THREAD(dismissHeadingCalibrationDisplay, args);
  [[self locationManager] dismissHeadingCalibrationDisplay];
}

@end

#endif
