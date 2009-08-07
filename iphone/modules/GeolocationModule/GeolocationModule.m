/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_GEOLOCATION

#import "GeolocationModule.h"
#import "AnalyticsModule.h"


NSUInteger lastWatchID = 0;

#define MAX_DELAY_BEFORE_TRANSMIT_GEO_EVENT_IN_MS (60000) * 1


@interface GeolocationProxy : TitaniumProxyObject {
//	NSString * 
	BOOL	highAccuracy;
	NSDate * timeoutDate;
	NSDate * minimumCacheTime;
	NSTimer * timeoutTimer;
	BOOL	singleShot;
	BOOL	enabled;
//	NSTimer
}

- (BOOL) handlesLocation: (CLLocation *) newLocation;
- (BOOL) handlesError: (NSError *) error;
- (void) runCallback: (NSString *) callBack;

@property(nonatomic,readwrite,assign)	BOOL	highAccuracy;
@property(nonatomic,readwrite,assign)	BOOL	singleShot;
@property(nonatomic,readwrite,assign)	BOOL	enabled;
@property(nonatomic,readwrite,retain)	NSDate * minimumCacheTime;


@end

@implementation GeolocationProxy
@synthesize highAccuracy, singleShot, minimumCacheTime,enabled;

- (void) takeDetails: (NSDictionary *) detailsDict;
{
	id highAccObj = [detailsDict objectForKey:@"enableHighAccuracy"];
	if ([highAccObj respondsToSelector:@selector(boolValue)]){
		highAccuracy = [highAccObj boolValue];
	}
	
	id timeoutObj = [detailsDict objectForKey:@"timeout"];
	if ([timeoutObj respondsToSelector:@selector(floatValue)]) {
	}
	
	id maxAgeObj = [detailsDict objectForKey:@"maximumAge"];
	if ([maxAgeObj respondsToSelector:@selector(floatValue)]){
		[self setMinimumCacheTime:[NSDate dateWithTimeIntervalSinceNow: -[maxAgeObj floatValue]]];
	}
	
}

- (BOOL) handlesLocation: (CLLocation *) newLocation;
{
	if (minimumCacheTime == nil) return YES;
	return [minimumCacheTime timeIntervalSinceDate:[newLocation timestamp]] > 0;
}

- (BOOL) handlesError: (NSError *) error;
{
	return YES;
}


- (void) runCallback: (NSString *) callBack;
{
	//Check to see if we want to trigger on this.

	NSMutableString * actionString = [[NSMutableString alloc] initWithFormat:@"Ti.Geolocation._WATCH.%@.%@",[self token],callBack];
	
	if (singleShot) {
		[actionString appendFormat:@";Ti.Geolocation.clearWatch('%@')",[self token]];
	}

	[[TitaniumHost sharedHost] sendJavascript:actionString toPageWithToken:[self parentPageToken]];
	[actionString release];
}

- (void) dealloc
{
	[minimumCacheTime release];
	[timeoutDate release];
	[timeoutTimer release];
	[super dealloc];
}

+ (NSString *) stringFromLocation: (CLLocation *) newLocation;
{
	CLLocationCoordinate2D latlon = [newLocation coordinate];
	return [NSString stringWithFormat:@"success({coords:{latitude:%f,longitude:%f,altitude:%f,accuracy:%f,altitudeAccuracy:%f,heading:%f,speed:%f},timestamp:%qu })",
			latlon.latitude, latlon.longitude, [newLocation altitude], [newLocation horizontalAccuracy],
			[newLocation verticalAccuracy], [newLocation course], [newLocation speed],
			(long long)([[newLocation timestamp] timeIntervalSinceReferenceDate] * 1000)];
}


+ (NSString *) stringFromError: (NSError *) error timedout: (BOOL) isTimeout;
{
	int failCode = 0;
	NSString * errorMessage = @"'unknown'";

	if (isTimeout){
		failCode = 3;
		errorMessage = @"'timed out'";
	} else if ([error code] == kCLErrorDenied) {
		failCode = 1;
		errorMessage = @"'user denied access'";
	} else {
		SBJSON * encoder = [[SBJSON alloc] init];
		errorMessage = [encoder stringWithFragment:[error localizedDescription] error:nil];
		[encoder release];
	}
	return [NSString stringWithFormat:@"fail({UNKNOWN_ERROR:0,PERMISSION_DENIED:1,POSITION_UNAVAILABLE:2,TIMEOUT:3,code:%d,message:%@})",
			failCode,errorMessage];
}


