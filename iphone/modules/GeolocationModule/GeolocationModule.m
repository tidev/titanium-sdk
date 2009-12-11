/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_GEOLOCATION

#import "GeolocationModule.h"
#import "AnalyticsModule.h"
#import "Logging.h"
#import <sys/utsname.h>


NSUInteger lastWatchID = 0;
NSUInteger lastHeadingID = 0;

#define MAX_DELAY_BEFORE_TRANSMIT_GEO_EVENT_IN_SEC 30		// only transmit geo events at most every 30 seconds
#define MAX_DELAY_BEFORE_TRANSMIT_HEADING_EVENT_IN_SEC 0.5

#define TYPE_HEADING 1
#define TYPE_POSITION 2

@interface GeolocationProxy : TitaniumProxyObject {
	BOOL	highAccuracy;
	NSDate * timeoutDate;
	NSDate * minimumCacheTime;
	NSTimer * timeoutTimer;
	BOOL	singleShot;
	BOOL	enabled;
	CLLocationDistance distanceFilter;
	CLLocationDegrees headingFilter;
	CLLocation *location;
	CLHeading *heading;
	short type;
}

- (BOOL) handlesLocation: (CLLocation *) newLocation;
- (BOOL) handlesError: (NSError *) error;
- (void) runCallback: (NSString *) callBack;

@property(nonatomic,readwrite,assign)	BOOL	highAccuracy;
@property(nonatomic,readwrite,assign)	BOOL	singleShot;
@property(nonatomic,readwrite,assign)	BOOL	enabled;
@property(nonatomic,readwrite,assign)	short type;
@property(nonatomic,readwrite,assign)	CLLocationDistance	distanceFilter;
@property(nonatomic,readwrite,assign)	CLLocationDegrees	headingFilter;
@property(nonatomic,readwrite,retain)   CLLocation *location;
@property(nonatomic,readwrite,retain)   CLHeading *heading;
@property(nonatomic,readwrite,retain)	NSDate * minimumCacheTime;


@end

@implementation GeolocationProxy
@synthesize highAccuracy, singleShot, minimumCacheTime, enabled, distanceFilter, headingFilter, location, heading, type;

- (void) takeDetails: (NSDictionary *) detailsDict;
{
	highAccuracy = YES;
	
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
	
	[self setDistanceFilter:kCLDistanceFilterNone];
	
	id distance = [detailsDict objectForKey:@"distanceFilter"];
	if ([distance respondsToSelector:@selector(doubleValue)]){
		[self setDistanceFilter:[distance doubleValue]];
	}
	
	[self setHeadingFilter:kCLHeadingFilterNone];

	id headingF = [detailsDict objectForKey:@"headingFilter"];
	if ([headingF respondsToSelector:@selector(doubleValue)]){
		[self setHeadingFilter:[headingF doubleValue]];
	}

}

- (BOOL) handlesLocation: (CLLocation *) newLocation;
{
	float newLocationDistance = [location getDistanceFrom:newLocation];

	if (minimumCacheTime == nil || location == nil)
	{
		return YES;
	}
	// check the distance filter since we're aggregating multiples locations
	if (kCLDistanceFilterNone!=distanceFilter && location!=nil)
	{
		if (newLocationDistance < distanceFilter)
		{
			[self setLocation:newLocation];
			return NO;
		}
	}
	[self setLocation:newLocation];
	return [minimumCacheTime timeIntervalSinceDate:[newLocation timestamp]] > 0;
}

- (BOOL) handlesHeading: (CLHeading*)newHeading
{
	if (heading == nil || kCLHeadingFilterNone==headingFilter)
	{
		[self setHeading:newHeading];
		return YES;
	}
	[self setHeading:newHeading];
	CLLocationDirection newDir = [newHeading magneticHeading];
	CLLocationDirection oldDir = [heading magneticHeading];
	return (newDir - oldDir >= headingFilter);
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

	[self sendJavascript:actionString];
	[actionString release];
}

