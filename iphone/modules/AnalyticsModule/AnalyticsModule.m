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
	NSTimeInterval timeout;
}
- (NSURLRequest *) urlRequest;
- (void)performAsynchronousData;
- (void)performSynchronousData;

@end

@implementation AnalyticsPacket

- (id) initWithModule: (AnalyticsModule *) newModule sendEvents: (NSMutableArray *) newEventArray timeout: (NSTimeInterval) newTimeout;
{
	self = [super init];
	if(self == nil)return nil;
	
	module = newModule; eventArray = newEventArray; timeout=newTimeout;
	if(AnalyticsModuleURL == nil){
		AnalyticsModuleURL = [[NSURL URLWithString:@"https://api.appcelerator.net/p/v2/mobile-track"] retain];
	}
	
	VERBOSE_LOG(@"[INFO] Analytics %@ will send %@",self,eventArray);
	return self;
}

- (NSURLRequest *) urlRequest;
{
	NSMutableURLRequest * result = [NSMutableURLRequest requestWithURL:AnalyticsModuleURL cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:timeout];
	[result setHTTPMethod: @"POST"];[result setHTTPShouldHandleCookies:YES];
	[result setValue:@"text/json" forHTTPHeaderField:@"Content-Type"];
	
	NSMutableData * data = [[NSMutableData alloc] initWithData:[@"[" dataUsingEncoding:NSUTF8StringEncoding]];
	BOOL firstItem = YES;
	for (NSData *eventdata in eventArray)
	{
		if(firstItem){
			firstItem = NO;
		} else {
			[data appendData:[@"," dataUsingEncoding:NSUTF8StringEncoding]];
		}
		[data appendData:eventdata];
	}
	[data appendData:[@"]" dataUsingEncoding:NSUTF8StringEncoding]];
	[result setHTTPBody:data];
	[data release];
	
	return result;
}

- (void)performAsynchronousData;
{
	[[TitaniumHost sharedHost] pauseTermination];
	connection = [[NSURLConnection alloc] initWithRequest:[self urlRequest] delegate:self startImmediately:YES];
}

- (void)performSynchronousData;
{
	NSURLResponse * response = nil;
	NSError * error = nil;
	
	VERBOSE_LOG(@"[INFO] Analytics %@ will send synchronous",self);

	NSData * result = [NSURLConnection sendSynchronousRequest:[self urlRequest] returningResponse:&response error:&error];
	
	VERBOSE_LOG(@"[INFO] Analytics %@ did synchronous:%@ response:%@ error:%@",self,result,response,error);
}


- (void)connectionDidFinishLoading:(NSURLConnection *)URLConnection;
{
	VERBOSE_LOG(@"[INFO] Analytics %@ successful!",self);
	[eventArray release];
	[[TitaniumHost sharedHost] resumeTermination];
	[self autorelease];
}

- (void)connection:(NSURLConnection *)URLConnection didFailWithError:(NSError *)error;
{
	VERBOSE_LOG(@"[INFO] Analytics %@ failed with %@",self,error);
	[module keepEvents:eventArray];
	[[TitaniumHost sharedHost] resumeTermination];
	[self autorelease];
}