@end


@implementation GeolocationModule

- (void) updateLocManagerAccuracy;
{
	[proxyLock lock];
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if ([thisProxy highAccuracy]) {
			[locationManager setDesiredAccuracy:kCLLocationAccuracyBest];
			[proxyLock unlock];
			return;
		}
	}
	[proxyLock unlock];
	[locationManager setDesiredAccuracy:kCLLocationAccuracyKilometer];
}

-(NSDictionary*)getGeoData:(CLLocation*)newLocation;
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
						   [NSNumber numberWithLongLong:(long long)([[newLocation timestamp] timeIntervalSinceReferenceDate] * 1000)],@"timestamp",
						   nil];
	return data;
}

-(void)transmitGeoEvent:(CLLocation*)location fromLocation:(CLLocation*)fromLocation;
{
	AnalyticsModule *module = (AnalyticsModule*)[[TitaniumHost sharedHost] moduleNamed:@"AnalyticsModule"];
	NSDictionary * data = [NSDictionary dictionaryWithObjectsAndKeys:[self getGeoData:location],@"to",[self getGeoData:fromLocation],@"from",nil];
	[module sendPlatformEvent:@"ti.geo" data:data];
}

- (void) updatePolling;
{
	[proxyLock lock];
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if ([thisProxy enabled]) { //TODO: Do we want to expose a way to disable polling yet keep the listener?
			[locationManager startUpdatingLocation];
			[proxyLock unlock];
			return;
		}
	}
	[proxyLock unlock];

	[locationManager stopUpdatingLocation];
}

- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation;
{
	NSString * locationString = nil;
	
	[proxyLock lock];
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if(![thisProxy enabled])continue;
		if ([thisProxy handlesLocation:newLocation]) {
			if (locationString == nil){ locationString = [GeolocationProxy stringFromLocation:newLocation]; }
			[thisProxy runCallback:locationString];
		}
	}
	[proxyLock unlock];

	if ((lastEvent == nil) || ([[NSDate date] timeIntervalSince1970]-[lastEvent timeIntervalSince1970] >= MAX_DELAY_BEFORE_TRANSMIT_GEO_EVENT_IN_MS))
	{
		[self transmitGeoEvent:newLocation fromLocation:oldLocation];
	}

	watchEventsFired++;
	[lastEvent release];
	lastEvent = [[NSDate alloc] init];
	[self performSelectorOnMainThread:@selector(updatePolling) withObject:nil waitUntilDone:NO];
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error;
{
	NSString * errorString = nil;
	if ([error code] == kCLErrorDenied) [manager stopUpdatingLocation];

	[proxyLock lock];
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if(![thisProxy enabled])continue;
		if ([thisProxy handlesError:error]) {
			if (errorString == nil){ errorString = [GeolocationProxy stringFromError:error timedout:NO]; }
			[thisProxy runCallback:errorString];
		}
	}
	[proxyLock unlock];

	[lastEvent release];
	lastEvent = nil; // on failure, reset recording time
	watchEventsFired++;
	[self performSelectorOnMainThread:@selector(updatePolling) withObject:nil waitUntilDone:NO];
}

- (NSString *) tokenIsOneShot: (id)isOneShotObj options: (id)propertiesDict;
{
	NSString * newToken = [NSString stringWithFormat:@"GEO%d",lastWatchID++];
	GeolocationProxy * newProxy = [[GeolocationProxy alloc] init];
	[newProxy setToken:newToken];

	[proxyLock lock];
	[proxyDictionary setObject:newProxy forKey:newToken];
	[proxyLock unlock];

	if ([propertiesDict isKindOfClass:[NSDictionary dictionary]]) [newProxy takeDetails:propertiesDict];

	if ([isOneShotObj respondsToSelector:@selector(boolValue)]){
		[newProxy setSingleShot:[isOneShotObj boolValue]];
	}
	[self performSelectorOnMainThread:@selector(updateLocManagerAccuracy) withObject:nil waitUntilDone:NO];
	[self performSelectorOnMainThread:@selector(updatePolling) withObject:nil waitUntilDone:NO];
	[newProxy release];
	
	return newToken;
}