- (void) dealloc
{
	[minimumCacheTime release];
	[timeoutDate release];
	[timeoutTimer release];
	[location release];
	[heading release];
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

+ (NSString*) stringFromHeading: (CLHeading *) newHeading
{
	long long ts = (long long)[[newHeading timestamp] timeIntervalSinceReferenceDate] * 1000;
	
	NSDictionary *dict = [NSDictionary dictionaryWithObjectsAndKeys:
						  [NSNumber numberWithDouble:[newHeading magneticHeading]],@"magneticHeading",
						  [NSNumber numberWithDouble:[newHeading trueHeading]],@"trueHeading",
						  [NSNumber numberWithDouble:[newHeading headingAccuracy]],@"accuracy",
						  [NSNumber numberWithLongLong:ts],@"timestamp",
						  [NSNumber numberWithDouble:[newHeading x]],@"x",
						  [NSNumber numberWithDouble:[newHeading y]],@"y",
						  [NSNumber numberWithDouble:[newHeading z]],@"z",
						  nil];
	
	return [NSString stringWithFormat:@"success(%@)",[SBJSON stringify:dict]];
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

- (void) updateLocManagerAccuracy:(NSNumber*)startPolling;
{
	[proxyLock lock];
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if ([thisProxy highAccuracy]) {
			[locationManager setDesiredAccuracy:kCLLocationAccuracyBest];
			[proxyLock unlock];
			if (startPolling)
			{
				[self updatePolling];	
			}
			return;
		}
	}
	[proxyLock unlock];

	[locationManager setDesiredAccuracy:kCLLocationAccuracyKilometer];
	if (startPolling)
	{
		[self updatePolling];	
	}
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
	if (module!=nil)
	{
		NSDictionary * data = [NSDictionary dictionaryWithObjectsAndKeys:[self getGeoData:location],@"to",[self getGeoData:fromLocation],@"from",nil];
		[module enqueuePlatformEvent:@"ti.geo" evtname:@"ti.geo" data:data];
	}
}

- (void) updatePolling;
{
	[proxyLock lock];
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if ([thisProxy enabled] && [thisProxy type]==TYPE_POSITION) 
		{ 
			if (locationStarted==NO)
			{
				locationStarted = YES;
				[locationManager startUpdatingLocation];
				NSLog(@"[DEBUG] starting location detection");
			}
			[proxyLock unlock];
			return;
		}
	}

	NSLog(@"[DEBUG] stopping location detection");

	locationStarted = NO;
	[proxyLock unlock];
	[locationManager stopUpdatingLocation];
}

- (void) updateHeading
{
	if (![locationManager headingAvailable]) return;
	
	[proxyLock lock];

	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if ([thisProxy enabled] && [thisProxy type]==TYPE_HEADING) 
		{ 
			if (headingStarted==NO)
			{
				headingStarted=YES;
				[locationManager startUpdatingHeading];
				NSLog(@"[DEBUG] starting heading detection");
			}
			[proxyLock unlock];
			return;
		}
	}
	
	NSLog(@"[DEBUG] stopping heading detection");
	headingStarted = NO;
	[proxyLock unlock];
	[locationManager stopUpdatingHeading];
}

- (void)triggerGeo:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation;
{
	if ((lastEvent == nil) || ((-[lastEvent timeIntervalSinceNow]) >= MAX_DELAY_BEFORE_TRANSMIT_GEO_EVENT_IN_SEC))
	{
		[self transmitGeoEvent:newLocation fromLocation:oldLocation];
	}
}
- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation;
{	
	VERBOSE_LOG(@"[DEBUG] GEO RECEIVED = %@", newLocation);
	
	NSString * locationString = nil;
	
	[proxyLock lock];
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if(![thisProxy enabled])continue;
		if ([thisProxy type]==TYPE_POSITION && [thisProxy handlesLocation:newLocation]) {
			if (locationString == nil){ locationString = [GeolocationProxy stringFromLocation:newLocation]; }
			[thisProxy runCallback:locationString];
		}
	}
	[proxyLock unlock];

	[self triggerGeo:newLocation fromLocation:oldLocation];

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

- (void)locationManager:(CLLocationManager *)manager didUpdateHeading:(CLHeading *)newHeading
{
	VERBOSE_LOG(@"[DEBUG] HEADING RECEIVED = %@", newHeading);
	
	// only send heading events every so often to the JS layer since they come very fast and often
	if ((lastHeadingEvent != nil) && ((-[lastHeadingEvent timeIntervalSinceNow]) < MAX_DELAY_BEFORE_TRANSMIT_HEADING_EVENT_IN_SEC))
	{
		return;
	}

	NSString * locationString = nil;
	
	[proxyLock lock];
	for (GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator]){
		if(![thisProxy enabled])continue;
		if ([thisProxy type]==TYPE_HEADING && [thisProxy handlesHeading:newHeading]) {
			if (locationString == nil){ locationString = [GeolocationProxy stringFromHeading:newHeading]; }
			[thisProxy runCallback:locationString];
		}
	}
	[proxyLock unlock];
	
	[lastHeadingEvent release];
	lastHeadingEvent = [[NSDate alloc] init];
	lastHeadingID++;
	[self performSelectorOnMainThread:@selector(updateHeading) withObject:nil waitUntilDone:NO];
}

