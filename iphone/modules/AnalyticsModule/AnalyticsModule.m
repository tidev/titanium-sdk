/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "AnalyticsModule.h"
#import "PlatformModule.h"

extern NSString * APPLICATION_DEPLOYTYPE;

//TODO: we only need to send this once per unique phone detection
//and thereafter we can just send MID

//http://www.webdevelopersnotes.com/tips/html/finding_the_number_of_seconds_and_milliseconds.php3
NSString * analyticsModuleDictString = @"function(name,value){"
	"try{"
		"var url = 'https://api.appcelerator.net/p/v1/mobile-track';"
		"var stamp=new Date();"
		"var utcdate=stamp.getUTCDate();if(utcdate<10)utcdate='0'+utcdate;"
		"var utcmonth=stamp.getUTCMonth();if(utcmonth<10)utcmonth='0'+utcmonth;"

		"var utchour=stamp.getUTCHours();if(utchour<10)utchour='0'+utchour;"
		"var utcmin=stamp.getUTCMinutes();if(utcmin<10)utcmin='0'+utcmin;"
		"var utcsec=stamp.getUTCSeconds();if(utcsec<10)utcsec='0'+utcsec;"


		"var qsv='[{\"eventSid\":\"'+Titanium.Analytics.sid+"
			"'\",\"eventPayload\":'+Ti._JSON(value)+"
			"',\"eventId\",\"'+Titanium.App.getGUID()+"
			"'\",\"eventName\":\"'+name+"
			"'\",\"eventTimestamp\":\"'+stamp.getUTCFullYear()+'-'+"
			"utcmonth+'-'+utcdate+'T'+utchour+':'+utcmin+':'+utcsec+"
			"'\",\"eventMid\":\"'+Titanium.Platform.id+'\"}]';"

		"Titanium.API.debug(qsv);"

//		"qsv.mid = Titanium.Platform.id;"
//		"qsv.guid = Titanium.App.getGUID();"
//		"qsv.sid = Titanium.Analytics.sid;"
//		"qsv.mac_addr = Titanium.Platform.macaddress;"
//		"qsv.osver = Titanium.Platform.version;"
//		"qsv.platform = Titanium.platform;"
//		"qsv.version = Titanium.version;"
//		"qsv.model = Titanium.Platform.model;"
//		"qsv.app_version = Titanium.App.getVersion();"
//		"qsv.os = Titanium.Platform.name;"
//		"qsv.ostype = Titanium.Platform.ostype;"
//		"qsv.osarch = Titanium.Platform.architecture;"
//		"qsv.oscpu = Titanium.Platform.processorCount;"
//		"qsv.un = Titanium.Platform.username;"
//		"qsv.ip = Titanium.Platform.address;"
//		"qsv.phoneNumber = Titanium.Platform.phoneNumber;"
		"var xhr = Titanium.Network.createHTTPClient();"
		"xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');"
		"xhr.open('POST',url,true);"
		"xhr.send(qsv);"
		"delete qsv;"
	//	"alert(qsv);"
	"}catch(E){"
		"Titanium.API.debug('Error sending analytics data: '+E);"
	"}"
"}";


//[{	"eventSid":"bf577f87-98a4-474b-a614-5c3f448926a3",
//	"eventPayload":"",
//	"eventId":"b5687c06-6b6d-429a-a9fd-ef1c761b7b33:20013fd8f4da6591",
//	"eventName":"ti.end",
//	"eventTimestamp":"2009-06-15T21:46:28.685+0000",
//"eventMid":"20013fd8f4da6591"}]
//
//192.168.123.109 - - [15/Jun/2009 16:46:33] "POST / HTTP/1.1" 200 -
//[{	"eventSid":"bf577f87-98a4-474b-a614-5c3f448926a3",
//	"eventPayload":"",
//	"eventId":"b5687c06-6b6d-429a-a9fd-ef1c761b7b33:20013fd8f4da6591",
//	"eventName":"ti.end",
//	"eventTimestamp":"2009-06-15T21:46:28.685+0000",
//"eventMid":"20013fd8f4da6591"},
//
//{	"eventSid":"bf577f87-98a4-474b-a614-5c3f448926a3",
//	"eventPayload":
//	{"deploytype":"development",
//		"mac_addr":"00:18:41:d1:bc:a9",
//		"os":"Android Dev Phone 1",
//		"oscpu":1,
//		"ip":"127.0.0.1",
//		"mid":"20013fd8f4da6591",
//		"app_name":"Quick Brightkite Photo",
//		"model":"Android Dev Phone 1",
//		"platform":"android",
//		"version":"0.4",
//		"app_id":"net.donthorp.qbp",
//		"un":"android-build",
//		"app_version":"0.1",
//		"osarch":"ARMv6-compatible processor rev 2 (v6l)",
//		"ostype":"32bit",
//	"osver":"1.5"},
//	
//	"eventId":"6f8d55f3-a83c-4e46-85ab-283b03ba5bc4:20013fd8f4da6591",
//	"eventName":"ti.start",
//	"eventTimestamp":"2009-06-15T21:46:52.699+0000",
//	"eventMid":"20013fd8f4da6591"
//}]
//
//192.168.123.109 - - [15/Jun/2009 16:46:57] "POST / HTTP/1.1" 200 -
//[{"eventSid":"bf577f87-98a4-474b-a614-5c3f448926a3",
//	"eventPayload":"",
//	"eventId":"b5687c06-6b6d-429a-a9fd-ef1c761b7b33:20013fd8f4da6591",
//"eventName":"ti.end","eventTimestamp":"2009-06-15T21:46:28.685+0000","eventMid":"20013fd8f4da6591"},{"eventSid":"bf577f87-98a4-474b-a614-5c3f448926a3","eventPayload":{"deploytype":"development","mac_addr":"00:18:41:d1:bc:a9","os":"Android Dev Phone 1","oscpu":1,"ip":"127.0.0.1","mid":"20013fd8f4da6591","app_name":"Quick Brightkite Photo","model":"Android Dev Phone 1","platform":"android","version":"0.4","app_id":"net.donthorp.qbp","un":"android-build","app_version":"0.1","osarch":"ARMv6-compatible processor rev 2 (v6l)","ostype":"32bit","osver":"1.5"},"eventId":"6f8d55f3-a83c-4e46-85ab-283b03ba5bc4:20013fd8f4da6591","eventName":"ti.start","eventTimestamp":"2009-06-15T21:46:52.699+0000","eventMid":"20013fd8f4da6591"},{"eventSid":"bf577f87-98a4-474b-a614-5c3f448926a3","eventPayload":"","eventId":"72a9ae2b-e6cb-48ce-a340-4131da13a0b2:20013fd8f4da6591","eventName":"ti.end","eventTimestamp":"2009-06-15T21:47:06.249+0000","eventMid":"20013fd8f4da6591"}]


