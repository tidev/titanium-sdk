/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "AnalyticsModule.h"
#import "PlatformModule.h"
#import "NetworkModule.h"
#import <sys/utsname.h>

#import "Logging.h"
#import "TitaniumJSCode.h"

#define TI_ANALYTICS_TIMER_DELAY_IN_SEC 10
#define TI_ANALYTICS_NETWORK_TIMEOUT_IN_SEC 30
#define TI_ANALYTICS_NETWORK_TIMEOUT_ON_SHUTDOWN_IN_SEC 10

NSURL * AnalyticsModuleURL = nil;

@interface AnalyticsPacket : NSObject
{
	AnalyticsModule * module;
	NSMutableArray * eventArray;
	NSURLConnection * connection;
}
@end

@implementation AnalyticsPacket

- (id) initWithModule: (AnalyticsModule *) newModule sendEvents: (NSMutableArray *) newEventArray timeout: (NSTimeInterval) timeout;
{
	self = [super init];
	if(self == nil)return nil;
	
	[[TitaniumHost sharedHost] pauseTermination];
	module = newModule; eventArray = newEventArray;
	if(AnalyticsModuleURL == nil){
		AnalyticsModuleURL = [[NSURL URLWithString:@"https://api.appcelerator.net/p/v2/mobile-track"] retain];
	}
	NSMutableURLRequest * ourRequest = [NSMutableURLRequest requestWithURL:AnalyticsModuleURL cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:timeout];
	[ourRequest setHTTPMethod: @"POST"];[ourRequest setHTTPShouldHandleCookies:YES];
	[ourRequest setValue:@"text/json" forHTTPHeaderField:@"Content-Type"];

	NSMutableData * data = [[NSMutableData alloc] initWithData:[@"[" dataUsingEncoding:NSUTF8StringEncoding]];
	BOOL firstItem = YES;
	for (NSData *eventdata in newEventArray)
	{
		if(firstItem){
			firstItem = NO;
		} else {
			[data appendData:[@"," dataUsingEncoding:NSUTF8StringEncoding]];
		}
		[data appendData:eventdata];
	}
	[data appendData:[@"]" dataUsingEncoding:NSUTF8StringEncoding]];
	[ourRequest setHTTPBody:data];
	[data release];

	connection = [[NSURLConnection alloc] initWithRequest:ourRequest delegate:self startImmediately:YES];
	
	return self;
}

- (void)connectionDidFinishLoading:(NSURLConnection *)URLConnection;
{
	VERBOSE_LOG(@"Analytics successfully sent %@",eventArray);
	[eventArray release];
	[self autorelease];
}

- (void)connection:(NSURLConnection *)URLConnection didFailWithError:(NSError *)error;
{
	VERBOSE_LOG(@"Analytics failed with %@. Tried to send: %@",error,eventArray);
	[module keepEvents:eventArray];
	[self autorelease];
}

- (void) dealloc
{
	[[TitaniumHost sharedHost] resumeTermination];
	[connection release];
	[super dealloc];
}



@end




//NOTE: this is defined in the application at build time and we pull this in
extern NSString * APPLICATION_DEPLOYTYPE;

@implementation AnalyticsModule
@synthesize sessionID;

- (void)dealloc
{
	[timer release];
	[events release];
	[super dealloc];
}

- (void) setConnectionState: (NetworkModuleConnectionState) newState;
{
	connectionState = newState;
	[self sendEvents];
}

- (NSArray*) moduleDependencies
{
	return [NSArray arrayWithObjects:@"network",@"platform",nil];
}


#define VAL_OR_NSNULL(foo)	(((foo) != nil)?((id)foo):[NSNull null])