- (BOOL)locationManagerShouldDisplayHeadingCalibration:(CLLocationManager *)manager
{
	return YES;
}

- (NSString *) tokenIsOneShot: (id)isOneShotObj options: (id)propertiesDict type:(NSString*)type
{
	GeolocationProxy * newProxy = [[GeolocationProxy alloc] init];
	BOOL heading=NO;
	NSString * newToken = [NSString stringWithFormat:@"GEO%d",lastWatchID++];
	
	if ([type isEqualToString:@"position"])
	{
		[newProxy setType:TYPE_POSITION];
	}
	else
	{
		[newProxy setType:TYPE_HEADING];
		heading = YES;
	}

	[newProxy setToken:newToken];

	[proxyLock lock];
	[proxyDictionary setObject:newProxy forKey:newToken];
	[proxyLock unlock];

	if ([propertiesDict isKindOfClass:[NSDictionary class]]) [newProxy takeDetails:propertiesDict];

	if ([isOneShotObj respondsToSelector:@selector(boolValue)]){
		[newProxy setSingleShot:[isOneShotObj boolValue]];
	}

	if (heading == NO)
	{
		[self performSelectorOnMainThread:@selector(updateLocManagerAccuracy:) withObject:[NSNumber numberWithBool:YES] waitUntilDone:NO];
	}
	else 
	{
		[self performSelectorOnMainThread:@selector(updateHeading) withObject:nil waitUntilDone:NO];
	}

	
	[newProxy release];
	
	return newToken;
}

- (TitaniumJSCode *) clearWatch: (id) token;
{
	if (![token isKindOfClass:[NSString class]]) return nil;
	[proxyLock lock];
	[proxyDictionary removeObjectForKey:token];
	
	int position_count=0;
	int heading_count=0;
	
	for(GeolocationProxy * thisProxy in [proxyDictionary objectEnumerator])
	{
		if([thisProxy enabled])
		{
			if ([thisProxy type]==TYPE_POSITION)
			{
				position_count++;
			}
			else 
			{
				heading_count++;
			}
		}
	}
	
	if (position_count == 0)
	{
		[self performSelectorOnMainThread:@selector(updatePolling) withObject:nil waitUntilDone:NO];
	}
	if (heading_count==0 && [locationManager headingAvailable]) 
	{
		[self performSelectorOnMainThread:@selector(updateHeading) withObject:nil waitUntilDone:NO];
	}
	[self performSelectorOnMainThread:@selector(updateLocManagerAccuracy:) withObject:[NSNumber numberWithBool:NO] waitUntilDone:NO];
	[proxyLock unlock];
	
	return [TitaniumJSCode codeWithString:[NSString stringWithFormat:@"delete Ti.Geolocation._WATCH.%@;",token]];
}

- (void) setWatch: (NSString *) token enabled: (NSNumber *) isEnabled
{
	if(![isEnabled respondsToSelector:@selector(boolValue)])return;
	[proxyLock lock];
	GeolocationProxy * ourProxy = [proxyDictionary objectForKey:token];

	if(ourProxy != nil)
	{
		[ourProxy setEnabled:[isEnabled boolValue]];
		if ([ourProxy type]==TYPE_POSITION)
		{
			[self performSelectorOnMainThread:@selector(updateLocManagerAccuracy:) withObject:[NSNumber numberWithBool:YES] waitUntilDone:NO];		
		}
		else 
		{
			[self performSelectorOnMainThread:@selector(updateHeading) withObject:nil waitUntilDone:NO];
		}
	}
	[proxyLock unlock];
}

