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

#define TI_ANALYTICS_TIMER_DELAY_IN_SEC 10
#define TI_ANALYTICS_NETWORK_TIMEOUT_IN_SEC 30
#define TI_ANALYTICS_NETWORK_TIMEOUT_ON_SHUTDOWN_IN_SEC 10


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

#pragma mark startModule

- (void) addEvent: (NSString *) name value: (id) value;
{
	NSDictionary * data = [NSDictionary dictionaryWithObjectsAndKeys:name,@"name",value,@"data",nil];
	[self sendPlatformEvent:@"ti.user" data:data];
}

#define VAL_OR_NSNULL(foo)	(((foo) != nil)?((id)foo):[NSNull null])

- (void) pageLoaded;
{
	if (callsMade == 0)
	{
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
								   VAL_OR_NSNULL(app_id),@"app_id",
								   @"32bit",@"ostype",
								   @"arm",@"osarch",
								   VAL_OR_NSNULL(phonenumber),@"phonenumber",
								   VAL_OR_NSNULL(model),@"model",
								   nil
								   ];
			[self sendPlatformEvent:@"ti.enroll" data:data];
		}
		
		
		int tz = [[NSTimeZone systemTimeZone] secondsFromGMT] / 3600; // get the timezone offset to UTC
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
		[self sendPlatformEvent:@"ti.start" data:data];
	}
	callsMade ++;
}

- (void) sendAsyncData: (NSData*)data timeout:(NSTimeInterval)timeout
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	NSMutableURLRequest *request = [ [ NSMutableURLRequest alloc ] initWithURL: [ NSURL URLWithString: @"https://api.appcelerator.net/p/v1/mobile-track" ] ]; 
	[request setHTTPMethod: @"POST"];
	[request setHTTPBody:data];
	[request setHTTPShouldHandleCookies:YES];
	[request setCachePolicy:NSURLRequestReloadIgnoringCacheData];
	[request setValue:@"text/json" forHTTPHeaderField:@"Content-Type"];
	[request setTimeoutInterval:timeout];
	[NSURLConnection sendSynchronousRequest: request returningResponse: nil error: nil ];
	[request release];
	[pool release];
}

-(NSString *)getUTCDate
{
	NSDateFormatter *dateFormatter = [[[NSDateFormatter alloc] init] autorelease];
	NSTimeZone *timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
	[dateFormatter setTimeZone:timeZone];
	//Example UTC full format: 2009-06-15T21:46:28.685+0000
	[dateFormatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss'.'SSS+0000"];
	return [dateFormatter stringFromDate:[NSDate date]];
}

- (NSData*) generateEventObject: (NSString*)name data:(id)data
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
	
	NSString *json = [encoder stringWithObject:[NSDictionary dictionaryWithObjectsAndKeys: 
		VAL_OR_NSNULL(eventId), @"id",
		[NSNumber numberWithInt:seq],@"seq",
		VAL_OR_NSNULL(aguid),@"aguid",
		VAL_OR_NSNULL(mid),@"mid",
		VAL_OR_NSNULL(ts),@"ts",
		@"1",@"ver", // spec version
		VAL_OR_NSNULL(sid),@"sid",
		VAL_OR_NSNULL(name),@"name",
		VAL_OR_NSNULL(data),@"data",
		nil] error:nil];
		
	[encoder release];

#ifdef DEBUG 
	NSLog(@"Generating Analytics event data: %@",json);
#endif
	
	return [json dataUsingEncoding:NSUTF8StringEncoding];
}

- (BOOL) startModule
{
	[self setSessionID:[(PlatformModule *)[[TitaniumHost sharedHost] moduleNamed:@"PlatformModule"] createUUID]];
	sequence = 1;
	callsMade = 0;
	timer = nil;
	events = [[NSMutableArray alloc] init];

	TitaniumJSCode * epilogueCode = [TitaniumJSCode codeWithString:@"Ti.Analytics._START()"];

	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	[(AnalyticsModule *)invocGen addEvent:nil value:nil];
	NSInvocation * setInvoc = [invocGen invocation];
	NSInvocation * handlePageInvoc = [TitaniumInvocationGenerator invocationWithTarget:self	selector:@selector(pageLoaded) object:nil];
	NSDictionary * methods = [NSDictionary dictionaryWithObjectsAndKeys:handlePageInvoc,@"_START",setInvoc,@"addEvent",epilogueCode,@"init",nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:methods forKey:@"Analytics"];

	return YES;
}

-(NSData*) getEventQueue;
{
	NSMutableData * data = [[NSMutableData alloc] init];
	[data appendData:[@"[" dataUsingEncoding:NSUTF8StringEncoding]];
	[mutex lock];
	int count = 0;
	for (NSData *eventdata in events)
	{
		[data appendData:eventdata];
		if (++count < [events count])
		{
			[data appendData:[@"," dataUsingEncoding:NSUTF8StringEncoding]];
		}
	}
	[data appendData:[@"]" dataUsingEncoding:NSUTF8StringEncoding]];
	[events removeAllObjects];
	[mutex unlock];
	return [data autorelease];
}

- (void) timerFired:(NSTimer*)theTimer;
{
	timer = nil; // for one-shot, has already been released
	NSData * data = [self getEventQueue];
	[self sendAsyncData:data timeout:TI_ANALYTICS_NETWORK_TIMEOUT_IN_SEC];
}

- (void)sendPlatformEvent:(NSString*)name data:(NSDictionary*)data;
{
	[mutex lock];
	[events addObject:[self generateEventObject:name data:data]];
	[mutex unlock];
	if (timer == nil)
	{
		timer = [NSTimer scheduledTimerWithTimeInterval:TI_ANALYTICS_TIMER_DELAY_IN_SEC target:self selector:@selector(timerFired:) userInfo:nil repeats:NO];
	}
}

- (BOOL) endModule;
{
	// first add to our queue (so we can flush)
	[mutex lock];
	[timer release];
	[events addObject:[self generateEventObject:@"ti.end" data:nil]];
	[mutex unlock];

	// make sure we attempt to flush the queue to get all events (if any are pending)
	NSData * data = [self getEventQueue];
	
	// make sure we do this on this main thread so it has more likelihood to succeed
	[self sendAsyncData:data timeout:TI_ANALYTICS_NETWORK_TIMEOUT_ON_SHUTDOWN_IN_SEC];
	
	return YES;
}
@end
