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

@interface GeolocationProxy : TitaniumProxyObject {
//	NSString * 
	BOOL	highAccuracy;
	NSDate * timeoutDate;
	NSDate * minimumCacheTime;
	NSTimer * timeoutTimer;
	BOOL	singleShot;
//	NSTimer
}

- (BOOL) handlesLocation: (CLLocation *) newLocation;
- (BOOL) handlesError: (NSError *) error;
- (void) runCallback: (NSString *) callBack;

@property(nonatomic,readwrite,assign)	BOOL	highAccuracy;
@property(nonatomic,readwrite,assign)	BOOL	singleShot;
@property(nonatomic,readwrite,retain)	NSDate * minimumCacheTime;


@end

@implementation GeolocationProxy
@synthesize highAccuracy, singleShot, minimumCacheTime;

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
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if ([thisProxy highAccuracy]) {
			[locationManager setDesiredAccuracy:kCLLocationAccuracyBest];
			return;
		}
	}
	[locationManager setDesiredAccuracy:kCLLocationAccuracyKilometer];
}

- (void) updatePolling;
{
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if (1) { //TODO: Do we want to expose a way to disable polling yet keep the listener?
			[locationManager startUpdatingLocation];
			return;
		}
	}
	[locationManager stopUpdatingLocation];
}

- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation;
{
	NSString * locationString = nil;
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if ([thisProxy handlesLocation:newLocation]) {
			if (locationString == nil){ locationString = [GeolocationProxy stringFromLocation:newLocation]; }
			[thisProxy runCallback:locationString];
		}
	}
	if(watchEventsFired == 0){
		[(AnalyticsModule *)[[TitaniumHost sharedHost] moduleNamed:@"AnalyticsModule"] addEvent:@"Geolocation" value:@"Success"];
	}
	watchEventsFired ++;
	[self updatePolling];
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error;
{
	NSString * errorString = nil;
	if ([error code] == kCLErrorDenied) [manager stopUpdatingLocation];

	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if ([thisProxy handlesError:error]) {
			if (errorString == nil){ errorString = [GeolocationProxy stringFromError:error timedout:NO]; }
			[thisProxy runCallback:errorString];
		}
	}
	if(watchEventsFired == 0){
		[(AnalyticsModule *)[[TitaniumHost sharedHost] moduleNamed:@"AnalyticsModule"] addEvent:@"Geolocation" value:@"Failed"];
	}
	watchEventsFired ++;
	[self updatePolling];
}

- (NSString *) tokenForWatchProperties: (id) propertiesDict isOneShot: (id) isOneShotObj;
{
	NSString * newToken = [NSString stringWithFormat:@"GEO%d",lastWatchID++];
	GeolocationProxy * newProxy = [[GeolocationProxy alloc] init];
	[newProxy setToken:newToken];
	[proxyDictionary setObject:newProxy forKey:newToken];
	if ([propertiesDict isKindOfClass:[NSDictionary dictionary]]) [newProxy takeDetails:propertiesDict];

	[self updatePolling];
	if ([isOneShotObj respondsToSelector:@selector(boolValue)]){
		[newProxy setSingleShot:[isOneShotObj boolValue]];
		[self updateLocManagerAccuracy];
	}
	[newProxy release];
	
	return newToken;
}

- (TitaniumJSCode *) clearWatch: (id) token;
{
	if (![token isKindOfClass:[NSString class]]) return nil;
	[proxyDictionary removeObjectForKey:token];
	
	[self updateLocManagerAccuracy];
	if ([proxyDictionary count] == 0){
		[self updatePolling];
	}
	
	return [TitaniumJSCode codeWithString:[NSString stringWithFormat:@"delete Ti.Geolocation._WATCH.%@;",token]];
}



- (BOOL) startModule;
{
	locationManager = [[CLLocationManager alloc] init];
	[locationManager setDelegate:self];

//	if ([locationManager locationServicesEnabled]) {
//		[locationManager startUpdatingLocation];
//	}

	proxyDictionary = [[NSMutableDictionary alloc] init];
	
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	[(GeolocationModule *)invocGen tokenForWatchProperties:nil isOneShot:nil];
	NSInvocation * tokenInvoc = [invocGen invocation];
	
	[(GeolocationModule *)invocGen clearWatch:nil];
	NSInvocation * removeInvoc = [invocGen invocation];
	
	TitaniumJSCode * getCurrentPosition = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geolocation._NEWTOK(details,true);Ti.Geolocation._WATCH[token]={success:succCB,fail:errCB};return token;}"];
	TitaniumJSCode * watchPosition = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geolocation._NEWTOK(details,false);Ti.Geolocation._WATCH[token]={success:succCB,fail:errCB};return token;}"];
	
	NSDictionary * geoDict = [NSDictionary dictionaryWithObjectsAndKeys:
			getCurrentPosition, @"getCurrentPosition",
			watchPosition, @"watchPosition",
			removeInvoc,@"clearWatch",
			tokenInvoc,@"_NEWTOK",
			[NSDictionary dictionary],@"_WATCH",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject: geoDict forKey:@"Geolocation"];
	
	return YES;
}

- (void) dealloc
{
	[proxyDictionary release];
	[locationManager stopUpdatingLocation];
	[locationManager release];
	[super dealloc];
}


@end

#endif