- (NSString*) performGeo:(NSString*)direction address:(NSString*)address
{
	TitaniumHost *tiHost = [TitaniumHost sharedHost];
	AnalyticsModule * mod = (AnalyticsModule *) [tiHost moduleNamed:@"AnalyticsModule"];
	NSDictionary * appPropertiesDict = [tiHost appProperties];
	NSString * aguid = [appPropertiesDict objectForKey:@"guid"];
	NSString *sid = (mod!=nil) ? [mod sessionID] : nil;
	UIDevice *theDevice = [UIDevice currentDevice];	
	NSString *mid = [theDevice uniqueIdentifier];

	NSLocale *locale = [NSLocale currentLocale];
	NSString *countryCode = [locale objectForKey: NSLocaleCountryCode];
	
	// hit our unified geocoding service for both reverse and forward geocoding
	NSString *urlString = [NSString stringWithFormat:@"http://api.appcelerator.net/p/v1/geo?d=%@&mid=%@&aguid=%@&sid=%@&q=%@&c=%@",direction,mid,aguid,sid,[address stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding],countryCode];
	return [NSString stringWithContentsOfURL:[NSURL URLWithString:urlString] encoding:NSUTF8StringEncoding error:nil];
}

- (void) reverseGeo:(NSDictionary *)dict
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

	// result comes back as JSON
	NSString * result = [self performGeo:@"r" address:[NSString stringWithFormat:@"%@,%@",[dict objectForKey:@"latitude"],[dict objectForKey:@"longitude"]]];
	
	NSString * token = [dict objectForKey:@"token"];
	NSString * actionString = [NSString stringWithFormat:@"Ti.Geolocation._TOKEN['%@'](%@); delete Ti.Geolocation._TOKEN['%@'];",token,result,token];

#ifdef VERBOSE_LOG
	NSLog(@"[DEBUG] reverse geo result: %@",actionString);
#endif
	
	[[TitaniumHost sharedHost] sendJavascript:actionString toPageWithToken:[dict objectForKey:@"pageToken"]];

	[pool release];
}

- (void) reverseGeo:(NSDictionary*)dict token:(NSString*)token
{
	NSDictionary *newdict = [NSDictionary dictionaryWithObjectsAndKeys:[dict objectForKey:@"latitude"],@"latitude",[dict objectForKey:@"longitude"],@"longitude",token,@"token",pageToken,@"pageToken",nil];
	[NSThread detachNewThreadSelector:@selector(reverseGeo:) toTarget:self withObject:newdict];
}

- (void) forwardGeo:(NSDictionary*)dict
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	
	NSString *address = [dict objectForKey:@"address"];
	NSString *locationString = [self performGeo:@"f" address:address];

#ifdef VERBOSE_LOG
	NSLog(@"[DEBUG] forward geo result: %@",locationString);
#endif
	
	// forward geo comes back as CSV
	NSArray *listItems = [locationString componentsSeparatedByString:@","];
	if([listItems count] == 4 && [[listItems objectAtIndex:0] isEqualToString:@"200"]) 
	{
		id accuracy = [listItems objectAtIndex:1];
		id latitude = [listItems objectAtIndex:2];
		id longitude = [listItems objectAtIndex:3];
		NSString * token = [dict objectForKey:@"token"];
		NSDictionary *result = [NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithBool:YES],@"success",accuracy,@"accuracy",latitude,@"latitude",longitude,@"longitude",nil];
		NSString * actionString = [NSString stringWithFormat:@"Ti.Geolocation._FTOKEN['%@'](%@); delete Ti.Geolocation._FTOKEN['%@'];",token,[SBJSON stringify:result],token];
		[[TitaniumHost sharedHost] sendJavascript:actionString toPageWithToken:[dict objectForKey:@"pageToken"]];
	}
	else 
	{
		//TODO: better error handling
		NSString * ourToken = [dict objectForKey:@"token"];
		NSString * actionString = [NSString stringWithFormat:@"Ti.Geolocation._FTOKEN['%@']({success:false}); delete Ti.Geolocation._FTOKEN['%@'];",ourToken,ourToken];
		[[TitaniumHost sharedHost] sendJavascript:actionString toPageWithToken:[dict objectForKey:@"pageToken"]];
	}	

	[pool release];
}

- (void) forwardGeo:(NSString*)address token:(NSString*)token
{
	NSDictionary *dict = [NSDictionary dictionaryWithObjectsAndKeys:address,@"address",token,@"token",pageToken,@"pageToken",nil];
	[NSThread detachNewThreadSelector:@selector(forwardGeo:) toTarget:self withObject:dict];
}