-(NSString *)getUTCDate
{
	NSDateFormatter *dateFormatter = [[[NSDateFormatter alloc] init] autorelease];
	NSTimeZone *timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
	[dateFormatter setTimeZone:timeZone];
	//Example UTC full format: 2009-06-15T21:46:28.685+0000
	[dateFormatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss'.'SSS+0000"];
	return [dateFormatter stringFromDate:[NSDate date]];
}

- (NSData*) generateEventObject: (NSString*)evttype evtname:(NSString*) evtname data:(id)data
{
	SBJSON * encoder = [[SBJSON alloc] init];

	NSDictionary * appPropertiesDict = [[TitaniumHost sharedHost] appProperties];
	NSString * aguid = [appPropertiesDict objectForKey:@"guid"];
	
	int seq = sequence++;
	
	NSString *ts = [self getUTCDate];
	NSString *sid = sessionID;
	UIDevice *theDevice = [UIDevice currentDevice];	
	NSString *mid = [theDevice uniqueIdentifier];
	NSString *eventId = [(PlatformModule *)[[TitaniumHost sharedHost] moduleNamed:@"PlatformModule"] createUUID];
	NSString *remoteDeviceUUID = [(NetworkModule*)[[TitaniumHost sharedHost] moduleNamed:@"NetworkModule"] remoteDeviceUUID];
	
	NSString *json = [encoder stringWithObject:[NSDictionary dictionaryWithObjectsAndKeys: 
		VAL_OR_NSNULL(eventId), @"id",
		[NSNumber numberWithInt:seq],@"seq",
		VAL_OR_NSNULL(aguid),@"aguid",
		VAL_OR_NSNULL(mid),@"mid",
		VAL_OR_NSNULL(ts),@"ts",
		@"2",@"ver", // spec version
		VAL_OR_NSNULL(sid),@"sid",
		VAL_OR_NSNULL(evtname),@"event",
		VAL_OR_NSNULL(evttype),@"type",
		VAL_OR_NSNULL(data),@"data",
		VAL_OR_NSNULL(remoteDeviceUUID),@"rdu",
		nil] error:nil];
		
	[encoder release];

#ifdef EXTREME_DEBUG 
	NSLog(@"[DEBUG] Generating Analytics event data: %@",json);
#endif
	
	return [json dataUsingEncoding:NSUTF8StringEncoding];
}


#pragma mark Analytics try 3

- (void)sendEvents;
{
	if(events==nil)return;

	if(packetDueDate==nil){
		packetDueDate = [[NSDate alloc] initWithTimeIntervalSinceNow:TI_ANALYTICS_TIMER_DELAY_IN_SEC];
		[self performSelector:@selector(sendEvents) withObject:nil afterDelay:TI_ANALYTICS_TIMER_DELAY_IN_SEC];
		return;
	} else if ([packetDueDate timeIntervalSinceNow]>0){
		return;
	}

	if(connectionState == NetworkModuleConnectionStateUnknown){
		NetworkModule * theNetMod = (NetworkModule *) [[TitaniumHost sharedHost] moduleNamed:@"NetworkModule"];
		connectionState = [theNetMod currentNetworkConnectionState];
		//TODO: Refactor the network connection to be independant of things.
	}

	if(connectionState == NetworkModuleConnectionStateNone)return;

	[mutex lock];

	if(events!=nil){ //Yes, we already checked before, but that was BEFORE the mutex!
		AnalyticsPacket * packet = [[AnalyticsPacket alloc] initWithModule:self sendEvents:events timeout:TI_ANALYTICS_NETWORK_TIMEOUT_IN_SEC];
		if(packet != nil){
			[[TitaniumHost sharedHost] resumeTermination];
			events=nil; //Releasing is handled through sleight of hand.
			[packetDueDate release];packetDueDate=nil;
		} else {
			[self performSelector:@selector(sendEvents) withObject:nil afterDelay:TI_ANALYTICS_TIMER_DELAY_IN_SEC];
		}
	}
	[mutex unlock];

}

- (void) keepEvents: (NSMutableArray *)newEvents;
{
	[mutex lock];
	if(events==nil){
		[[TitaniumHost sharedHost] pauseTermination];
		events = newEvents;
		[self performSelectorOnMainThread:@selector(sendEvents) withObject:nil waitUntilDone:NO];
	} else {
		[events	addObjectsFromArray:newEvents];
		[newEvents release];
	}
	[mutex unlock];
}

- (void)enqueuePlatformEvent:(NSString*)eventtype evtname:(NSString*)eventname data:(NSDictionary*)data;
{
	[mutex lock];
	NSData * newEvent = [self generateEventObject:eventtype evtname:eventname data:data];
	if(events==nil){
		[[TitaniumHost sharedHost] pauseTermination];
		events = [[NSMutableArray alloc] initWithObjects:newEvent,nil];
		[self performSelectorOnMainThread:@selector(sendEvents) withObject:nil waitUntilDone:NO];
	} else {
		[events	addObject:newEvent];
	}
	[mutex unlock];
}

#pragma mark 

- (void) pageLoaded;
{
	if (hasSentStart)return;
	hasSentStart = YES;

	NSString * supportFolderPath = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	NSString * folderPath = [supportFolderPath stringByAppendingPathComponent:@"analytics"];
	NSFileManager * theFM = [[NSFileManager alloc] init];
	BOOL isDirectory;
	BOOL exists = [theFM fileExistsAtPath:folderPath isDirectory:&isDirectory];
	
	// we create the directory (it's empty for now) that let's us differentiate between first install and subsequent run
	if (!exists) [theFM createDirectoryAtPath:folderPath withIntermediateDirectories:YES attributes:nil error:nil];
	[theFM release];
	
	// on the first install we need to notify with ti.enroll
	if (!exists)
	{
		NSDictionary * platformDict = [[[TitaniumHost sharedHost] titaniumObject] objectForKey:@"Platform"];
		NSDictionary * appPropertiesDict = [[TitaniumHost sharedHost] appProperties];
		
		NSString * mac_addr = [platformDict objectForKey:@"macaddress"];
		NSString * phonenumber = [platformDict objectForKey:@"phoneNumber"];
		NSString * model = [platformDict objectForKey:@"model"];
		NSString * app_name = [appPropertiesDict objectForKey:@"name"];
		NSString * app_id = [appPropertiesDict objectForKey:@"id"];
		
		NSDictionary * data = [NSDictionary dictionaryWithObjectsAndKeys:
							   VAL_OR_NSNULL(mac_addr),@"mac_addr",
							   VAL_OR_NSNULL(app_name),@"app_name",
							   [NSNumber numberWithInt:1],@"oscpu",
							   @"iphone",@"platform",
							   VAL_OR_NSNULL(APPLICATION_DEPLOYTYPE),@"deploytype",
							   VAL_OR_NSNULL(app_id),@"app_id",
							   @"32bit",@"ostype",
							   @"arm",@"osarch",
							   VAL_OR_NSNULL(phonenumber),@"phonenumber",
							   VAL_OR_NSNULL(model),@"model",
							   nil
							   ];
		[self enqueuePlatformEvent:@"ti.enroll" evtname:@"ti.enroll" data:data];
	}
	
	
	int tz = [[NSTimeZone systemTimeZone] secondsFromGMT] / 60; // get the timezone offset to UTC in minutes
	struct utsname u;
	uname(&u);
	
	NSDictionary * platformDict = [[[TitaniumHost sharedHost] titaniumObject] objectForKey:@"Platform"];
	NSDictionary * appPropertiesDict = [[TitaniumHost sharedHost] appProperties];
	
	NSString * app_ver = [appPropertiesDict objectForKey:@"version"];
	NSString * version = [NSString stringWithCString:TI_VERSION_STR encoding:NSUTF8StringEncoding];
	NSString * os = [NSString stringWithCString:u.release encoding:NSUTF8StringEncoding];
	NSString * username = [platformDict objectForKey:@"username"];
	
#ifdef MODULE_TI_NETWORK
	NSString * nettype = [((NetworkModule *)[[TitaniumHost sharedHost] moduleNamed:@"NetworkModule"]) networkTypeName];
#else
	NSString * nettype = @"UNKNOWN";
#endif
	
	NSDictionary * data = [NSDictionary dictionaryWithObjectsAndKeys:
						   [NSNumber numberWithInt:tz],@"tz",
						   VAL_OR_NSNULL(APPLICATION_DEPLOYTYPE),@"deploytype",
						   @"iphone",@"os",
						   version,@"version",
						   VAL_OR_NSNULL(username),@"un",
						   VAL_OR_NSNULL(app_ver),@"app_version",
						   os,@"osver",
						   VAL_OR_NSNULL(nettype),@"nettype",
						   nil
						   ];
	[self enqueuePlatformEvent:@"ti.start" evtname: @"ti.start" data:data];
}


- (void) addEvent: (NSString *) eventtype evtname: (NSString *) eventname value: (id) value;
{
	Class stringClass = [NSString class];
	if(![eventtype isKindOfClass:stringClass] || ![eventname isKindOfClass:stringClass])return;
	if([value isKindOfClass:stringClass]) value = [NSDictionary dictionaryWithObject:value forKey:@"data"];
	[self enqueuePlatformEvent:eventtype evtname: eventname data:value];
}


#pragma mark startModule

- (BOOL) startModule
{
	[self setSessionID:[(PlatformModule *)[[TitaniumHost sharedHost] moduleNamed:@"PlatformModule"] createUUID]];
	sequence = 1;

	timer = nil;
	connectionState = NetworkModuleConnectionStateUnknown;
	
	TitaniumJSCode * epilogueCode = [TitaniumJSCode codeWithString:@"Ti.Analytics._START();"];
	
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	[(AnalyticsModule *)invocGen addEvent:nil evtname:nil value:nil];
	NSInvocation * setInvoc = [invocGen invocation];
	
	[(AnalyticsModule *)invocGen pageLoaded];
	NSInvocation * handlePageInvoc = [invocGen invocation];

	NSDictionary * methods = [NSDictionary dictionaryWithObjectsAndKeys:
			handlePageInvoc,@"_START",
			setInvoc,@"addEvent",
			epilogueCode,@"init",
			[TitaniumJSCode codeWithString:@"function(from, to, event, data) {"
				"var isUndefined=function(val){return ((val===null)||(typeof(val)==='undefined'))?true:((typeof(val)=='object')&&(String(val).length===0));};"
				"if (!isUndefined(from) && !isUndefined(to)) {"
					"if (isUndefined(event)) {"
						"event = '';"
					"}"
					"var payload = {};"
					"payload.from = isUndefined(from) ? {} : from;"
					"payload.to = isUndefined(to) ? {} : to;"
					"payload.data = isUndefined(data) ? {} : data;"
					"Titanium.Analytics.addEvent('app.nav', event, payload);"
				"} else {"
					"Titanium.API.error('from and to are required parameters for navEvent');"
				"}"
			"}"],@"navEvent",
			[TitaniumJSCode codeWithString:@"function(event, start, stop, duration, data) {"
			/*	"var isUndefined=function(val){return ((val===null)||(typeof(val)==='undefined'))?true:((typeof(val)=='object')&&(String(val).length===0));};"
				"var pad=function(n) {"
			    	"return (n < 10 ? '0' : '') + String(n);"
			  	"};"
			  	"var formatUTC=function(d) {"
			  		"return ["
			  		    "d.getUTCFullYear() , '-',"
			  		    "this.pad(1 + d.getUTCMonth()), '-',"
			  		    "this.pad(d.getUTCDate()),"
			  		    "'T',"
			  		    "this.pad(d.getUTCHours()) ,':',"
			  		    "this.pad(d.getUTCMinutes()), ':',"
			  		    "this.pad(d.getUTCSeconds()),'+0000'"
			  		"].join('');"
				"if (!isUndefined(event)) {"
					"var payload = {};"
					"if (!isUndefined(start)) {"
						"payload.start = formatUTC(start);"
					"}"
					"if (!isUndefined(stop)) {"
						"payload.stop = formatUTC(stop);"
					"}"
					"if (!isUndefined(duration)) {"
						"payload.duration = duration;"
					"}"
					"payload.data = isUndefined(data) ? {} : data;"
					"this.addEvent('app.timed_event', event, payload);"
				"} else {"
					"Titanium.API.error('timedEvent requires an event name');"
				"}"*/
			"}"],@"timedEvent",
			[TitaniumJSCode codeWithString:@"function(event, data) {"
				"var isUndefined=function(val){return ((val===null)||(typeof(val)==='undefined'))?true:((typeof(val)=='object')&&(String(val).length===0));};"
				"if (!isUndefined(event)) {"
					"var payload = {};"
					"payload.data = isUndefined(data) ? {} : data;"
					"this.addEvent('app.feature', event, payload);"
				"} else {"
					"Titanium.API.error('featureEvent requires an event name');"
				"}"
			"}"],@"featureEvent",
			[TitaniumJSCode codeWithString:@"function(event, data) {"
				"var isUndefined=function(val){return ((val===null)||(typeof(val)==='undefined'))?true:((typeof(val)=='object')&&(String(val).length===0));};"
				"if (!isUndefined(event)) {"
					"var payload = {};"
					"payload.data = isUndefined(data) ? {} : data;"
					"this.addEvent('app.settings', event, payload);"
				"} else {"
					"Titanium.API.error('settingsEvent requires an event name');"
				"}"
			"}"],@"settingsEvent",
			[TitaniumJSCode codeWithString:@"function(event, data) {"
				"var isUndefined=function(val){return ((val===null)||(typeof(val)==='undefined'))?true:((typeof(val)=='object')&&(String(val).length===0));};"
				"if (!isUndefined(event)) {"
					"var payload = {};"
					"payload.data = isUndefined(data) ? {} : data;"
					"this.addEvent('app.user', event, payload);"
				"} else {"
					"Titanium.API.error('userEvent requires an event name');"
				"}"
			"}"],@"userEvent",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:methods forKey:@"Analytics"];
	
	return YES;
}

- (BOOL) endModule;
{
	// first add to our queue (so we can flush)
	[packetDueDate release];
	packetDueDate = [[NSDate alloc] init];
	[self enqueuePlatformEvent:@"ti.end" evtname:@"ti.end" data:nil];
	[self sendEvents];
	return YES;
}
@end