@implementation AnalyticsModule
@synthesize sessionID;

#pragma mark startModule

- (void) addEvent: (NSString *) name value: (id) value;
{
	SBJSON * encoder = [[SBJSON alloc] init];

	NSString * commandString = [NSString stringWithFormat:@"Ti.Analytics.addEvent(%@,%@)",
			[encoder stringWithFragment:name error:nil],[encoder stringWithFragment:value error:nil]];
	[[TitaniumHost sharedHost] sendJavascript:commandString];

	[encoder release];
}

#define VAL_OR_NSNULL(foo)	(((foo) != nil)?((id)foo):[NSNull null])

- (void) pageLoaded;
{
	if(callsMade == 0){
		NSString * deploytypeString = nil;
		NSDictionary * platformDict = [[[TitaniumHost sharedHost] titaniumObject] objectForKey:@"Platform"];
		NSString * macAddressString = [platformDict objectForKey:@"macaddress"];
		NSString * ipAddressString = [platformDict objectForKey:@"address"];

		NSDictionary * appPropertiesDict = [[TitaniumHost sharedHost] appProperties];
		NSString * appVersionString = [appPropertiesDict objectForKey:@"version"];
		NSString * appGUIDString = [appPropertiesDict objectForKey:@"guid"];
		NSString * appIDString = [appPropertiesDict objectForKey:@"id"];
		NSString * appNameString = [appPropertiesDict objectForKey:@"name"];
		NSString * appPublisherString = [appPropertiesDict objectForKey:@"publisher"];

		UIDevice * theDevice = [UIDevice currentDevice];		
		NSDictionary * deviceInfo = [[NSDictionary alloc] initWithObjectsAndKeys:
				@"iPhone",@"platform",
				@"0.4",@"version",
				VAL_OR_NSNULL(deploytypeString),@"deploytype",

				[theDevice model],@"model",
				[theDevice uniqueIdentifier],@"mid",
				VAL_OR_NSNULL(macAddressString),@"mac_addr",
				[theDevice systemVersion],@"osver",
				[theDevice systemName],@"os",
				@"32bit",@"ostype",
				@"arm",@"osarch",
				[NSNumber numberWithInt:1],@"oscpu",
				VAL_OR_NSNULL(ipAddressString),@"ip",
				[theDevice name],@"un",

				VAL_OR_NSNULL(appVersionString),@"app_version",
				VAL_OR_NSNULL(appGUIDString),@"app_guid",
				VAL_OR_NSNULL(appIDString),@"app_id",
				VAL_OR_NSNULL(appNameString),@"app_name",
				VAL_OR_NSNULL(appPublisherString),@"app_publisher",
									 
				nil];
		[self addEvent:@"ti.start" value:deviceInfo];
		[deviceInfo release];
	}
	callsMade ++;
}

- (BOOL) startModule
{
	TitaniumJSCode * addEventCode = [TitaniumJSCode codeWithString:analyticsModuleDictString];
	[addEventCode setEpilogueCode:@"Ti.Analytics._START();"];

	NSInvocation * handlePageInvoc = [TitaniumInvocationGenerator invocationWithTarget:self	selector:@selector(pageLoaded) object:nil];

	[self setSessionID:[(PlatformModule *)[[TitaniumHost sharedHost] moduleNamed:@"PlatformModule"] createUUID]];

	NSDictionary * analyticsDict = [NSDictionary dictionaryWithObjectsAndKeys:
			handlePageInvoc,@"_START",
			addEventCode,@"addEvent",
			sessionID,@"sid",
			nil];
	
	[[[TitaniumHost sharedHost] titaniumObject] setObject:analyticsDict forKey:@"Analytics"];
	return YES;
}

- (BOOL) endModule;
{
	NSLog(@"ti.analytics endModule");
	[self addEvent:@"ti.end" value:nil];
	return YES;
}
@end