- (void) setPageToken: (NSString *)token
{
	[pageToken release];
	pageToken = [token copy];
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
	[(GeolocationModule *)invocGen tokenIsOneShot:nil options:nil type:nil];
	NSInvocation * tokenInvoc = [invocGen invocation];
	
	[(GeolocationModule *)invocGen clearWatch:nil];
	NSInvocation * removeInvoc = [invocGen invocation];

	[(GeolocationModule *)invocGen setWatch:nil enabled:nil];
	NSInvocation * enableInvoc = [invocGen invocation];

	[(GeolocationModule *)invocGen reverseGeo:nil token:nil];
	NSInvocation * geoInvo = [invocGen invocation];

	[(GeolocationModule *)invocGen forwardGeo:nil token:nil];
	NSInvocation * fowardGeoInvo = [invocGen invocation];

	TitaniumJSCode * getCurrentPosition = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geolocation._NEWTOK(true,details,'position');"
			"Ti.Geolocation._WATCH[token]={success:succCB,fail:errCB};Ti.Geolocation.setWatchEnabled(token,true);return token;}"];

	TitaniumJSCode * getCurrentHeading = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geolocation._NEWTOK(true,details,'heading');"
			"Ti.Geolocation._WATCH[token]={success:succCB,fail:errCB};Ti.Geolocation.setWatchEnabled(token,true);return token;}"];

	TitaniumJSCode * watchPosition = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geolocation._NEWTOK(false,details,'position');"
			"Ti.Geolocation._WATCH[token]={success:succCB,fail:errCB};Ti.Geolocation.setWatchEnabled(token,true);return token;}"];

	TitaniumJSCode * watchHeading = [TitaniumJSCode codeWithString:@"function(succCB,errCB,details){var token=Ti.Geolocation._NEWTOK(false,details,'heading');"
			"Ti.Geolocation._WATCH[token]={success:succCB,fail:errCB};Ti.Geolocation.setWatchEnabled(token,true);return token;}"];

	TitaniumJSCode * reverseGeo = [TitaniumJSCode codeWithString:@"function(lat,lon,cb){"
		"if (!Ti.Geolocation._TOKEN){Ti.Geolocation._TOKEN={};Ti.Geolocation._TOKENID=0;}"
		"var t=String(++Ti.Geolocation._TOKENID);"
		"Ti.Geolocation._TOKEN[t]=cb;"
		"Ti.Geolocation._REVG({latitude:lat,longitude:lon},t);"
		"}"];
	TitaniumJSCode * forwardGeo = [TitaniumJSCode codeWithString:@"function(addr,cb){"
	   "if (!Ti.Geolocation._FTOKEN){Ti.Geolocation._FTOKEN={};Ti.Geolocation._FTOKENID=0;}"
	   "var t=String(++Ti.Geolocation._FTOKENID);"
	   "Ti.Geolocation._FTOKEN[t]=cb;"
	   "Ti.Geolocation._FWDG(addr,t);"
	   "}"];
	
	UIDevice * theDevice = [UIDevice currentDevice];
	NSString* version = [theDevice systemVersion];
	
	BOOL headingAvailableBool = NO;
	if ([locationManager respondsToSelector:@selector(headingAvailable)])
	{
		struct utsname u;
		uname(&u);
		if (!strcmp(u.machine, "i386")) 
		{
			// 3.0 simulator headingAvailable will report YES but its not really available except post 3.0
			headingAvailableBool = [version hasPrefix:@"3.0"] ? NO : [locationManager headingAvailable];
		}
		else {
			headingAvailableBool = [locationManager headingAvailable];
		}

		
	}
	
	// determine if we have compass support
	NSNumber *headingAvailable = [NSNumber numberWithBool:headingAvailableBool];
	
	NSDictionary * geoDict = [NSDictionary dictionaryWithObjectsAndKeys:
			getCurrentPosition, @"getCurrentPosition",
			getCurrentHeading, @"getCurrentHeading",
			watchPosition, @"watchPosition",
			removeInvoc,@"clearWatch",
			watchHeading, @"watchHeading",
			tokenInvoc,@"_NEWTOK",
			geoInvo,@"_REVG",
			fowardGeoInvo,@"_FWDG",
			reverseGeo,@"reverseGeocoder",
	 	    forwardGeo,@"forwardGeocoder",
			enableInvoc,@"setWatchEnabled",
			[NSDictionary dictionary],@"_WATCH",
			headingAvailable,@"hasCompass",				  
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject: geoDict forKey:@"Geolocation"];
	
	return YES;
}

- (void) dealloc
{
	[lastEvent release];
	[pageToken release];
	[proxyDictionary release];
	[locationManager stopUpdatingLocation];
	[locationManager release];
	[proxyLock release];
	[super dealloc];
}


@end

#endif