- (void) dealloc
{
	VERBOSE_LOG(@"[INFO] Analytics %@ deallocing",self);
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
	if(events==nil || disabled)return;

	if (!endingModule) { //If we're ending, it's ALL DUE.
		if(packetDueDate==nil){
			packetDueDate = [[NSDate alloc] initWithTimeIntervalSinceNow:TI_ANALYTICS_TIMER_DELAY_IN_SEC];
			[self performSelector:@selector(sendEvents) withObject:nil afterDelay:TI_ANALYTICS_TIMER_DELAY_IN_SEC];
			return;
		} else if ([packetDueDate timeIntervalSinceNow]>0){
			return;
		}
	}

	if(connectionState == NetworkModuleConnectionStateUnknown){
		NetworkModule * theNetMod = (NetworkModule *) [[TitaniumHost sharedHost] moduleNamed:@"NetworkModule"];
		connectionState = [theNetMod currentNetworkConnectionState];
		//TODO: Refactor the network connection to be independant of things.
	}

	if(connectionState == NetworkModuleConnectionStateNone){
		if(!endingModule) return;
		//Else we should save this away for another time.
	}

	[mutex lock];

	if(events!=nil){ //Yes, we already checked before, but that was BEFORE the mutex!
		AnalyticsPacket * packet = [[AnalyticsPacket alloc] initWithModule:self sendEvents:events timeout:TI_ANALYTICS_NETWORK_TIMEOUT_IN_SEC];
		if(packet != nil){
			if(endingModule){
				[packet performSynchronousData];
			} else {
				[packet performAsynchronousData];
			}
			[[TitaniumHost sharedHost] resumeTermination];				
			events=nil; //Releasing is handled through sleight of hand.
			[packetDueDate release];packetDueDate=nil;
		} else if(endingModule) {
			//Failed to make packet. Panic or save away?
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
	if (disabled) return;
	
	[mutex lock];
	NSData * newEvent = [self generateEventObject:eventtype evtname:eventname data:data];
	VERBOSE_LOG(@"[INFO] Analytics enqueing event %@",newEvent);
	if(events==nil){
		[[TitaniumHost sharedHost] pauseTermination];
		events = [[NSMutableArray alloc] initWithObjects:newEvent,nil];
		if (!endingModule) {
			[self performSelectorOnMainThread:@selector(sendEvents) withObject:nil waitUntilDone:NO];
		}
	} else {
		[events	addObject:newEvent];
	}
	[mutex unlock];
}

#pragma mark -

- (void) pageLoaded;
{
	if (hasSentStart || disabled) return;
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
	NSString * mmodel = [platformDict objectForKey:@"model"];
	
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
						   VAL_OR_NSNULL(mmodel),@"model",
						   nil
						   ];
	[self enqueuePlatformEvent:@"ti.start" evtname: @"ti.start" data:data];
}


- (void) addEvent: (NSString *) eventtype evtname: (NSString *) eventname value: (id) value;
{
	if (disabled) return;
	
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

	TitaniumHost *tiHost = [TitaniumHost sharedHost];
	
	
	// determine if we can even do analytics at all -- we keep the analytics module in place but the 
	// method calls are no-op if analytics if off. this is so that it's easy to enabled/disable without
	// API bustage - analytics off effectively is a no-op on the API calls
	id analyticsEnablement = [[tiHost appProperties] objectForKey:@"analytics"];
	if (analyticsEnablement!=nil && [analyticsEnablement respondsToSelector:@selector(boolValue)])
	{
		disabled = [analyticsEnablement boolValue]==NO;
	}
	else 
	{
		disabled = NO;
	}
	
	NSLog(@"[DEBUG] Analytics is enabled = %@", (disabled ? @"NO":@"YES"));

	
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
				"var isUndefined=function(val){return ((val===null)||(typeof(val)==='undefined'))?true:((typeof(val)=='object')&&(String(val).length===0));};"
				"var pad=function(n) {"
			    	"return (n < 10 ? '0' : '') + String(n);"
			  	"};"
			  	"var formatUTC=function(d) {"
			  		"return ["
			  		    "d.getUTCFullYear() , '-',"
			  		    "pad(1 + d.getUTCMonth()), '-',"
			  		    "pad(d.getUTCDate()),"
			  		    "'T',"
			  		    "pad(d.getUTCHours()) ,':',"
			  		    "pad(d.getUTCMinutes()), ':',"
			  		    "pad(d.getUTCSeconds()),'+0000'"
			  		"].join('');"
				"};"
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
					"Titanium.Analytics.addEvent('app.timed_event', event, payload);"
				"} else {"
					"Titanium.API.error('timedEvent requires an event name');"
				"}"
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
	[[tiHost titaniumObject] setObject:methods forKey:@"Analytics"];
	
	return YES;
}

- (void) testConnection;
{
	NSURL * analyticsEchoUrl = [NSURL URLWithString:@"https://api.appcelerator.net/p/v1/echo"];

	NSMutableURLRequest * ourRequest = [NSMutableURLRequest requestWithURL:analyticsEchoUrl cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:300];
	NSURLResponse * response = nil;
	NSError * error = nil;

	NSData * result = [NSURLConnection sendSynchronousRequest:ourRequest returningResponse:&response error:&error];
	
	VERBOSE_LOG(@"[INFO] Analytics forced a request:%@ response:%@ error:%@",result,response,error);	
}



- (BOOL) endModule;
{
	if (disabled) return YES;
	
	// first add to our queue (so we can flush)
	endingModule = YES;

	[self enqueuePlatformEvent:@"ti.end" evtname:@"ti.end" data:nil];
	[self sendEvents];
	
//	[self testConnection];
	
	
	return YES;
}
@end
