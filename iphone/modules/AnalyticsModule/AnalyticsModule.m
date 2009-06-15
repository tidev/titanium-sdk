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
NSString * analyticsModuleDictString = @"function(name,value){"
	"try{"
		"var url = 'https://api.appcelerator.net/p/v1/app-track';"
		"var async = true;"
		"var qsv = {};"
		"qsv.mid = Titanium.Platform.id;"
		"qsv.guid = Titanium.App.getGUID();"
		"qsv.sid = Titanium.Analytics.sid;"
		"qsv.mac_addr = Titanium.Platform.macaddress;"
		"qsv.osver = Titanium.Platform.version;"
		"qsv.platform = Titanium.platform;"
		"qsv.version = Titanium.version;"
		"qsv.model = Titanium.Platform.model;"
		"qsv.app_version = Titanium.App.getVersion();"
		"qsv.os = Titanium.Platform.name;"
		"qsv.ostype = Titanium.Platform.ostype;"
		"qsv.osarch = Titanium.Platform.architecture;"
		"qsv.oscpu = Titanium.Platform.processorCount;"
		"qsv.un = Titanium.Platform.username;"
		"qsv.ip = Titanium.Platform.address;"
		"qsv.phoneNumber = Titanium.Platform.phoneNumber;"
		"var xhr = Titanium.Network.createHTTPClient();"
		"xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');"
		"xhr.open('POST',url,true);"
		"xhr.send(qsv);"
	//	"alert(qsv);"
	"}catch(E){"
		"Titanium.API.debug('Error sending analytics data: '+E);"
	"}"
"}";

@implementation AnalyticsModule

#pragma mark startModule

- (void) addEvent: (NSString *) name value: (id) value;
{
	SBJSON * encoder = [[SBJSON alloc] init];

	NSString * commandString = [NSString stringWithFormat:@"Ti.Analytics.addEvent(%@,%@)",
			[encoder stringWithFragment:name error:nil],[encoder stringWithFragment:value error:nil]];
	[[TitaniumHost sharedHost] sendJavascript:commandString];

	[encoder release];
}

- (void) pageLoaded;
{
	if(callsMade == 0){
		[self addEvent:@"ti.start" value:nil];
	}
	callsMade ++;
}

- (BOOL) startModule
{
	TitaniumJSCode * addEventCode = [TitaniumJSCode codeWithString:analyticsModuleDictString];
	[addEventCode setEpilogueCode:@"Ti.Analytics._START();"];

	NSInvocation * handlePageInvoc = [TitaniumInvocationGenerator invocationWithTarget:self	selector:@selector(pageLoaded) object:nil];

	NSString * ourSid = [(PlatformModule *)[[TitaniumHost sharedHost] moduleNamed:@"PlatformModule"] createUUID];

	NSDictionary * analyticsDict = [NSDictionary dictionaryWithObjectsAndKeys:
			handlePageInvoc,@"_START",
			addEventCode,@"addEvent",
			ourSid,@"sid",
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