- (TitaniumJSCode *) clearWatch: (id) token;
{
	if (![token isKindOfClass:[NSString class]]) return nil;
	[proxyLock lock];
	[proxyDictionary removeObjectForKey:token];
	
	int count=0;
	for(GeolocationProxy * thisProxy in proxyDictionary){
		if([thisProxy enabled]){
			count++; break;
		}
	}
	
	if (count == 0){
		[self performSelectorOnMainThread:@selector(updatePolling) withObject:nil waitUntilDone:NO];
	}
	[self performSelectorOnMainThread:@selector(updateLocManagerAccuracy) withObject:nil waitUntilDone:NO];
	[proxyLock unlock];
	
	return [TitaniumJSCode codeWithString:[NSString stringWithFormat:@"delete Ti.Geolocation._WATCH.%@;",token]];
}

- (void) setWatch: (NSString *) token enabled: (NSNumber *) isEnabled;
{
	if(![isEnabled respondsToSelector:@selector(boolValue)])return;
	[proxyLock lock];
	GeolocationProxy * ourProxy = [proxyDictionary objectForKey:token];

	if(ourProxy != nil){
		[ourProxy setEnabled:[isEnabled boolValue]];
		[self performSelectorOnMainThread:@selector(updatePolling) withObject:nil waitUntilDone:NO];
		[self performSelectorOnMainThread:@selector(updateLocManagerAccuracy) withObject:nil waitUntilDone:NO];		
	}
	[proxyLock unlock];	
}

- (BOOL) startModule;
{
	locationManager = [[CLLocationManager alloc] init];
	[locationManager setDelegate:self];
	proxyLock = [[NSLock alloc] init];
	[proxyLock setName:@"Geolocation lock"];

	// initialize the date reference (for events) to nil to cause it to fire initially
	lastEvent = nil;

	proxyDictionary = [[NSMutableDictionary alloc] init];
	
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	[(GeolocationModule *)invocGen tokenIsOneShot:nil options:nil];
	NSInvocation * tokenInvoc = [invocGen invocation];
	
	[(GeolocationModule *)invocGen clearWatch:nil];
	NSInvocation * removeInvoc = [invocGen invocation];

	[(GeolocationModule *)invocGen setWatch:nil enabled:nil];
	NSInvocation * enableInvoc = [invocGen invocation];
	
	TitaniumJSCode * getCurrentPosition = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geolocation._NEWTOK(true,details);"
			"Ti.Geolocation._WATCH[token]={success:succCB,fail:errCB};Ti.Geolocation.setWatchEnabled(token,true);return token;}"];
	TitaniumJSCode * watchPosition = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geolocation._NEWTOK(false,details);"
			"Ti.Geolocation._WATCH[token]={success:succCB,fail:errCB};Ti.Geolocation.setWatchEnabled(token,true);return token;}"];
	
	NSDictionary * geoDict = [NSDictionary dictionaryWithObjectsAndKeys:
			getCurrentPosition, @"getCurrentPosition",
			watchPosition, @"watchPosition",
			removeInvoc,@"clearWatch",
			tokenInvoc,@"_NEWTOK",
			enableInvoc,@"setWatchEnabled",
			[NSDictionary dictionary],@"_WATCH",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject: geoDict forKey:@"Geolocation"];

/* according to the doc this should work and tell us the user has already granted permission to this app.
   however, on 3.0 GA, it doesn't work on device.

	if ([locationManager locationServicesEnabled]) 
	{
		// start monitoring one-shot so we can get the initial geo
		// will automatically stop after the first location if no listeners
		// have been added - this also has the benefit of warming up geo
		// for apps that use it initially
		[self updateLocManagerAccuracy];
		[locationManager startUpdatingLocation];
	}
*/
	
	return YES;
}

- (void) dealloc
{
	[proxyDictionary release];
	[locationManager stopUpdatingLocation];
	[locationManager release];
	[proxyLock release];
	[super dealloc];
}


@end

#endif
